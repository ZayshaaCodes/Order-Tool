import { $, esc } from './utils.js';

export function showModal(html) {
  $('modalContent').innerHTML = html;
  $('modalOverlay').style.display = '';
}

export function hideModal() {
  $('modalOverlay').style.display = 'none';
}

export function showConfirmModal(message, onConfirm) {
  showModal(`
    <h3>Confirm</h3>
    <p class="modal-text">${esc(message)}</p>
    <div class="modal-actions">
      <button class="btn" id="modalCancel">Cancel</button>
      <button class="btn danger" id="modalConfirm">Confirm</button>
    </div>
  `);
  $('modalCancel').onclick = hideModal;
  $('modalConfirm').onclick = () => { hideModal(); onConfirm(); };
}
