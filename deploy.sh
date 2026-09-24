#!/bin/bash
# deploy.sh — Portfolio Paradise deployment script
# Usage: ./deploy.sh [--no-cache] [--skip-health]
#
# Pro logování do souboru: ./deploy.sh 2>&1 | tee deploy.log
set -euo pipefail

# Tato řádka se VŽDY musí zobrazit. Pokud ne, bash nemůže spustit skript.
echo "Portfolio Paradise — deploy.sh (PID $$, $(date '+%Y-%m-%d %H:%M:%S'))"

# ── Config ────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="portfolio-paradise"

# Compose soubor — buď manuální override, nebo vždy vedle deploy.sh
if [ -z "${COMPOSE_FILE:-}" ]; then
  for name in docker-compose.prod.yml docker-compose.yml; do
    if [ -f "$SCRIPT_DIR/$name" ]; then COMPOSE_FILE="$SCRIPT_DIR/$name"; break; fi
  done
fi
if [ -z "${COMPOSE_FILE:-}" ]; then
  echo "CHYBA: docker-compose.yml nenalezen v $SCRIPT_DIR" >&2
  echo "  Manuální override: COMPOSE_FILE=/cesta/k/docker-compose.yml ./deploy.sh" >&2
  exit 1
fi

COMPOSE_DIR="$(dirname "$COMPOSE_FILE")"
COMPOSE_NAME="$(basename "$COMPOSE_FILE")"
cd "$COMPOSE_DIR"

HEALTH_URL="http://localhost:3004"
HEALTH_TIMEOUT=90
KEEP_ROLLBACK=1

# ── Flags ─────────────────────────────────────────────────────────────────────
NO_CACHE=false
SKIP_HEALTH=false
for arg in "$@"; do
  case $arg in
    --no-cache)    NO_CACHE=true ;;
    --skip-health) SKIP_HEALTH=true ;;
    --help|-h)
      echo "Usage: $0 [--no-cache] [--skip-health]"
      echo "  --no-cache     Plný rebuild (ignoruje Docker cache)"
      echo "  --skip-health  Přeskočí HTTP health check"
      exit 0 ;;
  esac
done

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

