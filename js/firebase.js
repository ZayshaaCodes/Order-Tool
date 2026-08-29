import { $ } from './utils.js';
import { menu, saveMenuLocal } from './state.js';
import { shopId } from './shop.js';

export const FIREBASE_URL = 'https://orderpaddb-default-rtdb.firebaseio.com';

export function shopPath(path) {
  return `${FIREBASE_URL}/shops/${shopId}/${path}`;
}

// The menu keys that sync to /shops/{slug}/menu.
const MENU_KEYS = ['title', 'stylePreset', 'groups', 'items', 'specials'];

// === SYNC STATE ===
let syncTimer = null;
let syncInFlight = false;
let initialLoadDone = false;
let onRemoteData = null;

// Snapshot of each key's JSON as last confirmed on the server —
// used to detect which keys are dirty and need pushing.
let lastPushedJson = {};
let knownVersion = 0;

export function markInitialLoadDone() { initialLoadDone = true; }
export function onRemoteUpdate(fn) { onRemoteData = fn; }

export function scheduleSync() {
  if (!initialLoadDone) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => pushMenu(), 600);
}

/** Push pending changes immediately (after destructive ops like deletes). */
export function flushSync() {
  if (!initialLoadDone) return;
  clearTimeout(syncTimer);
  if (syncInFlight) {
    syncTimer = setTimeout(() => pushMenu(), 400);
    return;
  }
  pushMenu();
}

export function updateSyncBadge(text, ok) {
  const el = $('syncDot');
  if (!el) return;
  el.title = text;
  el.className = 'sync-dot' + (ok ? ' connected' : '');
}

function keyJson(k) {
  return JSON.stringify(menu[k] ?? null);
}

function getChangedKeys() {
  return MENU_KEYS.filter(k => keyJson(k) !== lastPushedJson[k]);
}

function snapshotAllKeys() {
  for (const k of MENU_KEYS) lastPushedJson[k] = keyJson(k);
}

/** Firebase may turn sparse arrays into objects — normalize back. */
function ensureArray(val) {
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object') return Object.values(val);
  return [];
}

function acceptRemoteKey(k, val) {
  if (k === 'groups' || k === 'items' || k === 'specials') {
    menu[k] = ensureArray(val);
  } else {
    menu[k] = val;
  }
  lastPushedJson[k] = keyJson(k);
}

// === SHOP VERIFICATION ===
// A shop only "exists" if the invite-code flow created its name node.
export async function fetchShopName() {
  const res = await fetch(shopPath('name.json'));
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

export function touchLastSeen() {
  fetch(shopPath('.json'), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lastSeen: Date.now() })
  }).catch(() => {});
}

