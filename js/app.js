import { $, money, esc, uid, createElement, createButton, createInput } from './utils.js';
import { shopId, localMode } from './shop.js';
import { menu, local, getItem, saveMenuLocal, saveLocal, replaceMenu } from './state.js';
import { stylePresets, normalizeStylePreset, findTemplate, hydrateMenu } from './templates.js';
import { fetchShopName, loadMenuFromFirebase, markInitialLoadDone, onRemoteUpdate,
         startStreaming, scheduleSync, flushSync, touchLastSeen, updateSyncBadge } from './firebase.js';
import { isOwner, lockOut, restoreSession, checkPasscodeExists,
         showUnlockModal, showSetPasscodeModal, showChangePasscodeModal } from './auth.js';
import { initShopPicker } from './picker.js';

const isShop = !!shopId;

// === PERSISTENCE HELPERS ===
// Menu changes sync to Firebase (shop mode, owner only); order/receipt
// state is per-device and stays in localStorage.
function persistMenu() {
  saveMenuLocal();
  if (isShop && isOwner()) scheduleSync();
}

function persistMenuFlush() {
  saveMenuLocal();
  if (isShop && isOwner()) flushSync();
}

function persistLocal() {
  local.discountPct = Number($('discountPct').value || 0);
  saveLocal();
}

function showStatus(message, duration = 1500) {
  const el = $('statusToast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(showStatus._t);
  if (duration) showStatus._t = setTimeout(() => el.classList.remove('show'), duration);
}

// === LAST ORDER ===
const saveLastOrder = () => {
  if (Object.keys(local.order).length > 0) {
    local.lastOrder = { ...local.order };
    saveLocal();
  }
};

const updateLastOrderButton = () => {
  const btn = $('lastOrderBtn');
  if (!btn) return;
  const last = local.lastOrder;
  btn.style.display = (last && Object.keys(last).length > 0) ? '' : 'none';
};

// === STYLE PRESETS ===
function applyStylePreset(preset, shouldPersist = true) {
  menu.stylePreset = normalizeStylePreset(preset);
  document.body.dataset.stylePreset = menu.stylePreset;

  const select = $('stylePresetSelect');
  if (select) select.value = menu.stylePreset;

  if (shouldPersist) persistMenu();
}

function populateStylePresetSelect() {
  const select = $('stylePresetSelect');
  if (!select) return;

  select.innerHTML = '';
  Object.entries(stylePresets).forEach(([id, preset]) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = preset.label;
    select.appendChild(option);
  });

  select.value = normalizeStylePreset(menu.stylePreset);
  select.onchange = () => applyStylePreset(select.value);
}

// === ORDER OPERATIONS ===
function addToOrder(id) {
  local.order[id] = (local.order[id] || 0) + 1;
  persistLocal();
  render();
  const btnEl = document.querySelector(`[data-item-id="${id}"] .btn, [data-item-id="${id}"]`);
  if (btnEl) {
    btnEl.classList.remove('btn-add-pulse');
    void btnEl.offsetWidth; // force reflow
    btnEl.classList.add('btn-add-pulse');
    setTimeout(() => btnEl.classList.remove('btn-add-pulse'), 300);
  }
}

function setQty(id, qty) {
  if (qty <= 0) delete local.order[id];
  else local.order[id] = qty;
  persistLocal();
  render();
}

function calc() {
  const lines = Object.entries(local.order)
    .map(([id, qty]) => {
      const it = getItem(id);
      if (!it) return null;
      const lineTotal = it.price * qty;
      return { name: it.name, price: it.price, qty, lineTotal };
    })
    .filter(Boolean);

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const discount = subtotal * (Number($('discountPct').value || 0) / 100);
  const total = subtotal - discount;
  return { lines, subtotal, discount, total };
}

