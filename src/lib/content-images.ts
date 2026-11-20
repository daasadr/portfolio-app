/**
 * Photos inside a page's text are stored as `<img src="/api/asset/<file uuid>">`.
 * Helpers shared by the public share page, the asset access check and the export.
 */

const ASSET_SRC_RE = /\/api\/asset\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\?[^"'\s>]*)?/gi;

/** File ids of all photos referenced in the page HTML. */
export function contentImageIds(html: string | null | undefined): string[] {
  if (!html) return [];
  return [...new Set([...html.matchAll(ASSET_SRC_RE)].map(m => m[1].toLowerCase()))];
}

/** Rewrites photo URLs so a visitor without an account can load them through a share link. */
export function withShareToken(html: string, token: string): string {
  if (!/^[a-zA-Z0-9_-]{10,}$/.test(token)) return html;
  return html.replace(ASSET_SRC_RE, (_m, id: string) => `/api/asset/${id}?share=${token}`);
}

/** Rewrites photo URLs with `map(id)`; ids the map does not know are left as they are. */
export function replaceContentImages(html: string, map: (id: string) => string | undefined): string {
  return html.replace(ASSET_SRC_RE, (m, id: string) => map(id.toLowerCase()) ?? m);
}
