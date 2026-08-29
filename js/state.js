import { shopId } from './shop.js';
import { menuTemplates, hydrateMenu, blankMenu } from './templates.js';

// localStorage is namespaced per shop so multiple shops can be open
// in the same browser without clobbering each other.
const NS = shopId ? `op_${shopId}` : 'op_local';
export const MENU_KEY = `${NS}_menu`;
export const LOCAL_KEY = `${NS}_local`;

function loadJson(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

// === PER-DEVICE STATE ===
// Never synced: the in-progress order, discount, receipt prefs, UI bits.
export const local = Object.assign({
  order: {},            // { itemId: qty }
  lastOrder: null,
  discountPct: 0,
  loadedTemplate: '',
  currentTab: 'ordering'
}, loadJson(LOCAL_KEY, {}));

// === SHARED MENU STATE ===
// For a shop this mirrors /shops/{slug}/menu in Firebase; in local mode it
// only lives in localStorage. Mutate in place, then call saveMenuLocal().
export const menu = loadJson(MENU_KEY, null) || migrateLegacyLocal() || defaultMenu();

// A freshly hydrated default menu mints new item ids — persist immediately
// so the ids (and any order referencing them) stay stable across reloads.
if (!localStorage.getItem(MENU_KEY)) {
  localStorage.setItem(MENU_KEY, JSON.stringify(menu));
}

function defaultMenu() {
  // Local mode starts with the KOI starter like the old app; a shop starts
  // empty until its seeded menu arrives from Firebase.
  if (!shopId) {
    const m = hydrateMenu(menuTemplates['KOI']);
    m._version = 0;
    return m;
  }
  return { ...blankMenu(), _version: 0 };
}

// One-time migration from the pre-2.0 sop_* localStorage keys so an
// existing local-mode setup keeps its customized menu.
function migrateLegacyLocal() {
  if (shopId) return null;
  const items = loadJson('sop_items_v1', null);
  if (!Array.isArray(items)) return null;
  const m = {
    _version: 0,
    title: loadJson('sop_title_v1', 'Receipt'),
    stylePreset: loadJson('sop_style_preset_v1', 'default'),
    groups: loadJson('sop_groups_v1', []),
    items,
    specials: loadJson('sop_specials_v1', [])
  };
  local.order = loadJson('sop_order_v1', {});
  local.lastOrder = loadJson('sop_last_order_v1', null);
  local.discountPct = loadJson('sop_discount_v1', 0);
  local.loadedTemplate = localStorage.getItem('sop_loaded_template') || '';
  local.currentTab = localStorage.getItem('sop_current_tab') || 'ordering';
  saveLocal();
  localStorage.setItem(MENU_KEY, JSON.stringify(m));
  return m;
}

export function saveMenuLocal() {
  localStorage.setItem(MENU_KEY, JSON.stringify(menu));
}

export function saveLocal() {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(local));
}

/** Replace the whole menu content (template load, import, remote snapshot). */
export function replaceMenu(next) {
  menu.title = next.title || 'Receipt';
  menu.stylePreset = next.stylePreset || 'default';
  menu.groups = next.groups || [];
  menu.items = next.items || [];
  menu.specials = next.specials || [];
  if (next._version !== undefined) menu._version = next._version;
  saveMenuLocal();
}

export function getItem(id) {
  return menu.items.find(i => i.id === id) || menu.specials.find(s => s.id === id);
}