// Component breakdown (for inventory/kitchen prep)
function getComponentBreakdown() {
  const components = {};

  const parseSubItem = (subItem) => {
    const match = subItem.trim().match(/^(\d+)x\s*(.+)$/i);
    if (match) {
      return { qty: parseInt(match[1]), name: match[2].trim() };
    }
    return { qty: 1, name: subItem.trim() };
  };

  Object.entries(local.order).forEach(([id, qty]) => {
    const item = getItem(id);
    if (!item) return;

    if (item.subItems && item.subItems.length > 0) {
      item.subItems.forEach(subItemStr => {
        const { qty: subQty, name } = parseSubItem(subItemStr);
        components[name] = (components[name] || 0) + (qty * subQty);
      });
    } else {
      components[item.name] = (components[item.name] || 0) + qty;
    }
  });

  return Object.entries(components)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// === RECEIPT TEXT ===
function receiptText() {
  const { lines, subtotal, discount, total } = calc();
  const t = ($('receiptTitle').value || 'Receipt').trim();

  const now = new Date();
  const stamp = now.toLocaleString();

  const body = [];
  body.push(t);
  body.push(stamp);
  body.push('');
  if (!lines.length) {
    body.push('(no items)');
  } else {
    for (const l of lines) {
      body.push(`${l.qty} x ${l.name} @ $${money(l.price)} = $${money(l.lineTotal)}`);
      const item = getItem(Object.keys(local.order).find(id => {
        const it = getItem(id);
        return it && it.name === l.name;
      }));
      if (item && item.subItems && item.subItems.length > 0) {
        item.subItems.forEach(subItem => {
          body.push(`  - ${subItem}`);
        });
      }
    }
    body.push('');
    body.push(`Subtotal: $${money(subtotal)}`);
    const discPct = Number($('discountPct').value || 0);
    if (discPct > 0) body.push(`Discount (${money(discPct)}%): -$${money(discount)}`);
    body.push(`Total: $${money(total)}`);

    const showBreakdown = $('showBreakdownInReceipt') && $('showBreakdownInReceipt').checked;
    if (showBreakdown) {
      const components = getComponentBreakdown();
      const hasSpecials = Object.keys(local.order).some(id => {
        const item = getItem(id);
        return item && item.subItems && item.subItems.length > 0;
      });

      if (hasSpecials && components.length > 0) {
        body.push('');
        body.push('--- Component Breakdown ---');
        components.forEach(({ name, qty }) => {
          body.push(`${qty}x ${name}`);
        });
      }
    }
  }
  return body.join('\n');
}

function shorthandReceiptText() {
  const { lines, subtotal, discount, total } = calc();
  if (!lines.length) return '(no items)';
  const parts = lines.map(l => l.qty > 1 ? `${l.qty}x ${l.name}` : l.name);
  const discPct = Number($('discountPct').value || 0);
  const totalStr = discPct > 0 ? `Total: $${money(total)} (was $${money(subtotal)})` : `Total: $${money(total)}`;
  return parts.join(', ') + ' | ' + totalStr;
}

function refreshOrderViews() {
  renderButtons();
  renderOrder();
  renderReceipt();
  updateJsonTextbox();
}

// === RENDER: ORDER BUTTONS ===
function renderButtons() {
  const wrap = $('itemButtons');
  wrap.innerHTML = '';

  const createMenuBtn = (item, isSpecial) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'menu-btn-wrap';
    wrapper.dataset.itemId = item.id;

    const b = document.createElement('button');
    b.className = 'btn' + (isSpecial ? ' special-btn' : '');

    const emojiSpan = item.emoji ? `<span class="btn-emoji">${esc(item.emoji)}</span>` : '';
    b.innerHTML = `${emojiSpan}${esc(item.name)} ($${money(item.price)})`;

    b.style.backgroundColor = item.color || (isSpecial ? '#dc2626' : '#6b7280');
    b.style.borderColor = item.color || (isSpecial ? '#dc2626' : '#6b7280');
    b.style.color = '#ffffff';
    b.onclick = (e) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        local.order[item.id] = (local.order[item.id] || 0) + 5;
        persistLocal();
        render();
      } else {
        addToOrder(item.id);
      }
    };
    b.oncontextmenu = (e) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        if (local.order[item.id] && local.order[item.id] > 0) {
          setQty(item.id, Math.max(0, local.order[item.id] - 5));
        }
      } else {
        if (local.order[item.id] && local.order[item.id] > 0) {
          setQty(item.id, local.order[item.id] - 1);
        }
      }
    };
    b.title = 'Click: +1 | Ctrl+Click: +5 | Right-click: -1 | Ctrl+Right-click: -5';

    wrapper.appendChild(b);

    const qty = local.order[item.id];
    if (qty && qty > 0) {
      const badge = document.createElement('span');
      badge.className = 'qty-badge';
      badge.textContent = qty;
      wrapper.appendChild(badge);
    }

    return wrapper;
  };

  const sortedGroups = [...menu.groups].sort((a, b) => a.order - b.order);

  sortedGroups.forEach(group => {
    const groupItems = menu.items.filter(it => it.groupId === group.id);
    if (groupItems.length === 0) return;

    const groupHeader = document.createElement('h4');
    groupHeader.className = 'item-group-header';
    groupHeader.textContent = group.name;
    wrap.appendChild(groupHeader);

    const groupContainer = document.createElement('div');
    groupContainer.className = 'item-group-buttons';

    groupItems.sort((a, b) => (a.order || 0) - (b.order || 0)).forEach(it => {
      groupContainer.appendChild(createMenuBtn(it, false));
    });

    wrap.appendChild(groupContainer);
  });

  const ungroupedItems = menu.items.filter(it => !it.groupId || !menu.groups.find(g => g.id === it.groupId));
  if (ungroupedItems.length > 0) {
    const groupHeader = document.createElement('h4');
    groupHeader.className = 'item-group-header';
    groupHeader.textContent = 'Ungrouped';
    wrap.appendChild(groupHeader);

    const groupContainer = document.createElement('div');
    groupContainer.className = 'item-group-buttons';

    ungroupedItems.forEach(it => {
      groupContainer.appendChild(createMenuBtn(it, false));
    });

    wrap.appendChild(groupContainer);
  }

  if (menu.specials.length > 0) {
    const specialsHeader = document.createElement('h4');
    specialsHeader.className = 'item-group-header specials-header';
    specialsHeader.textContent = 'Specials';
    wrap.appendChild(specialsHeader);

    const specialsContainer = document.createElement('div');
    specialsContainer.className = 'item-group-buttons';

    [...menu.specials].sort((a, b) => (a.order || 0) - (b.order || 0)).forEach(special => {
      specialsContainer.appendChild(createMenuBtn(special, true));
    });

    wrap.appendChild(specialsContainer);
  }
}