ok()   { echo -e "${GREEN}  ✓${NC} $*"; }
warn() { echo -e "${YELLOW}  ⚠${NC} $*"; }
fail() { echo -e "${RED}  ✗ SELHALO:${NC} $*" >&2; exit 1; }
log()  { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $*"; }
step() { echo -e "\n${BOLD}${CYAN}── Krok $1/$2: $3${NC}"; }

# ── Sanity checks ─────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════"
echo "  Compose : $COMPOSE_FILE"
echo "  Project : $PROJECT_NAME"
if [ "$NO_CACHE" = true ];    then echo "  Režim   : --no-cache (plný rebuild)"; fi
if [ "$SKIP_HEALTH" = true ]; then echo "  Health  : přeskočen"; fi
echo "════════════════════════════════════════════════════"

[ -f "$COMPOSE_FILE" ] || fail "Compose soubor nenalezen: $COMPOSE_FILE"
command -v docker >/dev/null 2>&1 || fail "docker nenalezen"
command -v git    >/dev/null 2>&1 || fail "git nenalezen"

# ── Lock ──────────────────────────────────────────────────────────────────────
LOCK_FILE="/tmp/${PROJECT_NAME}.deploy.lock"
cleanup() { rm -f "$LOCK_FILE"; }
trap cleanup EXIT

if [ -f "$LOCK_FILE" ]; then
  PID=$(cat "$LOCK_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    fail "Deploy již běží (PID $PID). Pokud zaseknutý: rm $LOCK_FILE"
  else
    warn "Stará zámková soubor, odstraňuji"
    rm -f "$LOCK_FILE"
  fi
fi
echo $$ > "$LOCK_FILE"

DEPLOY_START=$(date +%s)

# ── Krok 1: Git pull ──────────────────────────────────────────────────────────
step 1 5 "Git pull"
cd "$SCRIPT_DIR"

if ! git diff --quiet || ! git diff --cached --quiet; then
  warn "Lokální změny — stashuji automaticky"
  git stash push -u -m "pre-deploy-stash-$(date +%s)"
fi

BEFORE_COMMIT=$(git rev-parse HEAD)
git fetch origin

# Zjistit, jak moc jsme pozadu za remote
BEHIND=0
BEHIND="$(git rev-list HEAD..origin/master --count 2>/dev/null)" || \
BEHIND="$(git rev-list HEAD..origin/main   --count 2>/dev/null)" || \
BEHIND=0

if [ "${BEHIND:-0}" -eq 0 ]; then
  ok "Aktuální — $(git rev-parse --short HEAD)"
else
  git reset --hard origin/master 2>/dev/null || git reset --hard origin/main
  AFTER_COMMIT=$(git rev-parse HEAD)
  ok "Staženo $BEHIND nových commit(ů):"
  git log --oneline "${BEFORE_COMMIT}..${AFTER_COMMIT}" | sed 's/^/    /'
fi

# ── Krok 2: Rollback snapshot ─────────────────────────────────────────────────
step 2 5 "Snapshot pro rollback"
cd "$COMPOSE_DIR"

ROLLBACK_TAG=""
RUNNING_IMAGE="$(docker inspect "${PROJECT_NAME}" --format '{{.Image}}' 2>/dev/null)" || true
if [ -n "${RUNNING_IMAGE:-}" ]; then
  ROLLBACK_TAG="${PROJECT_NAME}:rollback-$(date +%Y%m%d-%H%M)"
  if docker tag "$RUNNING_IMAGE" "$ROLLBACK_TAG" 2>/dev/null; then
    ok "Rollback snapshot: $ROLLBACK_TAG"
  else
    warn "Snapshot se nepodařilo vytvořit"
    ROLLBACK_TAG=""
  fi
else
  warn "Žádný běžící kontejner — přeskakuji snapshot"
fi

# ── Krok 3: Build ─────────────────────────────────────────────────────────────
step 3 5 "Docker build"

BUILD_ARGS="--pull"
if [ "$NO_CACHE" = true ]; then BUILD_ARGS="$BUILD_ARGS --no-cache"; fi

BUILD_START_TS=$(date +%s)
docker compose -f "$COMPOSE_NAME" build $BUILD_ARGS
BUILD_END_TS=$(date +%s)
ok "Build hotov za $(( BUILD_END_TS - BUILD_START_TS ))s"

# ── Krok 4: Deploy ────────────────────────────────────────────────────────────
step 4 5 "Spuštění kontejnerů"
docker compose -f "$COMPOSE_NAME" up -d --remove-orphans

if [ "$SKIP_HEALTH" = false ]; then
  log "Čekám na odpověď na $HEALTH_URL (max ${HEALTH_TIMEOUT}s)..."
  HEALTHY=false
  for i in $(seq 1 "$HEALTH_TIMEOUT"); do
    if curl -sf --max-time 3 "$HEALTH_URL" > /dev/null 2>&1; then
      ok "Aplikace zdravá po ${i}s"
      HEALTHY=true
      break
    fi
    sleep 1
  done
  if [ "$HEALTHY" = false ]; then
    echo -e "\n${RED}Logy kontejnerů (posledních 30 řádků):${NC}"
    docker compose -f "$COMPOSE_NAME" logs --tail=30
    fail "Health check selhal po ${HEALTH_TIMEOUT}s."
  fi
else
  ok "Health check přeskočen"
fi

# ── Krok 5: Cleanup ───────────────────────────────────────────────────────────
step 5 5 "Úklid Docker artefaktů"

DANGLING_COUNT="$(docker images -f "dangling=true" -q | wc -l)" || true
if [ "${DANGLING_COUNT:-0}" -gt 0 ]; then
  docker image prune -f
  ok "Odstraněno $DANGLING_COUNT dangling image(s)"
else
  ok "Žádné dangling images"
fi

# Rollback snapshots — ponechat max KEEP_ROLLBACK
ROLLBACK_TAGS="$(docker images --format "{{.Repository}}:{{.Tag}} {{.CreatedAt}}" \
  | grep "^${PROJECT_NAME}:rollback-" \
  | sort -t' ' -k2,3 \
  | awk '{print $1}')" || true

ROLLBACK_COUNT="$(echo "${ROLLBACK_TAGS:-}" | grep -c . || true)"
if [ "${ROLLBACK_COUNT:-0}" -gt "$KEEP_ROLLBACK" ]; then
  TO_DELETE="$(echo "$ROLLBACK_TAGS" | head -n $(( ROLLBACK_COUNT - KEEP_ROLLBACK )))"
  echo "$TO_DELETE" | while read -r tag; do
    docker rmi "$tag" && warn "Odstraněn starý rollback: $tag" || true
  done
else
  ok "Rollback snapshots v limitu ($ROLLBACK_COUNT/$KEEP_ROLLBACK)"
fi

docker builder prune --keep-storage 2GB -f 2>&1 | grep -E "^(Total|freed)" \
  | while read -r line; do ok "Build cache: $line"; done || true

IMAGES_SIZE="$(docker system df 2>/dev/null \
  | awk '/^Images/ {print $3 " used, " $4 " reclaimable"}' || echo "?")"
ok "Docker images: $IMAGES_SIZE"

# ── Souhrn ────────────────────────────────────────────────────────────────────
DEPLOY_END=$(date +%s)
TOTAL_TIME=$(( DEPLOY_END - DEPLOY_START ))

echo ""
echo "════════════════════════════════════════════════════"
printf "${GREEN}  ✓ Deploy úspěšný!${NC}  (${TOTAL_TIME}s celkem)\n"
echo "  Commit : $(git -C "$SCRIPT_DIR" rev-parse --short HEAD) — $(git -C "$SCRIPT_DIR" log -1 --pretty=%s)"
if [ -n "${ROLLBACK_TAG:-}" ]; then
  echo "  Rollback: docker tag $ROLLBACK_TAG ${PROJECT_NAME}:latest && docker compose -f $COMPOSE_NAME up -d --no-build"
fi
echo "════════════════════════════════════════════════════"
