#!/bin/bash
# deploy.sh — Portfolio Paradise deployment script
# Usage: ./deploy.sh [--no-cache] [--skip-health]
set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
# Absolute path to the directory containing docker-compose.yml
# Adjust if your docker-compose.yml is not one level above this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="$(dirname "$SCRIPT_DIR")"          # parent of portfolio-app/
COMPOSE_FILE="$COMPOSE_DIR/docker-compose.yml"

# Docker compose project name — must match what's in docker-compose.yml
# (or the directory name Docker uses by default)
PROJECT_NAME="portfolio-paradise"

# URL the app responds on (for health check)
HEALTH_URL="http://localhost:3000"
HEALTH_TIMEOUT=90      # seconds to wait for container to become healthy

# Number of old project images to keep as rollback snapshots (besides current)
KEEP_ROLLBACK=1

LOG_FILE="$COMPOSE_DIR/deploy.log"
LOCK_FILE="/tmp/${PROJECT_NAME}.deploy.lock"

# ── Flags ─────────────────────────────────────────────────────────────────────
NO_CACHE=false
SKIP_HEALTH=false
for arg in "$@"; do
  case $arg in
    --no-cache)    NO_CACHE=true ;;
    --skip-health) SKIP_HEALTH=true ;;
    --help|-h)
      echo "Usage: $0 [--no-cache] [--skip-health]"
      echo "  --no-cache     Force full rebuild (ignores Docker layer cache)"
      echo "  --skip-health  Skip HTTP health check after deploy"
      exit 0 ;;
  esac
done

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

# ── Helpers ───────────────────────────────────────────────────────────────────
ts()   { date '+%H:%M:%S'; }
log()  { echo -e "${BLUE}[$(ts)]${NC} $*" | tee -a "$LOG_FILE"; }
ok()   { echo -e "${GREEN}  ✓${NC} $*" | tee -a "$LOG_FILE"; }
warn() { echo -e "${YELLOW}  ⚠${NC} $*" | tee -a "$LOG_FILE"; }
fail() { echo -e "${RED}  ✗ FAILED:${NC} $*" | tee -a "$LOG_FILE"; exit 1; }

step() {
  STEP_NUM=$1; STEP_TOTAL=$2; shift 2
  echo -e "\n${BOLD}${CYAN}── Step ${STEP_NUM}/${STEP_TOTAL}: $*${NC}" | tee -a "$LOG_FILE"
}

# ── Sanity checks ─────────────────────────────────────────────────────────────
[ -f "$COMPOSE_FILE" ] || fail "docker-compose.yml not found at $COMPOSE_FILE"
command -v docker   >/dev/null 2>&1 || fail "docker not found"
command -v git      >/dev/null 2>&1 || fail "git not found"

# ── Lock — prevent concurrent deploys ─────────────────────────────────────────
cleanup() { rm -f "$LOCK_FILE"; }
trap cleanup EXIT