// === LOAD ===
// On boot the server copy of the menu is authoritative (only owners edit it,
// and their changes were pushed within 600ms of being made).
export async function loadMenuFromFirebase() {
  try {
    updateSyncBadge('Loading...', false);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(shopPath('menu.json'), { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    if (data) {
      knownVersion = data._version || 0;
      menu._version = knownVersion;
      for (const k of MENU_KEYS) {
        if (data[k] !== undefined) acceptRemoteKey(k, data[k]);
      }
      snapshotAllKeys();
      saveMenuLocal();
    } else {
      // Empty menu node (shop created but never seeded) — treat local as new.
      snapshotAllKeys();
    }
    updateSyncBadge('Synced', true);
    return true;
  } catch {
    updateSyncBadge('Offline', false);
    // Baseline the current local state so stale data isn't treated as
    // dirty edits (and pushed) when the connection recovers.
    snapshotAllKeys();
    return false;
  }
}

// === PUSH (ETag-guarded compare-and-swap on menu/_version) ===
// If another client pushed between our read and write we get a 412,
// re-merge and retry.
const MAX_PUSH_RETRIES = 3;

export async function pushMenu() {
  if (syncInFlight || !initialLoadDone) return;

  if (getChangedKeys().length === 0) return;

  syncInFlight = true;
  try {
    updateSyncBadge('Saving...', false);

    let retries = 0;
    while (retries < MAX_PUSH_RETRIES) {
      // 1) Read the server version with its ETag
      const verRes = await fetch(shopPath('menu/_version.json'), {
        headers: { 'X-Firebase-ETag': 'true' }
      });
      const serverETag = verRes.headers.get('ETag');
      const serverVer = verRes.ok ? ((await verRes.json()) || 0) : knownVersion;

      // 2) If the server is ahead, merge: accept remote for clean keys,
      //    keep local for keys this client has edited since last push.
      if (serverVer > knownVersion) {
        const fullRes = await fetch(shopPath('menu.json'));
        if (fullRes.ok) {
          const serverData = await fullRes.json();
          if (serverData) {
            for (const k of MENU_KEYS) {
              if (serverData[k] === undefined) continue;
              if (keyJson(k) === lastPushedJson[k]) acceptRemoteKey(k, serverData[k]);
            }
            knownVersion = serverData._version || serverVer;
            saveMenuLocal();
          }
        }
      }

      const stillChanged = getChangedKeys();
      if (stillChanged.length === 0) {
        updateSyncBadge('Synced', true);
        return;
      }

      // 3) Claim the next version with a conditional PUT (atomic CAS)
      const newVersion = knownVersion + 1;
      const claimRes = await fetch(shopPath('menu/_version.json'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(serverETag ? { 'if-match': serverETag } : {})
        },
        body: JSON.stringify(newVersion)
      });

      if (claimRes.status === 412) {
        retries++;
        if (retries < MAX_PUSH_RETRIES) {
          updateSyncBadge('Retrying sync...', false);
          continue;
        }
        throw new Error('Version conflict after ' + MAX_PUSH_RETRIES + ' retries');
      }
      if (!claimRes.ok) throw new Error('Version PUT HTTP ' + claimRes.status);

      // 4) Version claimed — push the dirty keys
      menu._version = newVersion;
      const patch = {};
      for (const k of stillChanged) patch[k] = menu[k] ?? null;

      const res = await fetch(shopPath('menu.json'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);

      knownVersion = newVersion;
      for (const k of stillChanged) lastPushedJson[k] = keyJson(k);
      updateSyncBadge('Synced', true);
      return;
    }
  } catch {
    updateSyncBadge('Sync Error', false);
    scheduleSync();
  } finally {
    syncInFlight = false;
    if (getChangedKeys().length > 0) scheduleSync();
  }
}

// === APPLY REMOTE DATA (SSE events) ===
// Accept remote values for keys with no pending local edits; keep local
// (and re-push) for keys the user is mid-edit on.
function applyRemoteData(remoteData) {
  if (!remoteData || typeof remoteData !== 'object') return;

  let anyChange = false;
  let needsResync = false;

  if (remoteData._version !== undefined) {
    const rv = remoteData._version || 0;
    if (rv > knownVersion) knownVersion = rv;
    menu._version = knownVersion;
  }

  for (const k of MENU_KEYS) {
    if (remoteData[k] === undefined) continue;
    if (keyJson(k) === lastPushedJson[k]) {
      const before = keyJson(k);
      acceptRemoteKey(k, remoteData[k]);
      if (keyJson(k) !== before) anyChange = true;
    } else {
      // Local dirty edit in progress — keep it, push will reconcile.
      needsResync = true;
    }
  }

  saveMenuLocal();
  if (anyChange && onRemoteData) onRemoteData();
  updateSyncBadge('Synced', true);
  if (needsResync) scheduleSync();
}

// === REAL-TIME STREAMING (SSE) ===
let eventSource = null;

export function startStreaming() {
  if (eventSource) eventSource.close();
  eventSource = new EventSource(shopPath('menu.json'));

  function handleEvent(e) {
    try {
      const msg = JSON.parse(e.data);
      if (msg.data === null || msg.data === undefined) return;

      if (msg.path === '/') {
        applyRemoteData(msg.data);
      } else if (msg.path.startsWith('/')) {
        // Sub-path update (e.g. /items) — wrap it into a partial object.
        // Updates below a top-level key (e.g. /items/3/price) are rare with
        // our whole-key PATCHes; refetch the whole key for those.
        const parts = msg.path.split('/').filter(Boolean);
        if (parts.length === 1) {
          applyRemoteData({ [parts[0]]: msg.data });
        } else {
          refetchKey(parts[0]);
        }
      }
    } catch { /* ignore parse errors */ }
  }

  eventSource.addEventListener('put', handleEvent);
  eventSource.addEventListener('patch', handleEvent);

  eventSource.onerror = () => {
    updateSyncBadge('Reconnecting...', false);
  };
}

async function refetchKey(k) {
  if (!MENU_KEYS.includes(k) && k !== '_version') return;
  try {
    const res = await fetch(shopPath(`menu/${k}.json`));
    if (!res.ok) return;
    const data = await res.json();
    applyRemoteData({ [k]: data });
  } catch { /* transient */ }
}