// === RENDER: GROUPS EDITOR ===
function renderGroups() {
  const wrap = $('groupsEditor');
  wrap.innerHTML = '';

  if (menu.groups.length === 0) {
    wrap.innerHTML = '<div class="muted">No groups yet. Add one above.</div>';
    return;
  }

  const table = document.createElement('table');
  table.innerHTML = `
    <thead><tr><th>Order</th><th>Name</th><th></th></tr></thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector('tbody');

  const onGroupMetaChange = () => {
    // Do not call full render() here: it re-creates the groups table and
    // causes the active input to lose focus while typing.
    persistMenu();
    updateGroupSelects();
    renderButtons();
    renderEditor();
    updateJsonTextbox();
  };

  [...menu.groups].sort((a, b) => a.order - b.order).forEach(group => {
    const tr = document.createElement('tr');

    const orderTd = document.createElement('td');
    const orderIn = document.createElement('input');
    orderIn.type = 'number';
    orderIn.value = group.order;
    orderIn.style.width = '60px';
    orderIn.oninput = () => {
      group.order = Number(orderIn.value || 0);
      onGroupMetaChange();
    };
    orderTd.appendChild(orderIn);

    const nameTd = document.createElement('td');
    const nameIn = document.createElement('input');
    nameIn.value = group.name;
    nameIn.oninput = () => {
      group.name = nameIn.value;
      onGroupMetaChange();
    };
    nameTd.appendChild(nameIn);

    const delTd = document.createElement('td');
    const delBtn = document.createElement('button');
    delBtn.className = 'btn small danger';
    delBtn.textContent = 'Delete';
    delBtn.onclick = () => {
      if (confirm(`Delete group "${group.name}"? Items in this group won't be deleted.`)) {
        menu.groups = menu.groups.filter(g => g.id !== group.id);
        persistMenuFlush(); render();
      }
    };
    delTd.appendChild(delBtn);

    tr.appendChild(orderTd);
    tr.appendChild(nameTd);
    tr.appendChild(delTd);
    tbody.appendChild(tr);
  });

  wrap.appendChild(table);
}

// === RENDER: SPECIALS EDITOR ===
function renderSpecialsEditor() {
  const wrap = $('specialsEditor');
  wrap.innerHTML = '';

  if (menu.specials.length === 0) {
    wrap.appendChild(createElement('div', 'empty-state', { text: 'No specials yet. Add one above.' }));
    return;
  }

  const container = createElement('div', 'group-container');
  const itemsList = createElement('div', 'group-items-list');

  const setupDraggable = (wrapper, id, listEl) => {
    wrapper.draggable = true;
    wrapper.ondragstart = (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
      wrapper.classList.add('dragging');
    };
    wrapper.ondragend = () => wrapper.classList.remove('dragging');
    wrapper.ondragover = (e) => {
      e.preventDefault();
      const afterElement = getDragAfterElement(listEl, e.clientY);
      const dragging = document.querySelector('.dragging');
      if (afterElement == null) listEl.appendChild(dragging);
      else listEl.insertBefore(dragging, afterElement);
    };
  };

  [...menu.specials].sort((a, b) => (a.order || 0) - (b.order || 0)).forEach(special => {
    const specialWrapper = createElement('div', 'special-wrapper');
    specialWrapper.dataset.specialId = special.id;
    setupDraggable(specialWrapper, special.id, itemsList);

    const row = createElement('div', 'item-row');

    const handle = createElement('div', 'drag-handle', { html: '⋮⋮' });

    const nameInput = createInput('text', 'item-input', special.name, {
      oninput: () => {
        special.name = nameInput.value;
        persistMenu();
        refreshOrderViews();
      }
    });

    const priceInput = createInput('number', 'item-input price-input', special.price, {
      step: '0.01',
      oninput: () => {
        special.price = Number(priceInput.value || 0);
        persistMenu();
        refreshOrderViews();
      }
    });

    const colorInput = createInput('color', 'color-picker', special.color || '#dc2626', {
      onchange: () => {
        special.color = colorInput.value;
        persistMenu();
        refreshOrderViews();
      }
    });

    const copyBtn = createButton('⎘', 'btn small', () => {
      const maxOrder = menu.specials.length > 0 ? Math.max(...menu.specials.map(s => s.order || 0)) : -1;
      menu.specials.push({
        id: uid(),
        name: special.name + ' (copy)',
        price: special.price,
        color: special.color,
        groupId: special.groupId,
        order: maxOrder + 1,
        subItems: [...(special.subItems || [])]
      });
      persistMenuFlush(); render();
    });
    copyBtn.title = 'Duplicate special';

    const deleteBtn = createButton('×', 'btn small danger', () => {
      menu.specials = menu.specials.filter(x => x.id !== special.id);
      delete local.order[special.id];
      saveLocal();
      persistMenuFlush(); render();
    });

    row.appendChild(handle);
    row.appendChild(nameInput);
    row.appendChild(priceInput);
    row.appendChild(colorInput);
    row.appendChild(copyBtn);
    row.appendChild(deleteBtn);

    specialWrapper.appendChild(row);

    const subItemsRow = createElement('div', 'sub-items-row');
    const subItemsLabel = createElement('label', 'sub-items-label', { text: 'Sub-items:' });
    const subItemsInput = createInput('text', 'sub-items-input', (special.subItems || []).join(', '), {
      placeholder: 'e.g., 2x Guku, 1x Tea, Salad',
      oninput: () => {
        special.subItems = subItemsInput.value.split(',').map(s => s.trim()).filter(s => s);
        persistMenu();
        refreshOrderViews();
      }
    });

    subItemsRow.append(subItemsLabel, subItemsInput);
    specialWrapper.appendChild(subItemsRow);

    itemsList.appendChild(specialWrapper);
  });

  itemsList.ondrop = () => {
    setTimeout(() => {
      const wrappers = itemsList.querySelectorAll('.special-wrapper');
      wrappers.forEach((wrapper, index) => {
        const specialId = wrapper.dataset.specialId;
        const special = menu.specials.find(s => s.id === specialId);
        if (special) special.order = index;
      });
      persistMenuFlush();
    }, 0);
  };

  container.appendChild(itemsList);
  wrap.appendChild(container);
}

