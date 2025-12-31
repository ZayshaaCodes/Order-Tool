(() => {
  const $ = (id) => document.getElementById(id);

  // API configuration
  const API_BASE = 'http://localhost:3001'; // Change this to your domain when using Cloudflare tunnel

  const menuTemplates = {
    "KOI": [
      { name: "Guku", price: 100, color: "#16a34a" },         
      { name: "Pad Thai", price: 200, color: "#16a34a" },     
      { name: "Cali Maki", price: 100, color: "#16a34a" },    
      { name: "Salad", price: 80, color: "#16a34a" },         
      { name: "Sashimi Roll", price: 120, color: "#16a34a" }, 
      { name: "Tuna Roll", price: 150, color: "#16a34a" },    
      { name: "Pan Noodles", price: 100, color: "#16a34a" },  
      { name: "Matcha Tea", price: 80, color: "#2563eb" },    
      { name: "Sake", price: 100, color: "#2563eb" },         
      { name: "Sakura Latte", price: 50, color: "#2563eb" }   
    ],
  };

  const defaultItems = menuTemplates["KOI"].map(item => ({
    ...item,
    id: crypto.randomUUID(),
    color: item.color || "#6b7280"
  }));

  const load = (k, fallback) => {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  };
  
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

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
    items.forEach(it => {
      const b = document.createElement("button");
      b.className = "btn";
      b.textContent = `${it.name} ($${money(it.price)})`;
      b.style.backgroundColor = it.color || "#6b7280";
      b.style.borderColor = it.color || "#6b7280";
      b.style.color = "#ffffff";
      b.onclick = () => addToOrder(it.id);
      wrap.appendChild(b);
    });
  }

  function renderEditor() {
    const wrap = $("itemsEditor");
    wrap.innerHTML = "";

    const table = document.createElement("table");
    table.innerHTML = `
      <thead><tr><th>Name</th><th>Price</th><th>Color</th><th></th></tr></thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector("tbody");

    items.forEach(it => {
      const tr = document.createElement("tr");

      const nameTd = document.createElement("td");
      const nameIn = document.createElement("input");
      nameIn.value = it.name;
      nameIn.oninput = () => { it.name = nameIn.value; persist(); render(); };
      nameTd.appendChild(nameIn);

      const priceTd = document.createElement("td");
      const priceIn = document.createElement("input");
      priceIn.type = "number";
      priceIn.step = "0.01";
      priceIn.value = it.price;
      priceIn.oninput = () => {
        it.price = Number(priceIn.value || 0);
        persist(); render();
      };
      priceTd.appendChild(priceIn);

      const colorTd = document.createElement("td");
      const colorIn = document.createElement("input");
      colorIn.type = "color";
      colorIn.className = "color-picker";
      colorIn.value = it.color || "#6b7280";
      colorIn.onchange = () => {
        it.color = colorIn.value;
        persist(); render();
      };
      colorTd.appendChild(colorIn);

      const delTd = document.createElement("td");
      const delBtn = document.createElement("button");
      delBtn.className = "btn small danger";
      delBtn.textContent = "Delete";
      delBtn.onclick = () => {
        items = items.filter(x => x.id !== it.id);
        delete order[it.id];
        persist(); render();
      };
      delTd.appendChild(delBtn);

      tr.appendChild(nameTd);
      tr.appendChild(priceTd);
      tr.appendChild(colorTd);
      tr.appendChild(delTd);
      tbody.appendChild(tr);
    });

    wrap.appendChild(table);
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
    renderButtons();
    renderEditor();
    renderOrder();
    renderReceipt();
  }

  // Generate a random 6-character code for sharing
  function generateShareCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Share menu online
  async function shareMenu() {
    try {
      $("shareBtn").disabled = true;
      $("shareBtn").textContent = "Sharing...";
      
      const menuData = {
        items: items.map(item => ({ 
          name: item.name, 
          price: item.price, 
          color: item.color 
        })),
        title: $("receiptTitle").value || "Receipt",
        createdAt: new Date().toISOString(),
        version: "2.0"
      };

      const response = await fetch(`${API_BASE}/api/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(menuData)
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      
      // Show the share code
      $("shareCodeDisplay").textContent = result.code;
      $("shareCodeSection").style.display = "block";
      
      $("status").textContent = "Menu shared successfully!";
      setTimeout(() => $("status").textContent = "Saved locally", 2000);

    } catch (error) {
      console.error('Error sharing menu:', error);
      $("status").textContent = "Failed to share menu (check connection)";
      setTimeout(() => $("status").textContent = "Saved locally", 2000);
    } finally {
      $("shareBtn").disabled = false;
      $("shareBtn").textContent = "Share menu";
    }
  }

  // Load menu from share code
  async function loadSharedMenu() {
    const code = $("shareCodeInput").value.trim().toUpperCase();
    if (!code) {
      alert("Please enter a share code");
      return;
    }

    try {
      $("loadSharedBtn").disabled = true;
      $("loadSharedBtn").textContent = "Loading...";

      const response = await fetch(`${API_BASE}/api/menu/${code}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Menu not found. Check your code and try again.");
        }
        throw new Error(`Server error: ${response.status}`);
      }

      const menuData = await response.json();
      
      const confirmed = confirm(
        `Load shared menu with ${menuData.items.length} items?\n` +
        `Shared: ${new Date(menuData.createdAt).toLocaleString()}\n` +
        "This will replace your current menu items."
      );

      if (confirmed) {
        items = menuData.items.map(item => ({
          id: crypto.randomUUID(),
          name: item.name || "Unnamed Item",
          price: Number(item.price) || 0,
          color: item.color || "#6b7280"
        }));
        
        if (menuData.title) {
          $("receiptTitle").value = menuData.title;
        }
        
        // Clear current order since items changed
        order = {};
        
        persist();
        render();
        
        $("shareCodeInput").value = "";
        $("status").textContent = "Shared menu loaded!";
        setTimeout(() => $("status").textContent = "Saved locally", 2000);
      }

    } catch (error) {
      console.error('Error loading shared menu:', error);
      alert("Error: " + error.message);
    } finally {
      $("loadSharedBtn").disabled = false;
      $("loadSharedBtn").textContent = "Load";
    }
  }

  // Copy share code to clipboard
  async function copyShareCode() {
    const code = $("shareCodeDisplay").textContent;
    try {
      await navigator.clipboard.writeText(code);
      $("status").textContent = "Share code copied!";
      setTimeout(() => $("status").textContent = "Saved locally", 1000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      $("shareCodeDisplay").select();
      $("shareCodeDisplay").setSelectionRange(0, 99999);
      $("status").textContent = "Code selected - press Ctrl+C to copy";
    }
  }

  // Event Listeners
  $("addItemBtn").onclick = () => {
    const name = ($("newName").value || "").trim();
    const price = Number($("newPrice").value || 0);
    const color = $("newColor").value || "#6b7280";
    if (!name) return;

    items.push({ id: crypto.randomUUID(), name, price, color });
    $("newName").value = "";
    $("newPrice").value = "";
    $("newColor").value = "#6b7280";
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
      items = menuTemplates[selectedTemplate].map(it => ({ 
        ...it, 
        id: crypto.randomUUID(),
        color: it.color || "#6b7280"
      }));
      order = {};
      persist();
      render();
    }
  };

  $("loadTemplateBtn").onclick = () => {
    const selectedTemplate = $("templateSelect").value;
    if (confirm(`Load ${selectedTemplate} template? This will replace your current menu items.`)) {
      items = menuTemplates[selectedTemplate].map(it => ({ 
        ...it, 
        id: crypto.randomUUID(),
        color: it.color || "#6b7280"
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
      items: items.map(item => ({ 
        name: item.name, 
        price: item.price, 
        color: item.color 
      })),
      title: $("receiptTitle").value || "Receipt",
      exportDate: new Date().toISOString(),
      version: "2.0"
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
          items = menuData.items.map(item => ({
            id: crypto.randomUUID(),
            name: item.name || "Unnamed Item",
            price: Number(item.price) || 0,
            color: item.color || "#6b7280"
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

  // Share functionality event listeners
  $("shareBtn").onclick = shareMenu;
  $("loadSharedBtn").onclick = loadSharedMenu;
  $("copyShareCodeBtn").onclick = copyShareCode;

  // Allow pressing Enter to load shared menu
  $("shareCodeInput").onkeypress = (e) => {
    if (e.key === 'Enter') {
      loadSharedMenu();
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