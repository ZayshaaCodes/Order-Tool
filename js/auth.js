import { $, hashPasscode, verifyPasscode } from './utils.js';
import { shopPath } from './firebase.js';
import { shopId } from './shop.js';
import { showModal, hideModal } from './modals.js';

// === ACCESS CONTROL ===
// Two levels: 'viewer' (anyone with the shop link — can take orders) and
// 'owner' (knows the shop passcode — can edit the menu).
// Local mode has no lock at all; app.js never calls into here for it.
let accessLevel = 'viewer';

export function isOwner() { return accessLevel === 'owner'; }
export function getAccessLevel() { return accessLevel; }

const SESSION_KEY = shopId ? `op_access_${shopId}` : 'op_access';

export function lockOut() {
  accessLevel = 'viewer';
  sessionStorage.removeItem(SESSION_KEY);
}

export function restoreSession() {
  if (sessionStorage.getItem(SESSION_KEY) === 'owner') {
    accessLevel = 'owner';
  }
}

export async function checkPasscodeExists() {
  try {
    const res = await fetch(shopPath('passcode.json'));
    const data = await res.json();
    return !!data;
  } catch { return false; }
}

export function showUnlockModal(onSuccess) {
  showModal(`
    <h3>🔒 Owner Unlock</h3>
    <p class="modal-text">Enter the owner passcode to edit this shop's menu.</p>
    <div class="control-group mb-8">
      <input id="unlockCode" type="password" placeholder="Enter passcode" style="flex:1;" />
    </div>
    <div id="unlockError" class="modal-error"></div>
    <div class="modal-actions">
      <button class="btn" id="unlockCancel">Cancel</button>
      <button class="btn primary" id="unlockSubmit">Unlock</button>
    </div>
  `);
  $('unlockCode').focus();
  $('unlockCancel').onclick = hideModal;
  $('unlockCode').onkeydown = (e) => { if (e.key === 'Enter') $('unlockSubmit').click(); };
  $('unlockSubmit').onclick = async () => {
    const code = $('unlockCode').value;
    if (!code) return;
    try {
      const res = await fetch(shopPath('passcode.json'));
      const stored = await res.json();
      if (stored && await verifyPasscode(code, stored)) {
        accessLevel = 'owner';
        sessionStorage.setItem(SESSION_KEY, 'owner');
        hideModal();
        if (onSuccess) onSuccess();
      } else {
        $('unlockError').textContent = 'Incorrect passcode.';
      }
    } catch {
      $('unlockError').textContent = 'Could not verify. Check connection.';
    }
  };
}

export function showSetPasscodeModal(onSuccess) {
  showModal(`
    <h3>🔑 Set Owner Passcode</h3>
    <p class="modal-text">No passcode set yet. Create one to protect menu editing.</p>
    <div class="control-group mb-8">
      <input id="newPasscode" type="password" placeholder="New passcode" style="flex:1;" />
    </div>
    <div class="control-group mb-8">
      <input id="confirmPasscode" type="password" placeholder="Confirm passcode" style="flex:1;" />
    </div>
    <div id="setPassError" class="modal-error"></div>
    <div class="modal-actions">
      <button class="btn" id="setPassCancel">Cancel</button>
      <button class="btn primary" id="setPassSubmit">Set Passcode</button>
    </div>
  `);
  $('newPasscode').focus();
  $('setPassCancel').onclick = hideModal;
  $('confirmPasscode').onkeydown = (e) => { if (e.key === 'Enter') $('setPassSubmit').click(); };
  $('setPassSubmit').onclick = async () => {
    const code = $('newPasscode').value;
    const confirm = $('confirmPasscode').value;
    if (!code) { $('setPassError').textContent = 'Enter a passcode.'; return; }
    if (code.length < 4) { $('setPassError').textContent = 'Passcode must be at least 4 characters.'; return; }
    if (code !== confirm) { $('setPassError').textContent = 'Passcodes do not match.'; return; }
    try {
      const hashed = await hashPasscode(code);
      const res = await fetch(shopPath('passcode.json'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hashed)
      });
      if (!res.ok) throw new Error();
      accessLevel = 'owner';
      sessionStorage.setItem(SESSION_KEY, 'owner');
      hideModal();
      if (onSuccess) onSuccess();
    } catch {
      $('setPassError').textContent = 'Failed to save. Check connection.';
    }
  };
}

export function showChangePasscodeModal() {
  showModal(`
    <h3>🔑 Change Owner Passcode</h3>
    <div class="control-group mb-8">
      <input id="oldPasscode" type="password" placeholder="Current passcode" style="flex:1;" />
    </div>
    <div class="control-group mb-8">
      <input id="newPasscode2" type="password" placeholder="New passcode" style="flex:1;" />
    </div>
    <div class="control-group mb-8">
      <input id="confirmPasscode2" type="password" placeholder="Confirm new passcode" style="flex:1;" />
    </div>
    <div id="changePassError" class="modal-error"></div>
    <div class="modal-actions">
      <button class="btn" id="changePassCancel">Cancel</button>
      <button class="btn primary" id="changePassSubmit">Change</button>
    </div>
  `);
  $('oldPasscode').focus();
  $('changePassCancel').onclick = hideModal;
  $('confirmPasscode2').onkeydown = (e) => { if (e.key === 'Enter') $('changePassSubmit').click(); };
  $('changePassSubmit').onclick = async () => {
    const old = $('oldPasscode').value;
    const code = $('newPasscode2').value;
    const confirm = $('confirmPasscode2').value;
    if (!old || !code) { $('changePassError').textContent = 'Fill in all fields.'; return; }
    if (code.length < 4) { $('changePassError').textContent = 'New passcode must be at least 4 characters.'; return; }
    if (code !== confirm) { $('changePassError').textContent = 'New passcodes do not match.'; return; }
    try {
      const res = await fetch(shopPath('passcode.json'));
      const stored = await res.json();
      const valid = await verifyPasscode(old, stored);
      if (!valid) { $('changePassError').textContent = 'Current passcode is incorrect.'; return; }
      const newHashed = await hashPasscode(code);
      await fetch(shopPath('passcode.json'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHashed)
      });
      hideModal();
    } catch {
      $('changePassError').textContent = 'Failed to update. Check connection.';
    }
  };
}