function updateGroupSelects() {
  const selects = [$('newGroupSelect'), $('newSpecialGroupSelect')];
  selects.forEach(select => {
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = '<option value="">No Group</option>';
    [...menu.groups].sort((a, b) => a.order - b.order).forEach(group => {
      const option = document.createElement('option');
      option.value = group.id;
      option.textContent = group.name;
      select.appendChild(option);
    });
    select.value = currentValue;
  });
}

// === RENDER: ITEMS EDITOR ===
function renderEditor() {
  const wrap = $('itemsEditor');
  wrap.innerHTML = '';

  const sortedGroups = [...menu.groups].sort((a, b) => a.order - b.order);

  sortedGroups.forEach(group => {
    const groupContainer = document.createElement('div');
    groupContainer.className = 'group-container';
    groupContainer.dataset.groupId = group.id;

    const groupTitle = document.createElement('div');
    groupTitle.className = 'group-container-title';
    groupTitle.textContent = group.name;
    groupContainer.appendChild(groupTitle);

    const itemsList = document.createElement('div');
    itemsList.className = 'group-items-list';
    itemsList.dataset.groupId = group.id;

    const groupItems = menu.items
      .filter(it => it.groupId === group.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (groupItems.length === 0) {
      itemsList.innerHTML = '<div class="muted" style="padding: 12px;">Drag items here</div>';
    } else {
      groupItems.forEach(it => {
        itemsList.appendChild(createItemRow(it));
      });
    }

    itemsList.ondragover = (e) => {
      e.preventDefault();
      itemsList.classList.add('drag-over');
    };

    itemsList.ondragleave = () => {
      itemsList.classList.remove('drag-over');
    };

    itemsList.ondrop = (e) => {
      e.preventDefault();
      itemsList.classList.remove('drag-over');
      const itemId = e.dataTransfer.getData('text/plain');
      const item = menu.items.find(i => i.id === itemId);
      if (item) {
        item.groupId = Number(group.id);
        reorderItemsInGroup(group.id);
        persistMenuFlush();
        render();
      }
    };

    groupContainer.appendChild(itemsList);
    wrap.appendChild(groupContainer);
  });

  const ungroupedContainer = document.createElement('div');
  ungroupedContainer.className = 'group-container';

  const ungroupedTitle = document.createElement('div');
  ungroupedTitle.className = 'group-container-title';
  ungroupedTitle.textContent = 'Ungrouped';
  ungroupedContainer.appendChild(ungroupedTitle);

  const ungroupedList = document.createElement('div');
  ungroupedList.className = 'group-items-list';
  ungroupedList.dataset.groupId = '';

  const ungroupedItems = menu.items
    .filter(it => !it.groupId || !menu.groups.find(g => g.id === it.groupId))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (ungroupedItems.length === 0) {
    ungroupedList.innerHTML = '<div class="muted" style="padding: 12px;">Drag items here</div>';
  } else {
    ungroupedItems.forEach(it => {
      ungroupedList.appendChild(createItemRow(it));
    });
  }

  ungroupedList.ondragover = (e) => {
    e.preventDefault();
    ungroupedList.classList.add('drag-over');
  };

  ungroupedList.ondragleave = () => {
    ungroupedList.classList.remove('drag-over');
  };

  ungroupedList.ondrop = (e) => {
    e.preventDefault();
    ungroupedList.classList.remove('drag-over');
    const itemId = e.dataTransfer.getData('text/plain');
    const item = menu.items.find(i => i.id === itemId);
    if (item) {
      item.groupId = null;
      reorderItemsInGroup(null);
      persistMenuFlush();
      render();
    }
  };

  ungroupedContainer.appendChild(ungroupedList);
  wrap.appendChild(ungroupedContainer);
}

function createItemRow(it) {
  const row = document.createElement('div');
  row.className = 'item-row';
  row.draggable = true;
  row.dataset.itemId = it.id;

  row.ondragstart = (e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', it.id);
    row.classList.add('dragging');
  };

  row.ondragend = () => {
    row.classList.remove('dragging');
  };

  row.ondragover = (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(row.parentElement, e.clientY);
    const dragging = document.querySelector('.dragging');
    if (afterElement == null) {
      row.parentElement.appendChild(dragging);
    } else {
      row.parentElement.insertBefore(dragging, afterElement);
    }
  };

  const handle = document.createElement('div');
  handle.className = 'drag-handle';
  handle.innerHTML = '⋮⋮';

  const nameInput = document.createElement('input');
  nameInput.className = 'item-input';
  nameInput.value = it.name;
  nameInput.oninput = () => {
    it.name = nameInput.value;
    persistMenu();
    refreshOrderViews();
  };

  const priceInput = document.createElement('input');
  priceInput.className = 'item-input price-input';
  priceInput.type = 'number';
  priceInput.step = '0.01';
  priceInput.value = it.price;
  priceInput.oninput = () => {
    it.price = Number(priceInput.value || 0);
    persistMenu();
    refreshOrderViews();
  };

  const colorInput = document.createElement('input');
  colorInput.className = 'color-picker';
  colorInput.type = 'color';
  colorInput.value = it.color || '#6b7280';
  colorInput.onchange = () => {
    it.color = colorInput.value;
    persistMenu();
    refreshOrderViews();
  };

  const emojiInput = document.createElement('input');
  emojiInput.className = 'item-input emoji-input';
  emojiInput.value = it.emoji || '';
  emojiInput.placeholder = '🍽️';
  emojiInput.title = 'Emoji icon';
  emojiInput.oninput = () => {
    it.emoji = emojiInput.value;
    persistMenu();
    refreshOrderViews();
  };

  const copyBtn = document.createElement('button');
  copyBtn.className = 'btn small';
  copyBtn.textContent = '⎘';
  copyBtn.title = 'Duplicate item';
  copyBtn.onclick = () => {
    const maxOrder = menu.items.length > 0 ? Math.max(...menu.items.map(i => i.order || 0)) : -1;
    menu.items.push({
      id: uid(),
      name: it.name + ' (copy)',
      price: it.price,
      color: it.color,
      emoji: it.emoji || '',
      groupId: it.groupId,
      order: maxOrder + 1
    });
    persistMenuFlush(); render();
  };

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn small danger';
  deleteBtn.textContent = '×';
  deleteBtn.onclick = () => {
    menu.items = menu.items.filter(x => x.id !== it.id);
    delete local.order[it.id];
    saveLocal();
    persistMenuFlush(); render();
  };

  row.appendChild(handle);
  row.appendChild(nameInput);
  row.appendChild(priceInput);
  row.appendChild(emojiInput);
  row.appendChild(colorInput);
  row.appendChild(copyBtn);
  row.appendChild(deleteBtn);

  return row;
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.special-wrapper:not(.dragging), .item-row:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function reorderItemsInGroup(groupId) {
  const containers = document.querySelectorAll('.group-items-list');
  containers.forEach(container => {
    const containerGroupId = container.dataset.groupId;
    if ((groupId === null && containerGroupId === '') ||
        (groupId !== null && Number(containerGroupId) === groupId)) {
      const rows = container.querySelectorAll('.item-row');
      rows.forEach((row, index) => {
        const itemId = row.dataset.itemId;
        const item = menu.items.find(i => i.id === itemId);
        if (item) {
          item.order = index;
        }
      });
    }
  });
}

// === RENDER: CURRENT ORDER ===
function renderOrder() {
  const wrap = $('orderTableWrap');
  const { lines, subtotal, discount, total } = calc();

  if (!lines.length) {
    wrap.innerHTML = '<div class="empty-state">No items yet. Tap buttons above to add.</div>';
    $('totalLine').textContent = '';
    return;
  }

  wrap.innerHTML = '';

  const table = document.createElement('table');
  table.innerHTML = `
    <thead><tr><th>Item</th><th>Qty</th><th>Line</th><th></th></tr></thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector('tbody');

  for (const [id, qty] of Object.entries(local.order)) {
    const it = getItem(id);
    if (!it) continue;

    const tr = document.createElement('tr');
    tr.className = 'order-table-row';

    const itemTd = document.createElement('td');
    const emojiPrefix = it.emoji ? `${it.emoji} ` : '';
    itemTd.textContent = `${emojiPrefix}${it.name} ($${money(it.price)})`;

    const qtyTd = document.createElement('td');
    const minus10 = document.createElement('button');
    minus10.className = 'btn small';
    minus10.textContent = '--';
    minus10.onclick = () => setQty(id, (local.order[id] || 0) - 5);

    const minus = document.createElement('button');
    minus.className = 'btn small';
    minus.textContent = '-';
    minus.onclick = () => setQty(id, (local.order[id] || 0) - 1);

    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.min = '0';
    qtyInput.step = '1';
    qtyInput.value = qty;
    qtyInput.style.width = '50px';
    qtyInput.style.textAlign = 'center';
    qtyInput.style.margin = '0 4px';
    qtyInput.onchange = () => {
      const newQty = parseInt(qtyInput.value) || 0;
      setQty(id, newQty);
    };
    qtyInput.onkeypress = (e) => {
      if (e.key === 'Enter') {
        const newQty = parseInt(qtyInput.value) || 0;
        setQty(id, newQty);
        qtyInput.blur();
      }
    };

    const plus = document.createElement('button');
    plus.className = 'btn small';
    plus.textContent = '+';
    plus.onclick = () => setQty(id, (local.order[id] || 0) + 1);

    const plus10 = document.createElement('button');
    plus10.className = 'btn small';
    plus10.textContent = '++';
    plus10.onclick = () => {
      const current = local.order[id] || 0;
      setQty(id, current < 5 ? 5 : current + 5);
    };

    qtyTd.append(minus10, minus, qtyInput, plus, plus10);

    const lineTd = document.createElement('td');
    lineTd.textContent = `$${money(it.price * qty)}`;

    const rmTd = document.createElement('td');
    const rmBtn = document.createElement('button');
    rmBtn.className = 'btn small danger';
    rmBtn.textContent = 'Remove';
    rmBtn.onclick = () => setQty(id, 0);
    rmTd.appendChild(rmBtn);

    tr.append(itemTd, qtyTd, lineTd, rmTd);
    tbody.appendChild(tr);
  }

  wrap.appendChild(table);

  const discPct = Number($('discountPct').value || 0);
  const parts = [`Subtotal $${money(subtotal)}`];
  if (discPct > 0) parts.push(`Discount -$${money(discount)}`);
  parts.push(`Total $${money(total)}`);
  $('totalLine').textContent = parts.join('  |  ');
}

function renderReceipt() {
  const isShorthand = $('shorthandReceipt') && $('shorthandReceipt').checked;
  $('receiptOut').value = isShorthand ? shorthandReceiptText() : receiptText();
  renderComponentBreakdown();
}

function renderComponentBreakdown() {
  const breakdownWrap = $('componentBreakdownWrap');
  if (!breakdownWrap) return;

  const components = getComponentBreakdown();
  const hasSpecials = Object.keys(local.order).some(id => {
    const item = getItem(id);
    return item && item.subItems && item.subItems.length > 0;
  });

  if (!hasSpecials || components.length === 0) {
    breakdownWrap.style.display = 'none';
    return;
  }

  breakdownWrap.style.display = 'block';
  breakdownWrap.innerHTML = '';

  const breakdownSection = createElement('div', 'component-breakdown');
  const breakdownHeader = createElement('div', 'component-breakdown-header');

  const headerText = createElement('h4', 'component-breakdown-title', {
    text: '📋 Component Breakdown (Kitchen/Inventory)'
  });

  const toggleBtn = createButton('Hide', 'btn small', () => {
    const list = breakdownSection.querySelector('.component-list');
    const isHidden = list.style.display === 'none';
    list.style.display = isHidden ? 'block' : 'none';
    toggleBtn.textContent = isHidden ? 'Hide' : 'Show';
  });

  breakdownHeader.append(headerText, toggleBtn);

  const componentList = createElement('div', 'component-list');

  const componentTable = createElement('table', 'component-table');
  componentTable.innerHTML = `
    <thead><tr><th>Item</th><th>Total Qty</th></tr></thead>
    <tbody></tbody>
  `;
  const tbody = componentTable.querySelector('tbody');

  components.forEach(({ name, qty }) => {
    const tr = createElement('tr');
    const nameTd = createElement('td', '', { text: name });
    const qtyTd = createElement('td', 'component-qty', { text: qty });
    tr.append(nameTd, qtyTd);
    tbody.appendChild(tr);
  });

  componentList.appendChild(componentTable);
  breakdownSection.append(breakdownHeader, componentList);
  breakdownWrap.appendChild(breakdownSection);
}

function render() {
  renderGroups();
  renderSpecialsEditor();
  updateGroupSelects();
  renderButtons();
  renderEditor();
  renderOrder();
  renderReceipt();
  updateJsonTextbox();
  updateLastOrderButton();
}

// === MENU JSON (export shape is unchanged from v3.0 files) ===
function exportMenuData() {
  return {
    groups: menu.groups,
    specials: menu.specials.map(special => ({
      name: special.name,
      price: special.price,
      color: special.color,
      groupId: special.groupId || null,
      subItems: special.subItems || []
    })),
    items: menu.items.map(item => ({
      name: item.name,
      price: item.price,
      color: item.color,
      emoji: item.emoji || '',
      groupId: item.groupId || null
    })),
    title: $('receiptTitle').value || 'Receipt',
    stylePreset: menu.stylePreset,
    version: '3.0'
  };
}

function updateJsonTextbox() {
  $('menuJsonText').value = JSON.stringify(exportMenuData(), null, 2);
}

/** Shared import path for JSON textbox + file load. */
function applyImportedMenu(menuData, sourceLabel) {
  const next = hydrateMenu(menuData);
  replaceMenu(next);
  $('receiptTitle').value = menu.title;
  applyStylePreset(menu.stylePreset, false);
  local.order = {};
  local.loadedTemplate = 'Custom';
  saveLocal();
  persistMenuFlush();
  render();
  updateTemplateBadge();
  showStatus(`Menu loaded${sourceLabel ? ' from ' + sourceLabel : ''}!`);
}

function loadFromJson() {
  const jsonText = $('menuJsonText').value.trim();
  if (!jsonText) {
    alert('Please enter JSON data');
    return;
  }

  try {
    const menuData = JSON.parse(jsonText);

    if (!menuData.items || !Array.isArray(menuData.items)) {
      throw new Error('Invalid menu format - missing items array');
    }

    const confirmed = confirm(
      `Load menu with ${menuData.items.length} items?\n` +
      'This will replace your current menu items.'
    );

    if (confirmed) applyImportedMenu(menuData, 'JSON');
  } catch (error) {
    alert('Error parsing JSON: ' + error.message);
  }
}

async function copyJson() {
  const jsonText = $('menuJsonText').value;
  try {
    await navigator.clipboard.writeText(jsonText);
    showStatus('JSON copied!', 1000);
  } catch {
    $('menuJsonText').select();
    showStatus('JSON selected - press Ctrl+C to copy', 0);
  }
}

// === TEMPLATE LOADING ===
function loadTemplateByName(templateName, template) {
  const next = hydrateMenu(template);
  replaceMenu(next);
  $('receiptTitle').value = menu.title;
  applyStylePreset(menu.stylePreset, false);
  local.order = {};
  local.loadedTemplate = templateName;
  saveLocal();
  persistMenuFlush();
  render();
  updateTemplateBadge();
}

// === TEMPLATE BADGE ===
function updateTemplateBadge() {
  const badge = $('templateBadge');
  if (!badge) return;
  badge.textContent = local.loadedTemplate || '';
}

// === TABS ===
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  $(tabName + 'Tab').classList.add('active');

  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  $(tabName + 'TabContent').classList.add('active');

  local.currentTab = tabName;
  saveLocal();

  if (tabName === 'ordering') {
    refreshOrderViews();
  }
}

// === LOCK STATE (shop mode) ===
function applyLockState() {
  const owner = isOwner();
  document.body.classList.toggle('locked', isShop && !owner);

  const lockBtn = $('lockToggle');
  if (lockBtn) {
    lockBtn.textContent = owner ? '🔓 Owner' : '🔒 Locked';
    lockBtn.className = owner ? 'btn small success shop-only' : 'btn small shop-only';
  }

  // Kicked out of the editor when locking
  if (isShop && !owner && local.currentTab === 'menu') {
    switchTab('ordering');
  }
}

async function handleLockToggle() {
  if (isOwner()) {
    lockOut();
    applyLockState();
    return;
  }
  const exists = await checkPasscodeExists();
  if (!exists) {
    showSetPasscodeModal(() => applyLockState());
  } else {
    showUnlockModal(() => applyLockState());
  }
}

// === EVENT WIRING ===
function wireEvents() {
  $('addGroupBtn').onclick = () => {
    const name = ($('newGroupName').value || '').trim();
    const order = Number($('newGroupOrder').value || (menu.groups.length + 1));
    if (!name) return;

    const newId = menu.groups.length > 0 ? Math.max(...menu.groups.map(g => g.id)) + 1 : 1;
    menu.groups.push({ id: newId, order, name });
    $('newGroupName').value = '';
    $('newGroupOrder').value = '';
    persistMenuFlush();
    render();
  };

  $('addSpecialBtn').onclick = () => {
    const name = ($('newSpecialName').value || '').trim();
    const price = Number($('newSpecialPrice').value || 0);
    const color = $('newSpecialColor').value || '#dc2626';
    const groupId = $('newSpecialGroupSelect').value ? Number($('newSpecialGroupSelect').value) : null;
    if (!name) return;

    const maxOrder = menu.specials.length > 0 ? Math.max(...menu.specials.map(s => s.order || 0)) : -1;
    menu.specials.push({ id: uid(), name, price, color, groupId, order: maxOrder + 1, subItems: [] });
    $('newSpecialName').value = '';
    $('newSpecialPrice').value = '';
    $('newSpecialColor').value = '#dc2626';
    $('newSpecialGroupSelect').value = '';
    persistMenuFlush();
    render();
  };

  $('addItemBtn').onclick = () => {
    const name = ($('newName').value || '').trim();
    const price = Number($('newPrice').value || 0);
    const color = $('newColor').value || '#6b7280';
    const groupId = $('newGroupSelect').value ? Number($('newGroupSelect').value) : null;
    if (!name) return;

    const maxOrder = menu.items.length > 0 ? Math.max(...menu.items.map(i => i.order || 0)) : -1;
    menu.items.push({ id: uid(), name, price, color, emoji: '', groupId, order: maxOrder + 1 });
    $('newName').value = '';
    $('newPrice').value = '';
    $('newColor').value = '#6b7280';
    $('newGroupSelect').value = '';
    persistMenuFlush();
    render();
  };

  $('discountPct').oninput = () => { persistLocal(); render(); };
  $('receiptTitle').oninput = () => {
    menu.title = $('receiptTitle').value || 'Receipt';
    persistMenu();
    render();
  };
  if ($('showBreakdownInReceipt')) {
    $('showBreakdownInReceipt').onchange = () => { renderReceipt(); };
  }
  if ($('shorthandReceipt')) {
    $('shorthandReceipt').onchange = () => { renderReceipt(); };
  }

  $('clearOrderBtn').onclick = () => {
    saveLastOrder();
    local.order = {};
    persistLocal();
    render();
    updateLastOrderButton();
  };

  $('resetDefaultBtn').onclick = () => {
    const selectedTemplate = local.loadedTemplate || 'KOI';
    const found = findTemplate(selectedTemplate);

    if (!found) {
      alert('Load a menu template before resetting to defaults.');
      return;
    }

    if (confirm(`Reset all items to ${found.key} template? This will remove custom items.`)) {
      loadTemplateByName(found.key, found.template);
    }
  };

  $('loadTemplateBtn').onclick = () => {
    const typedName = ($('templateNameInput').value || '').trim();

    if (!typedName) {
      alert('Type a template name to load a menu.');
      return;
    }

    const found = findTemplate(typedName);

    if (!found) {
      alert(`Template "${typedName}" not found.`);
      return;
    }

    if (confirm(`Load ${found.key} template? This will replace your current menu items.`)) {
      $('templateNameInput').value = '';
      loadTemplateByName(found.key, found.template);
      showStatus('Template loaded!');
    }
  };

  $('templateNameInput').onkeypress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      $('loadTemplateBtn').click();
    }
  };

  $('copyBtn').onclick = async () => {
    const text = $('receiptOut').value;
    try {
      await navigator.clipboard.writeText(text);
      showStatus('Copied!', 900);
    } catch {
      showStatus('Copy failed (select + ctrl/cmd+c)', 0);
    }
  };

  $('selectBtn').onclick = () => {
    $('receiptOut').focus();
    $('receiptOut').select();
  };

  $('saveMenuBtn').onclick = () => {
    const defaultFilename = `menu-${new Date().toISOString().slice(0, 10)}`;
    const filename = prompt('Enter filename for menu:', defaultFilename);

    if (!filename) return;

    const finalFilename = filename.endsWith('.json') ? filename : filename + '.json';

    const menuData = { ...exportMenuData(), exportDate: new Date().toISOString() };

    const dataStr = JSON.stringify(menuData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showStatus('Menu saved!');
  };

  $('loadMenuBtn').onclick = () => {
    $('menuFileInput').click();
  };

  $('menuFileInput').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const menuData = JSON.parse(event.target.result);

        if (!menuData.items || !Array.isArray(menuData.items)) {
          throw new Error('Invalid menu format');
        }

        const confirmed = confirm(
          `Load menu with ${menuData.items.length} items?\n` +
          (menuData.exportDate ? `Exported: ${new Date(menuData.exportDate).toLocaleString()}\n` : '') +
          'This will replace your current menu items.'
        );

        if (confirmed) applyImportedMenu(menuData, 'file');
      } catch (error) {
        alert('Error loading menu file: ' + error.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  $('loadJsonBtn').onclick = loadFromJson;
  $('copyJsonBtn').onclick = copyJson;

  $('groupsHeader').onclick = () => toggleCollapsible('groupsCollapsible', 'groupsHeader');
  $('specialsHeader').onclick = () => toggleCollapsible('specialsCollapsible', 'specialsHeader');

  $('menuTab').onclick = () => switchTab('menu');
  $('orderingTab').onclick = () => switchTab('ordering');

  const tipsToggle = $('tipsToggle');
  const tipsDrawer = $('tipsDrawer');
  if (tipsToggle && tipsDrawer) {
    tipsToggle.onclick = () => {
      tipsDrawer.classList.toggle('open');
      tipsToggle.classList.toggle('open');
    };
  }

  if ($('lastOrderBtn')) {
    $('lastOrderBtn').onclick = () => {
      const lastOrder = local.lastOrder;
      if (!lastOrder || Object.keys(lastOrder).length === 0) return;

      const validOrder = {};
      for (const [id, qty] of Object.entries(lastOrder)) {
        if (getItem(id)) validOrder[id] = qty;
      }

      if (Object.keys(validOrder).length === 0) return;

      local.order = { ...validOrder };
      persistLocal();
      render();
    };
  }

  const lockBtn = $('lockToggle');
  if (lockBtn) lockBtn.onclick = handleLockToggle;

  const changePassBtn = $('changePasscodeBtn');
  if (changePassBtn) changePassBtn.onclick = showChangePasscodeModal;

  document.addEventListener('keydown', (e) => {
    const activeTag = document.activeElement?.tagName;
    const isTyping = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';

    if (e.key === 'Escape' && !isTyping && Object.keys(local.order).length > 0) {
      saveLastOrder();
      local.order = {};
      persistLocal();
      render();
      updateLastOrderButton();
      return;
    }

    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      const text = $('receiptOut').value;
      navigator.clipboard.writeText(text).then(() => {
        showStatus('Copied!', 900);
      }).catch(() => {
        showStatus('Copy failed', 0);
      });
      return;
    }

    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
      e.preventDefault();
      if ($('lastOrderBtn')) $('lastOrderBtn').click();
      return;
    }
  });
}

function toggleCollapsible(contentId, headerId) {
  const content = $(contentId);
  const icon = $(headerId).querySelector('.collapse-icon');
  if (content.style.display === 'none') {
    content.style.display = 'block';
    icon.textContent = '▼';
  } else {
    content.style.display = 'none';
    icon.textContent = '▶';
  }
}

// === REMOTE UPDATES ===
onRemoteUpdate(() => {
  // Don't clobber the title input mid-edit
  if (document.activeElement !== $('receiptTitle')) {
    $('receiptTitle').value = menu.title || 'Receipt';
  }
  applyStylePreset(menu.stylePreset, false);
  render();
});

// === INIT ===
async function init() {
  const loader = $('loadingOverlay');

  // No shop and not local mode → landing picker
  if (!isShop && !localMode) {
    if (loader) loader.style.display = 'none';
    $('appRoot').style.display = 'none';
    $('shopPicker').style.display = '';
    initShopPicker();
    return;
  }

  document.body.classList.toggle('local-mode', !isShop);

  if (isShop) {
    // Verify the shop was created through the invite flow
    let shopName = null;
    let fetchFailed = false;
    try {
      shopName = await fetchShopName();
    } catch { fetchFailed = true; /* offline — fall through, use cached data */ }

    if (!shopName && !fetchFailed) {
      // The database answered and the shop doesn't exist — back to the picker
      window.location.href = window.location.pathname;
      return;
    }

    if (shopName) {
      $('shopTitle').textContent = shopName;
      document.title = `${shopName} - Order Pad`;
      localStorage.setItem('op_last_shop', shopId);
    }

    restoreSession();
    await loadMenuFromFirebase();
    markInitialLoadDone();
    startStreaming();
    touchLastSeen();
  } else {
    updateSyncBadge('Local only', false);
  }

  // Initialize form values from state
  $('discountPct').value = local.discountPct;
  $('receiptTitle').value = menu.title || 'Receipt';

  populateStylePresetSelect();
  applyStylePreset(menu.stylePreset, false);

  wireEvents();
  applyLockState();
  updateTemplateBadge();

  const versionEl = $('appVersion');
  if (versionEl) versionEl.textContent = 'v' + __APP_VERSION__;

  // URL ?template= auto-load (local mode only — a shop's menu comes from the DB)
  if (!isShop) {
    const params = new URLSearchParams(window.location.search);
    const templateParam = params.get('template');
    if (templateParam) {
      const found = findTemplate(templateParam);
      if (found) loadTemplateByName(found.key, found.template);
    }
  }

  // Restore tab (viewers can't land on the editor)
  const savedTab = (isShop && !isOwner()) ? 'ordering' : (local.currentTab || 'ordering');
  switchTab(savedTab);

  render();
  updateLastOrderButton();

  if (loader) loader.style.display = 'none';
}

init();
