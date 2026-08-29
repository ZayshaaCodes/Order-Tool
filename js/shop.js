// === TENANT RESOLUTION ===
// The shop is picked via the ?shop= query param. A strict allowlist regex
// keeps the value safe to interpolate into Firebase REST paths.
const params = new URLSearchParams(window.location.search);
const raw = params.get('shop') || '';
const SHOP_RE = /^[a-z0-9_-]{2,48}$/;

export const shopId = SHOP_RE.test(raw.toLowerCase()) ? raw.toLowerCase() : null;

// Local-only mode: no shop, no sync — the original Order Pad behavior.
// Old ?template= deep links keep working by implying local mode.
export const localMode = !shopId && (params.has('local') || params.has('template'));

export function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function getShopUrl(slug) {
  const url = new URL(window.location.href);
  url.search = '?shop=' + encodeURIComponent(slug);
  return url.toString();
}
