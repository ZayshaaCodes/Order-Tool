import { $, esc, generateCode, timeAgo, hashPasscode, verifyPasscode } from './utils.js';
import { FIREBASE_URL } from './firebase.js';
import { slugify, getShopUrl } from './shop.js';
import { menuTemplates, hydrateMenu, blankMenu } from './templates.js';

// === LANDING PICKER ===
// Shown when there is no ?shop= param: open an existing shop, create a new
// one with an invite code, or (for the admin) generate invite codes.

export function initShopPicker() {
  initLastShop();
  initOpenShop();
  initCreateShop();
  initAdminPanel();
}

// --- Continue to the last-used shop ---
function initLastShop() {
  const last = localStorage.getItem('op_last_shop');
  const btn = $('lastShopBtn');
  if (!last || !btn) return;
  btn.style.display = '';
  btn.textContent = `Continue to ${last} →`;
  btn.onclick = () => { window.location.href = getShopUrl(last); };
}

// --- Open an existing shop by name ---
function initOpenShop() {
  const input = $('openShopName');
  const btn = $('openShopBtn');
  const errorEl = $('openShopError');

  const go = async () => {
    errorEl.textContent = '';
    const slug = slugify(input.value.trim());
    if (!slug || slug.length < 2) {
      errorEl.textContent = 'Enter your shop name.';
      return;
    }
    btn.disabled = true;
    try {
      const res = await fetch(`${FIREBASE_URL}/shops/${encodeURIComponent(slug)}/name.json`);
      const name = await res.json();
      if (!name) {
        errorEl.textContent = 'No shop found with that name.';
        return;
      }
      window.location.href = getShopUrl(slug);
    } catch {
      errorEl.textContent = 'Could not reach the database. Try again.';
    } finally {
      btn.disabled = false;
    }
  };

  btn.onclick = go;
  input.onkeydown = (e) => { if (e.key === 'Enter') go(); };
}