if [ -f "$LOCK_FILE" ]; then
  PID=$(cat "$LOCK_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    fail "Deploy already running (PID $PID). If stuck, remove $LOCK_FILE"
  else
    warn "Stale lock file found, removing"
    rm -f "$LOCK_FILE"
  fi
fi
echo $$ > "$LOCK_FILE"

# ── Header ────────────────────────────────────────────────────────────────────
{
echo ""
echo "════════════════════════════════════════════════════"
echo "  Portfolio Paradise — Deploy  $(date '+%Y-%m-%d %H:%M:%S')"
echo "  Compose: $COMPOSE_FILE"
echo "  Project: $PROJECT_NAME"
$NO_CACHE    && echo "  Mode: --no-cache (full rebuild)"
$SKIP_HEALTH && echo "  Health check: skipped"
echo "════════════════════════════════════════════════════"
} | tee -a "$LOG_FILE"

DEPLOY_START=$(date +%s)

# ── Step 1: Git pull ──────────────────────────────────────────────────────────
step 1 5 "Git pull"

cd "$SCRIPT_DIR"

# Stash any local server-side tweaks (shouldn't exist, but be safe)
if ! git diff --quiet || ! git diff --cached --quiet; then
  warn "Local changes detected — stashing automatically"
  git stash push -u -m "pre-deploy-stash-$(date +%s)" 2>&1 | tee -a "$LOG_FILE"
fi

BEFORE_COMMIT=$(git rev-parse HEAD)
git fetch origin 2>&1 | tee -a "$LOG_FILE"
BEHIND=$(git rev-list HEAD..origin/master --count 2>/dev/null \
         || git rev-list HEAD..origin/main --count 2>/dev/null)

if [ "$BEHIND" -eq 0 ]; then
  ok "Already up to date — $(git rev-parse --short HEAD)"
  SKIP_BUILD_PROMPT=true
else
  git reset --hard origin/master 2>/dev/null || git reset --hard origin/main
  AFTER_COMMIT=$(git rev-parse HEAD)
  ok "Pulled $BEHIND new commit(s):"
  git log --oneline "${BEFORE_COMMIT}..${AFTER_COMMIT}" \
    | sed 's/^/    /' | tee -a "$LOG_FILE"
  SKIP_BUILD_PROMPT=false
fi

# ── Step 2: Rollback snapshot ─────────────────────────────────────────────────
step 2 5 "Snapshot current image for rollback"

# Get the image ID of the currently running container
RUNNING_IMAGE=$(docker inspect "${PROJECT_NAME}" \
  --format '{{.Image}}' 2>/dev/null || true)

if [ -n "$RUNNING_IMAGE" ]; then
  ROLLBACK_TAG="${PROJECT_NAME}:rollback-$(date +%Y%m%d-%H%M)"
  docker tag "$RUNNING_IMAGE" "$ROLLBACK_TAG" 2>/dev/null && \
    ok "Rollback snapshot: $ROLLBACK_TAG" || \
    warn "Could not create rollback snapshot"
else
  warn "No running container found — skipping snapshot"
fi

# ── Step 3: Build ─────────────────────────────────────────────────────────────
step 3 5 "Docker build"

BUILD_ARGS="--pull"                    # always pull fresh base images
$NO_CACHE && BUILD_ARGS="$BUILD_ARGS --no-cache"

BUILD_START_TS=$(date +%s)
docker compose -f "$COMPOSE_FILE" build $BUILD_ARGS 2>&1 | tee -a "$LOG_FILE"
BUILD_END_TS=$(date +%s)
ok "Build completed in $(( BUILD_END_TS - BUILD_START_TS ))s"

# ── Step 4: Deploy ────────────────────────────────────────────────────────────
step 4 5 "Deploy containers"

docker compose -f "$COMPOSE_FILE" up -d --remove-orphans 2>&1 | tee -a "$LOG_FILE"

if ! $SKIP_HEALTH; then
  log "Waiting for app to respond at $HEALTH_URL (max ${HEALTH_TIMEOUT}s)..."
  for i in $(seq 1 "$HEALTH_TIMEOUT"); do
    if curl -sf --max-time 3 "$HEALTH_URL" > /dev/null 2>&1; then
      ok "App healthy after ${i}s"
      break
    fi
    if [ "$i" -eq "$HEALTH_TIMEOUT" ]; then
      # Print recent logs to help diagnose
      echo -e "\n${RED}Container logs (last 30 lines):${NC}" | tee -a "$LOG_FILE"
      docker compose -f "$COMPOSE_FILE" logs --tail=30 2>&1 | tee -a "$LOG_FILE"
      fail "Health check failed after ${HEALTH_TIMEOUT}s.
  Rollback: docker stop ${PROJECT_NAME} && docker tag $ROLLBACK_TAG <image> && docker compose -f $COMPOSE_FILE up -d"
    fi
    sleep 1
  done
else
  ok "Health check skipped"
fi

# ── Step 5: Cleanup (project-scoped) ─────────────────────────────────────────
step 5 5 "Cleanup Docker artifacts"

# 5a. Dangling (untagged) images — these are always build intermediates, safe globally
DANGLING_COUNT=$(docker images -f "dangling=true" -q | wc -l)
if [ "$DANGLING_COUNT" -gt 0 ]; then
  docker image prune -f 2>&1 | tee -a "$LOG_FILE"
  ok "Removed $DANGLING_COUNT dangling image(s)"
else
  ok "No dangling images"
fi

# 5b. Old rollback snapshots for THIS project only — keep KEEP_ROLLBACK most recent
# Lists rollback-* tags for this project, sorted oldest first, removes excess
ROLLBACK_TAGS=$(docker images --format "{{.Repository}}:{{.Tag}} {{.CreatedAt}}" \
  | grep "^${PROJECT_NAME}:rollback-" \
  | sort -t' ' -k2,3 \
  | awk '{print $1}')

ROLLBACK_COUNT=$(echo "$ROLLBACK_TAGS" | grep -c . || true)
if [ "$ROLLBACK_COUNT" -gt "$KEEP_ROLLBACK" ]; then
  TO_DELETE=$(echo "$ROLLBACK_TAGS" | head -n $(( ROLLBACK_COUNT - KEEP_ROLLBACK )))
  echo "$TO_DELETE" | while read -r tag; do
    docker rmi "$tag" 2>&1 | tee -a "$LOG_FILE" && warn "Removed old rollback: $tag" || true
  done
else
  ok "Rollback snapshots within limit ($ROLLBACK_COUNT/$KEEP_ROLLBACK)"
fi

# 5c. Build cache — keep 2 GB, prune older entries
# This is scoped to the Docker builder, not to other images on the host
docker builder prune --keep-storage 2GB -f 2>&1 | grep -E "^(Total|freed)" \
  | while read -r line; do ok "Build cache: $line"; done || true

# 5d. Disk usage summary — images only
IMAGES_SIZE=$(docker system df 2>/dev/null \
  | awk '/^Images/ {print $3 " used, " $4 " reclaimable"}' || echo "?")
ok "Docker images: $IMAGES_SIZE"

# ── Summary ───────────────────────────────────────────────────────────────────
DEPLOY_END=$(date +%s)
TOTAL_TIME=$(( DEPLOY_END - DEPLOY_START ))

{
echo ""
echo "════════════════════════════════════════════════════"
printf "${GREEN}  ✓ Deploy successful!${NC}  (${TOTAL_TIME}s total)\n"
echo "  Commit : $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s)"
echo "  Image  : $(docker compose -f "$COMPOSE_FILE" images 2>/dev/null | tail -1 | awk '{print $2}' || echo '?')"
[ -n "${ROLLBACK_TAG:-}" ] && echo "  Rollback: docker tag $ROLLBACK_TAG ${PROJECT_NAME}-${PROJECT_NAME}:latest && docker compose -f $COMPOSE_FILE up -d --no-build"
echo "════════════════════════════════════════════════════"
} | tee -a "$LOG_FILE"
