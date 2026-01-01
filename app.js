(() => {
  const $ = (id) => document.getElementById(id);

  const defaultGroups = [
    { id: 1, order: 1, name: "Food" },
    { id: 2, order: 2, name: "Drinks" }
  ];

  const menuTemplates = {
    "KOI": [
      { name: "Guku", price: 100, color: "#16a34a", groupId: 1 },         
      { name: "Pad Thai", price: 200, color: "#16a34a", groupId: 1 },     
      { name: "Cali Maki", price: 100, color: "#16a34a", groupId: 1 },    
      { name: "Salad", price: 80, color: "#16a34a", groupId: 1 },         
      { name: "Sashimi Roll", price: 120, color: "#16a34a", groupId: 1 }, 
      { name: "Tuna Roll", price: 140, color: "#16a34a", groupId: 1 },    
      { name: "Chips", price: 100, color: "#16a34a", groupId: 1 },    
      { name: "Japanese Pan Noodles", price: 100, color: "#16a34a", groupId: 1 },  
      { name: "Matcha Tea", price: 80, color: "#2563eb", groupId: 2 },    
      { name: "Sake", price: 100, color: "#2563eb", groupId: 2 },         
      { name: "Sakura Latte", price: 50, color: "#2563eb", groupId: 2 }   
    ],
  };

  const defaultItems = menuTemplates["KOI"].map((item, index) => ({
    ...item,
    id: crypto.randomUUID(),
    color: item.color || "#6b7280",
    groupId: item.groupId || null,
    order: index
  }));

  const load = (k, fallback) => {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  };
  
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  let groups = load("sop_groups_v1", defaultGroups);
  let items = load("sop_items_v1", defaultItems);
  let order = load("sop_order_v1", {}); // { itemId: qty }
  let discountPct = load("sop_discount_v1", 0);
  let title = load("sop_title_v1", "Receipt");

  // Initialize form values
  $("discountPct").value = discountPct;
  $("receiptTitle").value = title;

  populateTemplateDropdown();

  function populateTemplateDropdown() {
    const select = $("templateSelect");
    select.innerHTML = "";
    
    Object.keys(menuTemplates).forEach(templateName => {
      const option = document.createElement("option");
      option.value = templateName;
      option.textContent = templateName;
      select.appendChild(option);
    });
    
    // Set default to first template
    if (select.options.length > 0) {
      select.value = Object.keys(menuTemplates)[0];
    }
  }

  function money(n) { 
    return (Math.round((n + Number.EPSILON) * 100) / 100).toFixed(2); 
  }

  function getItem(id) { 
    return items.find(i => i.id === id); 
  }

  function addToOrder(id) {
    order[id] = (order[id] || 0) + 1;
    persist();
    render();
  }

  function setQty(id, qty) {
    if (qty <= 0) delete order[id];
    else order[id] = qty;
    persist();
    render();
  }

  function persist() {
    save("sop_groups_v1", groups);
    save("sop_items_v1", items);
    save("sop_order_v1", order);
    save("sop_discount_v1", Number($("discountPct").value || 0));
    save("sop_title_v1", $("receiptTitle").value || "Receipt");
    $("status").textContent = "Saved locally";
  }

  function calc() {
    const lines = Object.entries(order)
      .map(([id, qty]) => {
        const it = getItem(id);
        if (!it) return null;
        const lineTotal = it.price * qty;
        return { name: it.name, price: it.price, qty, lineTotal };
      })
      .filter(Boolean);

    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const discount = subtotal * (Number($("discountPct").value || 0) / 100);
    const total = subtotal - discount;
    return { lines, subtotal, discount, total };
  }

  function receiptText() {
    const { lines, subtotal, discount, total } = calc();
    const t = ($("receiptTitle").value || "Receipt").trim();

    const now = new Date();
    const stamp = now.toLocaleString();

    const body = [];
    body.push(t);
    body.push(stamp);
    body.push("");
    if (!lines.length) {
      body.push("(no items)");
    } else {
      for (const l of lines) {
        body.push(`${l.qty} x ${l.name} @ $${money(l.price)} = $${money(l.lineTotal)}`);
      }
      body.push("");
      body.push(`Subtotal: $${money(subtotal)}`);
      const discPct = Number($("discountPct").value || 0);
      if (discPct > 0) body.push(`Discount (${money(discPct)}%): -$${money(discount)}`);
      body.push(`Total: $${money(total)}`);
    }
    return body.join("\n");
  }

  function renderButtons() {
    const wrap = $("itemButtons");
    wrap.innerHTML = "";
    
    // Sort groups by order
    const sortedGroups = [...groups].sort((a, b) => a.order - b.order);
    
    // Render items for each group
    sortedGroups.forEach(group => {
      const groupItems = items.filter(it => it.groupId === group.id);
      if (groupItems.length === 0) return;
      
      const groupHeader = document.createElement("h4");
      groupHeader.className = "item-group-header";
      groupHeader.textContent = group.name;
      wrap.appendChild(groupHeader);
      
      const groupContainer = document.createElement("div");
      groupContainer.className = "item-group-buttons";
      
      groupItems.forEach(it => {
        const b = document.createElement("button");
        b.className = "btn";
        b.textContent = `${it.name} ($${money(it.price)})`;
        b.style.backgroundColor = it.color || "#6b7280";
        b.style.borderColor = it.color || "#6b7280";
        b.style.color = "#ffffff";
        b.onclick = () => addToOrder(it.id);
        groupContainer.appendChild(b);
      });
      
      wrap.appendChild(groupContainer);
    });
    
    // Render ungrouped items
    const ungroupedItems = items.filter(it => !it.groupId || !groups.find(g => g.id === it.groupId));
    if (ungroupedItems.length > 0) {
      const groupHeader = document.createElement("h4");
      groupHeader.className = "item-group-header";
      groupHeader.textContent = "Ungrouped";
      wrap.appendChild(groupHeader);
      
      const groupContainer = document.createElement("div");
      groupContainer.className = "item-group-buttons";
      
      ungroupedItems.forEach(it => {
        const b = document.createElement("button");
        b.className = "btn";
        b.textContent = `${it.name} ($${money(it.price)})`;
        b.style.backgroundColor = it.color || "#6b7280";
        b.style.borderColor = it.color || "#6b7280";
        b.style.color = "#ffffff";
        b.onclick = () => addToOrder(it.id);
        groupContainer.appendChild(b);
      });
      
      wrap.appendChild(groupContainer);
    }
  }

  function renderGroups() {
    const wrap = $("groupsEditor");
    wrap.innerHTML = "";

    if (groups.length === 0) {
      wrap.innerHTML = '<div class="muted">No groups yet. Add one above.</div>';
      return;
    }

    const table = document.createElement("table");
    table.innerHTML = `
      <thead><tr><th>Order</th><th>Name</th><th></th></tr></thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector("tbody");

    [...groups].sort((a, b) => a.order - b.order).forEach(group => {
      const tr = document.createElement("tr");

      const orderTd = document.createElement("td");
      const orderIn = document.createElement("input");
      orderIn.type = "number";
      orderIn.value = group.order;
      orderIn.style.width = "60px";
      orderIn.oninput = () => {
        group.order = Number(orderIn.value || 0);
        persist(); render();
      };
      orderTd.appendChild(orderIn);

      const nameTd = document.createElement("td");
      const nameIn = document.createElement("input");
      nameIn.value = group.name;
      nameIn.oninput = () => { group.name = nameIn.value; persist(); render(); };
      nameTd.appendChild(nameIn);

      const delTd = document.createElement("td");
      const delBtn = document.createElement("button");
      delBtn.className = "btn small danger";
      delBtn.textContent = "Delete";
      delBtn.onclick = () => {
        if (confirm(`Delete group "${group.name}"? Items in this group won't be deleted.`)) {
          groups = groups.filter(g => g.id !== group.id);
          persist(); render();
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

  function updateGroupSelects() {
    const selects = [$("newGroupSelect")];
    selects.forEach(select => {
      const currentValue = select.value;
      select.innerHTML = '<option value="">No Group</option>';
      [...groups].sort((a, b) => a.order - b.order).forEach(group => {
        const option = document.createElement("option");
        option.value = group.id;
        option.textContent = group.name;
        select.appendChild(option);
      });
      select.value = currentValue;
    });
  }

  function renderEditor() {
    const wrap = $("itemsEditor");
    wrap.innerHTML = "";

    const sortedGroups = [...groups].sort((a, b) => a.order - b.order);
    
    // Render each group as a container
    sortedGroups.forEach(group => {
      const groupContainer = document.createElement("div");
      groupContainer.className = "group-container";
      groupContainer.dataset.groupId = group.id;
      
      const groupTitle = document.createElement("div");
      groupTitle.className = "group-container-title";
      groupTitle.textContent = group.name;
      groupContainer.appendChild(groupTitle);
      
      const itemsList = document.createElement("div");
      itemsList.className = "group-items-list";
      itemsList.dataset.groupId = group.id;
      
      // Get items for this group, sorted by order
      const groupItems = items
        .filter(it => it.groupId === group.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
      if (groupItems.length === 0) {
        itemsList.innerHTML = '<div class="muted" style="padding: 12px;">Drag items here</div>';
      } else {
        groupItems.forEach(it => {
          itemsList.appendChild(createItemRow(it));
        });
      }
      
      // Make group a drop zone
      itemsList.ondragover = (e) => {
        e.preventDefault();
        itemsList.classList.add("drag-over");
      };
      
      itemsList.ondragleave = () => {
        itemsList.classList.remove("drag-over");
      };
      
      itemsList.ondrop = (e) => {
        e.preventDefault();
        itemsList.classList.remove("drag-over");
        const itemId = e.dataTransfer.getData("text/plain");
        const item = items.find(i => i.id === itemId);
        if (item) {
          item.groupId = Number(group.id);
          // Reorder within group
          reorderItemsInGroup(group.id);
          persist();
          render();
        }
      };
      
      groupContainer.appendChild(itemsList);
      wrap.appendChild(groupContainer);
    });
    
    // Ungrouped items container
    const ungroupedContainer = document.createElement("div");
    ungroupedContainer.className = "group-container";
    
    const ungroupedTitle = document.createElement("div");
    ungroupedTitle.className = "group-container-title";
    ungroupedTitle.textContent = "Ungrouped";
    ungroupedContainer.appendChild(ungroupedTitle);
    
    const ungroupedList = document.createElement("div");
    ungroupedList.className = "group-items-list";
    ungroupedList.dataset.groupId = "";
    
    const ungroupedItems = items
      .filter(it => !it.groupId || !groups.find(g => g.id === it.groupId))
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
      ungroupedList.classList.add("drag-over");
    };
    
    ungroupedList.ondragleave = () => {
      ungroupedList.classList.remove("drag-over");
    };
    
    ungroupedList.ondrop = (e) => {
      e.preventDefault();
      ungroupedList.classList.remove("drag-over");
      const itemId = e.dataTransfer.getData("text/plain");
      const item = items.find(i => i.id === itemId);
      if (item) {
        item.groupId = null;
        reorderItemsInGroup(null);
        persist();
        render();
      }
    };
    
    ungroupedContainer.appendChild(ungroupedList);
    wrap.appendChild(ungroupedContainer);
  }
  
  function createItemRow(it) {
    const row = document.createElement("div");
    row.className = "item-row";
    row.draggable = true;
    row.dataset.itemId = it.id;
    
    row.ondragstart = (e) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", it.id);
      row.classList.add("dragging");
    };
    
    row.ondragend = () => {
      row.classList.remove("dragging");
    };
    
    row.ondragover = (e) => {
      e.preventDefault();
      const afterElement = getDragAfterElement(row.parentElement, e.clientY);
      const dragging = document.querySelector(".dragging");
      if (afterElement == null) {
        row.parentElement.appendChild(dragging);
      } else {
        row.parentElement.insertBefore(dragging, afterElement);
      }
    };
    
    const handle = document.createElement("div");
    handle.className = "drag-handle";
    handle.innerHTML = "⋮⋮";
    
    const nameInput = document.createElement("input");
    nameInput.className = "item-input";
    nameInput.value = it.name;
    nameInput.oninput = () => { it.name = nameInput.value; persist(); };
    
    const priceInput = document.createElement("input");
    priceInput.className = "item-input price-input";
    priceInput.type = "number";
    priceInput.step = "0.01";
    priceInput.value = it.price;
    priceInput.oninput = () => {
      it.price = Number(priceInput.value || 0);
      persist(); renderButtons(); renderReceipt();
    };
    
    const colorInput = document.createElement("input");
    colorInput.className = "color-picker";
    colorInput.type = "color";
    colorInput.value = it.color || "#6b7280";
    colorInput.onchange = () => {
      it.color = colorInput.value;
      persist(); renderButtons();
    };
    
    const copyBtn = document.createElement("button");
    copyBtn.className = "btn small";
    copyBtn.textContent = "⎘";
    copyBtn.title = "Duplicate item";
    copyBtn.onclick = () => {
      const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.order || 0)) : -1;
      const newItem = {
        id: crypto.randomUUID(),
        name: it.name + " (copy)",
        price: it.price,
        color: it.color,
        groupId: it.groupId,
        order: maxOrder + 1
      };
      items.push(newItem);
      persist(); render();
    };
    
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn small danger";
    deleteBtn.textContent = "×";
    deleteBtn.onclick = () => {
      items = items.filter(x => x.id !== it.id);
      delete order[it.id];
      persist(); render();
    };
    
    row.appendChild(handle);
    row.appendChild(nameInput);
    row.appendChild(priceInput);
    row.appendChild(colorInput);
    row.appendChild(copyBtn);
    row.appendChild(deleteBtn);
    
    return row;
  }
  
  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll(".item-row:not(.dragging)")];
    
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
    const groupItems = items.filter(it => {
      if (groupId === null) {
        return !it.groupId || !groups.find(g => g.id === it.groupId);
      }
      return it.groupId === groupId;
    });
    
    // Find the container in DOM to get current order
    const containers = document.querySelectorAll(".group-items-list");
    containers.forEach(container => {
      const containerGroupId = container.dataset.groupId;
      if ((groupId === null && containerGroupId === "") || 
          (groupId !== null && Number(containerGroupId) === groupId)) {
        const rows = container.querySelectorAll(".item-row");
        rows.forEach((row, index) => {
          const itemId = row.dataset.itemId;
          const item = items.find(i => i.id === itemId);
          if (item) {
            item.order = index;
          }
        });
      }
    });
  }

  function renderOrder() {
    const wrap = $("orderTableWrap");
    const { lines, subtotal, discount, total } = calc();

    if (!lines.length) {
      wrap.innerHTML = `<div class="muted">No items yet. Tap buttons above to add.</div>`;
      $("totalLine").textContent = "";
      return;
    }

    const table = document.createElement("table");
    table.innerHTML = `
      <thead><tr><th>Item</th><th>Qty</th><th>Line</th><th></th></tr></thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector("tbody");

    for (const [id, qty] of Object.entries(order)) {
      const it = getItem(id);
      if (!it) continue;

      const tr = document.createElement("tr");

      const itemTd = document.createElement("td");
      itemTd.textContent = `${it.name} ($${money(it.price)})`;

      const qtyTd = document.createElement("td");
      const minus10 = document.createElement("button");
      minus10.className = "btn small";
      minus10.textContent = "--";
      minus10.onclick = () => setQty(id, (order[id] || 0) - 5);

      const minus = document.createElement("button");
      minus.className = "btn small";
      minus.textContent = "-";
      minus.onclick = () => setQty(id, (order[id] || 0) - 1);

      const qtyInput = document.createElement("input");
      qtyInput.type = "number";
      qtyInput.min = "0";
      qtyInput.step = "1";
      qtyInput.value = qty;
      qtyInput.style.width = "50px";
      qtyInput.style.textAlign = "center";
      qtyInput.style.margin = "0 4px";
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

      const plus = document.createElement("button");
      plus.className = "btn small";
      plus.textContent = "+";
      plus.onclick = () => setQty(id, (order[id] || 0) + 1);

      const plus10 = document.createElement("button");
      plus10.className = "btn small";
      plus10.textContent = "++";
      plus10.onclick = () => {
        const current = order[id] || 0;
        setQty(id, current < 5 ? 5 : current + 5);
      };

      qtyTd.append(minus10, minus, qtyInput, plus, plus10);

      const lineTd = document.createElement("td");
      lineTd.textContent = `$${money(it.price * qty)}`;

      const rmTd = document.createElement("td");
      const rmBtn = document.createElement("button");
      rmBtn.className = "btn small danger";
      rmBtn.textContent = "Remove";
      rmBtn.onclick = () => setQty(id, 0);
      rmTd.appendChild(rmBtn);

      tr.append(itemTd, qtyTd, lineTd, rmTd);
      tbody.appendChild(tr);
    }

    wrap.innerHTML = "";
    wrap.appendChild(table);

    const discPct = Number($("discountPct").value || 0);
    const parts = [`Subtotal $${money(subtotal)}`];
    if (discPct > 0) parts.push(`Discount -$${money(discount)}`);
    parts.push(`Total $${money(total)}`);
    $("totalLine").textContent = parts.join("  |  ");
  }

  function renderReceipt() {
    $("receiptOut").value = receiptText();
  }

  function render() {
    renderGroups();
    updateGroupSelects();
    renderButtons();
    renderEditor();
    renderOrder();
    renderReceipt();
    updateJsonTextbox();
  }

  // Update JSON textbox with current menu
  function updateJsonTextbox() {
    const menuData = {
      groups: groups,
      items: items.map(item => ({ 
        name: item.name, 
        price: item.price, 
        color: item.color,
        groupId: item.groupId || null
      })),
      title: $("receiptTitle").value || "Receipt",
      version: "3.0"
    };
    $("menuJsonText").value = JSON.stringify(menuData, null, 2);
  }

  // Load menu from JSON textbox
  function loadFromJson() {
    const jsonText = $("menuJsonText").value.trim();
    if (!jsonText) {
      alert("Please enter JSON data");
      return;
    }

    try {
      const menuData = JSON.parse(jsonText);
      
      if (!menuData.items || !Array.isArray(menuData.items)) {
        throw new Error("Invalid menu format - missing items array");
      }
      
      const confirmed = confirm(
        `Load menu with ${menuData.items.length} items?\n` +
        "This will replace your current menu items."
      );

      if (confirmed) {
        if (menuData.groups && Array.isArray(menuData.groups)) {
          groups = menuData.groups;
        } else {
          groups = [];
        }
        
        items = menuData.items.map((item, idx) => ({
          id: crypto.randomUUID(),
          name: item.name || "Unnamed Item",
          price: Number(item.price) || 0,
          color: item.color || "#6b7280",
          groupId: item.groupId || null,
          order: item.order ?? idx
        }));
        
        if (menuData.title) {
          $("receiptTitle").value = menuData.title;
        }
        
        order = {};
        persist();
        render();
        
        $("status").textContent = "Menu loaded from JSON!";
        setTimeout(() => $("status").textContent = "Saved locally", 1500);
      }

    } catch (error) {
      alert("Error parsing JSON: " + error.message);
    }
  }

  // Copy JSON to clipboard
  async function copyJson() {
    const jsonText = $("menuJsonText").value;
    try {
      await navigator.clipboard.writeText(jsonText);
      $("status").textContent = "JSON copied!";
      setTimeout(() => $("status").textContent = "Saved locally", 1000);
    } catch {
      $("menuJsonText").select();
      $("status").textContent = "JSON selected - press Ctrl+C to copy";
    }
  }

  // Event Listeners
  $("addGroupBtn").onclick = () => {
    const name = ($("newGroupName").value || "").trim();
    const order = Number($("newGroupOrder").value || (groups.length + 1));
    if (!name) return;

    const newId = groups.length > 0 ? Math.max(...groups.map(g => g.id)) + 1 : 1;
    groups.push({ id: newId, order, name });
    $("newGroupName").value = "";
    $("newGroupOrder").value = "";
    persist();
    render();
  };

  $("addItemBtn").onclick = () => {
    const name = ($("newName").value || "").trim();
    const price = Number($("newPrice").value || 0);
    const color = $("newColor").value || "#6b7280";
    const groupId = $("newGroupSelect").value ? Number($("newGroupSelect").value) : null;
    if (!name) return;

    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.order || 0)) : -1;
    items.push({ id: crypto.randomUUID(), name, price, color, groupId, order: maxOrder + 1 });
    $("newName").value = "";
    $("newPrice").value = "";
    $("newColor").value = "#6b7280";
    $("newGroupSelect").value = "";
    persist();
    render();
  };

  $("discountPct").oninput = () => { persist(); render(); };
  $("receiptTitle").oninput = () => { persist(); render(); };

  $("clearOrderBtn").onclick = () => {
    order = {};
    persist();
    render();
  };

  $("resetDefaultBtn").onclick = () => {
    const selectedTemplate = $("templateSelect").value;
    if (confirm(`Reset all items to ${selectedTemplate} template? This will remove custom items.`)) {
      groups = [...defaultGroups];
      items = menuTemplates[selectedTemplate].map((it, idx) => ({ 
        ...it, 
        id: crypto.randomUUID(),
        color: it.color || "#6b7280",
        groupId: it.groupId || null,
        order: idx
      }));
      order = {};
      persist();
      render();
    }
  };

  $("loadTemplateBtn").onclick = () => {
    const selectedTemplate = $("templateSelect").value;
    if (confirm(`Load ${selectedTemplate} template? This will replace your current menu items.`)) {
      groups = [...defaultGroups];
      items = menuTemplates[selectedTemplate].map((it, idx) => ({ 
        ...it, 
        id: crypto.randomUUID(),
        color: it.color || "#6b7280",
        groupId: it.groupId || null,
        order: idx
      }));
      order = {};
      persist();
      render();
      $("status").textContent = "Template loaded!";
      setTimeout(() => $("status").textContent = "Saved locally", 1500);
    }
  };

  $("copyBtn").onclick = async () => {
    const text = $("receiptOut").value;
    try {
      await navigator.clipboard.writeText(text);
      $("status").textContent = "Copied!";
      setTimeout(() => $("status").textContent = "Saved locally", 900);
    } catch {
      $("status").textContent = "Copy failed (select + ctrl/cmd+c)";
    }
  };

  $("selectBtn").onclick = () => {
    $("receiptOut").focus();
    $("receiptOut").select();
  };

  // Menu save/load functionality
  $("saveMenuBtn").onclick = () => {
    const defaultFilename = `menu-${new Date().toISOString().slice(0, 10)}`;
    const filename = prompt("Enter filename for menu:", defaultFilename);
    
    if (!filename) return;
    
    const finalFilename = filename.endsWith('.json') ? filename : filename + '.json';
    
    const menuData = {
      groups: groups,
      items: items.map(item => ({ 
        name: item.name, 
        price: item.price, 
        color: item.color,
        groupId: item.groupId || null
      })),
      title: $("receiptTitle").value || "Receipt",
      exportDate: new Date().toISOString(),
      version: "3.0"
    };
    
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
    
    $("status").textContent = "Menu saved!";
    setTimeout(() => $("status").textContent = "Saved locally", 1500);
  };

  $("loadMenuBtn").onclick = () => {
    $("menuFileInput").click();
  };

  $("menuFileInput").onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const menuData = JSON.parse(event.target.result);
        
        if (!menuData.items || !Array.isArray(menuData.items)) {
          throw new Error("Invalid menu format");
        }
        
        const confirmed = confirm(
          `Load menu with ${menuData.items.length} items?\n` +
          (menuData.exportDate ? `Exported: ${new Date(menuData.exportDate).toLocaleString()}\n` : "") +
          "This will replace your current menu items."
        );
        
        if (confirmed) {
          if (menuData.groups && Array.isArray(menuData.groups)) {
            groups = menuData.groups;
          } else {
            groups = [];
          }
          
          items = menuData.items.map((item, idx) => ({
            id: crypto.randomUUID(),
            name: item.name || "Unnamed Item",
            price: Number(item.price) || 0,
            color: item.color || "#6b7280",
            groupId: item.groupId || null,
            order: item.order ?? idx
          }));
          
          if (menuData.title) {
            $("receiptTitle").value = menuData.title;
          }
          
          order = {};
          persist();
          render();
          
          $("status").textContent = "Menu loaded!";
          setTimeout(() => $("status").textContent = "Saved locally", 1500);
        }
      } catch (error) {
        alert("Error loading menu file: " + error.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // JSON textbox event listeners
  $("loadJsonBtn").onclick = loadFromJson;
  $("copyJsonBtn").onclick = copyJson;

  // Groups collapse toggle
  $("groupsHeader").onclick = () => {
    const content = $("groupsCollapsible");
    const icon = $("groupsHeader").querySelector(".collapse-icon");
    if (content.style.display === "none") {
      content.style.display = "block";
      icon.textContent = "▼";
    } else {
      content.style.display = "none";
      icon.textContent = "▶";
    }
  };

  // Tab switching functionality
  function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    $(tabName + 'Tab').classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    $(tabName + 'TabContent').classList.add('active');
    
    // Save current tab preference
    localStorage.setItem('sop_current_tab', tabName);
  }

  // Initialize tab switching
  $("menuTab").onclick = () => switchTab('menu');
  $("orderingTab").onclick = () => switchTab('ordering');

  // Set initial tab - load from localStorage or default to menu tab
  const savedTab = localStorage.getItem('sop_current_tab') || 'menu';
  switchTab(savedTab);

  // Initial render
  render();
})();