// --- Create a new shop with an invite code ---
function initCreateShop() {
  // Starter menu options
  const select = $('starterTemplateSelect');
  select.innerHTML = '<option value="">Blank menu</option>';
  Object.keys(menuTemplates).forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });

  const nameInput = $('newShopName');
  const codeInput = $('shopInviteCode');
  const createBtn = $('createShopBtn');
  const errorEl = $('shopCreateError');

  createBtn.onclick = async () => {
    errorEl.textContent = '';
    const raw = nameInput.value.trim();
    const code = codeInput.value.trim().toUpperCase();
    if (!raw) { errorEl.textContent = 'Enter a shop name.'; return; }
    if (!code) { errorEl.textContent = 'Enter an invite code.'; return; }
    const slug = slugify(raw);
    if (!slug || slug.length < 2) { errorEl.textContent = 'Name must be at least 2 characters (letters/numbers).'; return; }
    if (slug.length > 48) { errorEl.textContent = 'Name is too long.'; return; }

    createBtn.disabled = true;
    try {
      // Validate the invite code
      const codeRes = await fetch(`${FIREBASE_URL}/inviteCodes/${encodeURIComponent(code)}.json`);
      const codeData = await codeRes.json();
      if (!codeData) { errorEl.textContent = 'Invalid invite code.'; return; }
      if (codeData.usedBy) { errorEl.textContent = 'This invite code has already been used.'; return; }

      // Check the shop doesn't already exist
      const check = await fetch(`${FIREBASE_URL}/shops/${encodeURIComponent(slug)}/name.json`);
      if (await check.json()) { errorEl.textContent = 'A shop with that name already exists.'; return; }

      // Mark the invite code as used (must happen BEFORE registering the
      // shop — the database rules verify code.usedBy == slug on creation)
      const useRes = await fetch(`${FIREBASE_URL}/inviteCodes/${encodeURIComponent(code)}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usedBy: slug, usedAt: Date.now() })
      });
      if (!useRes.ok) throw new Error('code claim failed');

      // Register the shop
      const shopRes = await fetch(`${FIREBASE_URL}/shops/${encodeURIComponent(slug)}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: raw, created: Date.now(), inviteCode: code })
      });
      if (!shopRes.ok) throw new Error('shop create failed');

      // Seed the menu from the chosen starter template
      const starterName = select.value;
      const seed = starterName && menuTemplates[starterName]
        ? hydrateMenu(menuTemplates[starterName])
        : blankMenu();
      seed._version = 1;
      await fetch(`${FIREBASE_URL}/shops/${encodeURIComponent(slug)}/menu.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seed)
      });

      window.location.href = getShopUrl(slug);
    } catch {
      errorEl.textContent = 'Could not create the shop. Check your connection and try again.';
    } finally {
      createBtn.disabled = false;
    }
  };
}

// --- Admin: invite code generation ---
function initAdminPanel() {
  const toggleBtn = $('adminToggleBtn');
  const panel = $('adminPanel');
  toggleBtn.onclick = () => {
    panel.style.display = panel.style.display === 'none' ? '' : 'none';
  };

  const adminPassInput = $('adminPasscode');
  const adminLoginBtn = $('adminLoginBtn');
  const adminError = $('adminError');
  const adminLoginArea = $('adminLoginArea');
  const adminControls = $('adminControls');

  adminPassInput.onkeydown = (e) => { if (e.key === 'Enter') adminLoginBtn.click(); };
  adminLoginBtn.onclick = async () => {
    adminError.textContent = '';
    const pass = adminPassInput.value;
    if (!pass) { adminError.textContent = 'Enter admin passcode.'; return; }
    try {
      const res = await fetch(`${FIREBASE_URL}/admin/passcode.json`);
      const stored = await res.json();

      if (!stored) {
        // First run — whoever sets it first becomes admin. The database
        // rules make this node write-once, so it can't be replaced later.
        const hashed = await hashPasscode(pass);
        const putRes = await fetch(`${FIREBASE_URL}/admin/passcode.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(hashed)
        });
        if (!putRes.ok) throw new Error();
        adminLoginArea.style.display = 'none';
        adminControls.style.display = '';
        loadInviteCodes();
        return;
      }

      const valid = await verifyPasscode(pass, stored);
      if (!valid) { adminError.textContent = 'Incorrect passcode.'; return; }
      adminLoginArea.style.display = 'none';
      adminControls.style.display = '';
      loadInviteCodes();
    } catch {
      adminError.textContent = 'Could not reach the database.';
    }
  };

  $('generateCodeBtn').onclick = async () => {
    const newCode = generateCode();
    try {
      const res = await fetch(`${FIREBASE_URL}/inviteCodes/${encodeURIComponent(newCode)}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ created: Date.now(), usedBy: null })
      });
      if (!res.ok) throw new Error();
      $('generatedCodeText').textContent = newCode;
      $('generatedCodeDisplay').style.display = '';
      loadInviteCodes();
    } catch {
      adminError.textContent = 'Failed to create code.';
    }
  };
}

async function loadInviteCodes() {
  const listEl = $('inviteCodeList');
  try {
    const res = await fetch(`${FIREBASE_URL}/inviteCodes.json`);
    const codes = await res.json();
    if (!codes) { listEl.innerHTML = '<p class="muted">No invite codes yet.</p>'; return; }

    const entries = Object.entries(codes).sort((a, b) => (b[1].created || 0) - (a[1].created || 0));
    listEl.innerHTML = entries.map(([code, data]) => {
      const used = !!data.usedBy;
      const status = used
        ? `Used by ${esc(data.usedBy)}${data.usedAt ? ' · ' + timeAgo(data.usedAt) : ''}`
        : 'Available';
      return `<div class="invite-code-row${used ? ' used' : ''}">
        <span class="code">${esc(code)}</span>
        <span class="code-status">${status}</span>
      </div>`;
    }).join('');
  } catch {
    listEl.innerHTML = '<p class="muted">Could not load invite codes.</p>';
  }
}
