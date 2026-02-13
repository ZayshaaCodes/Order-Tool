(() => {
  const $ = (id) => document.getElementById(id);
  
  // DOM helper utilities
  const createElement = (tag, className = '', attributes = {}) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'text') el.textContent = value;
      else if (key === 'html') el.innerHTML = value;
      else if (key.startsWith('on')) el[key] = value;
      else el.setAttribute(key, value);
    });
    return el;
  };
  
  const createButton = (text, className = 'btn', onClick = null) => {
    const btn = createElement('button', className, { text });
    if (onClick) btn.onclick = onClick;
    return btn;
  };
  
  const createInput = (type, className, value = '', attributes = {}) => {
    return createElement('input', className, { type, value, ...attributes });
  };
  
  const showStatus = (message, duration = 1500) => {
    const el = $("status");
    if (!el) return;
    el.textContent = message;
    if (duration) setTimeout(() => { if (el) el.textContent = "Saved locally"; }, duration);
  };

  // Last order management
  const saveLastOrder = () => {
    if (Object.keys(order).length > 0) {
      save("sop_last_order_v1", { ...order });
    }
  };

  const getLastOrder = () => load("sop_last_order_v1", null);

  const updateLastOrderButton = () => {
    const btn = $("lastOrderBtn");
    if (!btn) return;
    const last = getLastOrder();
    btn.style.display = (last && Object.keys(last).length > 0) ? '' : 'none';
  };

  const menuTemplates = {
    "KOI": {
      title: "KOI Receipt",
      groups: [
        { id: 1, order: 1, name: "Food" },
        { id: 2, order: 2, name: "Drinks" }
      ],
      specials: [
        { name: "Trent Special", price: 800, color: "#dc2626", groupId: 1, subItems: ["5x Sakura Latte", "5x Tuna Roll"] },
        { name: "Brokie Meal", price: 250, color: "#dc2626", groupId: 1, subItems: ["1x Guku", "1x Chips", "1x Matcha Tea"] },
        { name: "Sushi Sample", price: 500, color: "#dc2626", groupId: 1, subItems: ["1x Cali Maki", "1x Sashimi Roll", "1x Tuna Roll", "3x Sakura Latte"] },
        { name: "Quarter Zip Special", price: 300, color: "#dc2626", groupId: 1, subItems: ["2x Salad", "2x Matcha Tea"] },
        { name: "Good 4 The Soul", price: 350, color: "#dc2626", groupId: 1, subItems: ["1x Pad Thai", "1x Tuna Roll", "Drink Of Choice"] }
      ],
      items: [
        { name: "Guku", price: 100, color: "#16a34a", groupId: 1, emoji: "🍛" },         
        { name: "Pad Thai", price: 200, color: "#16a34a", groupId: 1, emoji: "🍜" },     
        { name: "Cali Maki", price: 100, color: "#16a34a", groupId: 1, emoji: "🍣" },    
        { name: "Salad", price: 80, color: "#16a34a", groupId: 1, emoji: "🥗" },         
        { name: "Sashimi Roll", price: 120, color: "#16a34a", groupId: 1, emoji: "🍣" }, 
        { name: "Tuna Roll", price: 140, color: "#16a34a", groupId: 1, emoji: "🌣" },    
        { name: "Chips", price: 100, color: "#16a34a", groupId: 1, emoji: "🍟" },    
        { name: "Japanese Pan Noodles", price: 100, color: "#16a34a", groupId: 1, emoji: "🍜" },  
        { name: "Matcha Tea", price: 80, color: "#2563eb", groupId: 2, emoji: "🍵" },    
        { name: "Sake", price: 100, color: "#2563eb", groupId: 2, emoji: "🍶" },         
        { name: "Sakura Latte", price: 50, color: "#2563eb", groupId: 2, emoji: "☕" }   
      ]
    },    
    "L'espoir": {
      title: "L'espoir Receipt",
      groups: [
        { id: 1, order: 1, name: "Food" },
        { id: 2, order: 2, name: "Drinks" },
        { id: 3, order: 3, name: "Deserts" }
      ],
      specials: [
      ],
      items: [
        { name: "Baguette", price: 50, color: "#16a34a", groupId: 1, emoji: "🥖" },         
        { name: "French Onion Soup", price: 150, color: "#16a34a", groupId: 1, emoji: "🍲" },     
        { name: "Fettuccine Alfredo", price: 120, color: "#16a34a", groupId: 1, emoji: "🍝" },    
        { name: "Ratatouille", price: 120, color: "#16a34a", groupId: 1, emoji: "🥘" },         
        { name: "Latte", price: 50, color: "#2563eb", groupId: 2, emoji: "☕" },
        { name: "Orangina", price: 40, color: "#2563eb", groupId: 2, emoji: "🍊" },    
        { name: "Red Wine", price: 150, color: "#2563eb", groupId: 2, emoji: "🍷" },         
        { name: "Bavarois", price: 35, color: "#8825ebff", groupId: 3, emoji: "🍮" },         
        { name: "Chocolate Eclair", price: 35, color: "#8825ebff", groupId: 3, emoji: "🍫" },         
      ]
    },  
    "French Bakery": {
      title: "French Bakery Receipt",
      groups: [
        { id: 1, order: 1, name: "Food" },
        { id: 2, order: 2, name: "Drinks" },
        { id: 3, order: 3, name: "Deserts" }
      ],
      specials: [
        { name: "Bacon Special", price: 400, color: "#dc2626", groupId: 1, subItems: ["5x Stack of Donuts", "5x Coke"] }
      ],
      items: [
        { name: "Baguette", price: 40, color: "#16a34a", groupId: 1, emoji: "🥖" },         
        { name: "Bavarois", price: 40, color: "#16a34a", groupId: 1, emoji: "🍮" },     
        { name: "Charlotte", price: 60, color: "#16a34a", groupId: 1, emoji: "🎂" },    
        { name: "Chocolate Eclair", price: 40, color: "#16a34a", groupId: 1, emoji: "🍫" },         
        { name: "Choux Pastry", price: 75, color: "#16a34a", groupId: 1, emoji: "🥐" },
        { name: "Stack of Donuts", price: 50, color: "#16a34a", groupId: 1, emoji: "🍩" },    
        { name: "Salad", price: 30, color: "#16a34a", groupId: 1, emoji: "🥗" },    
        { name: "Coke", price: 40, color: "#2563eb", groupId: 2, emoji: "🥤" },    
        { name: "Latte", price: 45, color: "#2563eb", groupId: 2, emoji: "☕" },    
        { name: "Lemonade", price: 30, color: "#2563eb", groupId: 2, emoji: "🍋" },    
        { name: "Orange Smoothie", price: 50, color: "#2563eb", groupId: 2, emoji: "🍊" },    
      ]
    },    
    "Dreamworks": {
      title: "Dreamworks Receipt",
      groups: [
        { id: 1, order: 1, name: "Services" },
        { id: 2, order: 2, name: "Tools" },
        { id: 3, order: 3, name: "Employees" }
      ],
      specials: [
        { name: "Full Service Package", price: 15000, color: "#dc2626", groupId: 1 }
      ],
      items: [
        { name: "Body Repair", price: 75, color: "#16a34a", groupId: 1, emoji: "🔧" },         
        { name: "Internals", price: 800, color: "#16a34a", groupId: 1, emoji: "⚙️" },     
        { name: "HG Internals", price: 1200, color: "#16a34a", groupId: 1, emoji: "🔩" },    
        { name: "Upgrade", price: 2500, color: "#16a34a", groupId: 1, emoji: "⬆️" },    
        { name: "Turbo", price: 5000, color: "#16a34a", groupId: 1, emoji: "🚀" },  
        { name: "Max Upgrade", price: 14000, color: "#16a34a", groupId: 1, emoji: "💎" },
        { name: "Lockpick", price: 25, color: "#16a34a", groupId: 2, emoji: "🔑" },         
        { name: "Repair Kit", price: 150, color: "#16a34a", groupId: 2, emoji: "🧰" }, 
        { name: "Adv. Repair Kit", price: 450, color: "#16a34a", groupId: 2, emoji: "🛠️" }, 
        { name: "Employee Max Upgrades", price: 10000, color: "#2563eb", groupId: 3, emoji: "👨‍🔧" },
      ]
    },
    "Clicklovers": {
      title: "Clicklovers Receipt",
      groups: [
        { id: 1, order: 1, name: "Theft Tools" },
        { id: 2, order: 2, name: "Electronics" },
        { id: 3, order: 3, name: "Laptops" },
        { id: 4, order: 4, name: "Accessories" }
      ],
      specials: [
        { name: "Car Bomb", price: 75000, color: "#dc2626" }
      ],
      items: [
        // Theft Tools
        { name: "Screwdriver", price: 15, color: "#16a34a", groupId: 1, emoji: "🪛" },
        { name: "Drill", price: 350, color: "#16a34a", groupId: 1, emoji: "🔩" },
        { name: "Safe Cracking Kit", price: 1500, color: "#16a34a", groupId: 1, emoji: "🔐" },
        { name: "Electronics Kit", price: 3500, color: "#16a34a", groupId: 1, emoji: "🔌" },
        { name: "Hacking Device", price: 7500, color: "#16a34a", groupId: 1, emoji: "💻" },

        // Electronics
        { name: "Advanced Radio", price: 3000, color: "#2563eb", groupId: 2, emoji: "📻" },
        { name: "Basic Radio", price: 1500, color: "#2563eb", groupId: 2, emoji: "📡" },
        { name: "Camera", price: 500, color: "#2563eb", groupId: 2, emoji: "📷" },
        { name: "Phone", price: 750, color: "#2563eb", groupId: 2, emoji: "📱" },
        { name: "Smart Watch", price: 500, color: "#2563eb", groupId: 2, emoji: "⌚" },
        { name: "VPN", price: 4000, color: "#2563eb", groupId: 2, emoji: "🔒" },

        // Laptops
        { name: "Green Laptop", price: 8000, color: "#8825ebff", groupId: 3, emoji: "💻" },
        { name: "Red Laptop", price: 15000, color: "#8825ebff", groupId: 3, emoji: "💻" },
        { name: "Gold Laptop", price: 25000, color: "#8825ebff", groupId: 3, emoji: "💻" },
        { name: "Blue Laptop", price: 30000, color: "#8825ebff", groupId: 3, emoji: "💻" },

        // Accessories
        { name: "Card Holder", price: 100, color: "#f59e0b", groupId: 4, emoji: "💳" },
        { name: "Duffle Bag", price: 1000, color: "#f59e0b", groupId: 4, emoji: "👜" }
      ]
    },
    "Materials": {
      title: "Materials Receipt",
      groups: [
        { id: 1, order: 1, name: "Base Materials" }
      ],
      specials: [
        { name: "100 x Plastic", price: 400, color: "#dc2626", groupId: 1, subItems: ["100x Plastic"] },
        { name: "100 x Rubber", price: 100, color: "#dc2626", groupId: 1, subItems: ["100x Rubber"] },
        { name: "100 x Iron Bars", price: 400, color: "#dc2626", groupId: 1, subItems: ["100x Iron Bars"] },
        { name: "100 x Copper Wire", price: 200, color: "#dc2626", groupId: 1, subItems: ["100x Copper Wire"] },
        { name: "100 x Heavy Duty Glue", price: 100, color: "#dc2626", groupId: 1, subItems: ["100x Heavy Duty Glue"] },
        { name: "100 x Glue", price: 100, color: "#dc2626", groupId: 1, subItems: ["100x Glue"] },
        { name: "100 x Electronic Parts", price: 100, color: "#dc2626", groupId: 1, subItems: ["100x Electronic Parts"] },
        { name: "100 x Scrap Metal", price: 400, color: "#dc2626", groupId: 1, subItems: ["100x Scrap Metal"] }
      ],
      items: [
        // Base individual materials for breakdown reference
        { name: "Plastic", price: 4, color: "#16a34a", groupId: 1, emoji: "🪣" },
        { name: "Rubber", price: 1, color: "#16a34a", groupId: 1, emoji: "⚫" },
        { name: "Iron Bars", price: 4, color: "#16a34a", groupId: 1, emoji: "🧱" },
        { name: "Copper Wire", price: 2, color: "#16a34a", groupId: 1, emoji: "🪭" },
        { name: "Heavy Duty Glue", price: 1, color: "#16a34a", groupId: 1, emoji: "🪥" },
        { name: "Glue", price: 1, color: "#16a34a", groupId: 1, emoji: "🪥" },
        { name: "Electronic Parts", price: 1, color: "#16a34a", groupId: 1, emoji: "⚡" },
        { name: "Scrap Metal", price: 4, color: "#16a34a", groupId: 1, emoji: "🔩" }
      ]
    }
  };

  const defaultTemplate = menuTemplates["KOI"];
  const defaultItems = defaultTemplate.items.map((item, index) => ({
    ...item,
    id: crypto.randomUUID(),
    color: item.color || "#6b7280",
    emoji: item.emoji || "",
    groupId: item.groupId || null,
    order: index
  }));
  
  const defaultSpecials = defaultTemplate.specials.map((special, index) => ({
    ...special,
    id: crypto.randomUUID(),
    color: special.color || "#dc2626",
    order: index,
    subItems: special.subItems || []
  }));

  const load = (k, fallback) => {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  };
  
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  let groups = load("sop_groups_v1", defaultTemplate.groups);
  let items = load("sop_items_v1", defaultItems);
  let specials = load("sop_specials_v1", defaultSpecials);
  let order = load("sop_order_v1", {}); // { itemId: qty }
  let discountPct = load("sop_discount_v1", 0);
  let title = load("sop_title_v1", "Receipt");

  // Initialize form values
  $("discountPct").value = discountPct;
  $("receiptTitle").value = title;

  const hiddenTemplates = new Set(["Materials"]);

  populateTemplateDropdown();

  function populateTemplateDropdown() {
    const select = $("templateSelect");
    select.innerHTML = "";
    
    Object.keys(menuTemplates).forEach(templateName => {
      if (hiddenTemplates.has(templateName)) return;
      const option = document.createElement("option");
      option.value = templateName;
      option.textContent = templateName;
      select.appendChild(option);
    });
    
    // Set default to first visible template
    if (select.options.length > 0) {
      select.value = select.options[0].value;
    }
  }

  function money(n) { 
    return (Math.round((n + Number.EPSILON) * 100) / 100).toFixed(2); 
  }

  function getItem(id) { 
    return items.find(i => i.id === id) || specials.find(s => s.id === id);
  }

  function addToOrder(id) {
    order[id] = (order[id] || 0) + 1;
    persist();
    render();
    // Toast + animation
    const it = getItem(id);
    if (it) {
    }
    // Pulse the button
    const btnEl = document.querySelector(`[data-item-id="${id}"] .btn, [data-item-id="${id}"]`);
    if (btnEl) {
      btnEl.classList.remove('btn-add-pulse');
      void btnEl.offsetWidth; // force reflow
      btnEl.classList.add('btn-add-pulse');
      setTimeout(() => btnEl.classList.remove('btn-add-pulse'), 300);
    }
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
    save("sop_specials_v1", specials);
    save("sop_order_v1", order);
    save("sop_discount_v1", Number($("discountPct").value || 0));
    save("sop_title_v1", $("receiptTitle").value || "Receipt");
    const statusEl = $("status");
    if (statusEl) statusEl.textContent = "Saved locally";
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
  
  // Calculate component breakdown (for inventory/kitchen prep)
  function getComponentBreakdown() {
    const components = {};
    
    // Helper to parse "2x Item" or "Item" format
    const parseSubItem = (subItem) => {
      const match = subItem.trim().match(/^(\d+)x\s*(.+)$/);
      if (match) {
        return { qty: parseInt(match[1]), name: match[2].trim() };
      }
      return { qty: 1, name: subItem.trim() };
    };
    
    Object.entries(order).forEach(([id, qty]) => {
      const item = getItem(id);
      if (!item) return;
      
      // If it's a special with sub-items, count each sub-item
      if (item.subItems && item.subItems.length > 0) {
        item.subItems.forEach(subItemStr => {
          const { qty: subQty, name } = parseSubItem(subItemStr);
          components[name] = (components[name] || 0) + (qty * subQty);
        });
      } else {
        // Regular item, count it directly
        components[item.name] = (components[item.name] || 0) + qty;
      }
    });
    
    // Convert to sorted array
    return Object.entries(components)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => a.name.localeCompare(b.name));
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
        // Add sub-items if this is a special with sub-items
        const item = getItem(Object.keys(order).find(id => {
          const it = getItem(id);
          return it && it.name === l.name;
        }));
        if (item && item.subItems && item.subItems.length > 0) {
          item.subItems.forEach(subItem => {
            body.push(`  - ${subItem}`);
          });
        }
      }
      body.push("");
      body.push(`Subtotal: $${money(subtotal)}`);
      const discPct = Number($("discountPct").value || 0);
      if (discPct > 0) body.push(`Discount (${money(discPct)}%): -$${money(discount)}`);
      body.push(`Total: $${money(total)}`);
      
      // Add component breakdown if enabled and there are specials
      const showBreakdown = $("showBreakdownInReceipt") && $("showBreakdownInReceipt").checked;
      if (showBreakdown) {
        const components = getComponentBreakdown();
        const hasSpecials = Object.keys(order).some(id => {
          const item = getItem(id);
          return item && item.subItems && item.subItems.length > 0;
        });
        
        if (hasSpecials && components.length > 0) {
          body.push("");
          body.push("--- Component Breakdown ---");
          components.forEach(({ name, qty }) => {
            body.push(`${qty}x ${name}`);
          });
        }
      }
    }
    return body.join("\n");
  }

  function shorthandReceiptText() {
    const { lines, subtotal, discount, total } = calc();
    if (!lines.length) return "(no items)";
    const parts = lines.map(l => l.qty > 1 ? `${l.qty}x ${l.name}` : l.name);
    const discPct = Number($("discountPct").value || 0);
    const totalStr = discPct > 0 ? `Total: $${money(total)} (was $${money(subtotal)})` : `Total: $${money(total)}`;
    return parts.join(", ") + " | " + totalStr;
  }

  function renderButtons() {
    const wrap = $("itemButtons");
    wrap.innerHTML = "";
    
    const searchTerm = "";
    let totalVisible = 0;
    
    // Helper: create a menu button with emoji + badge
    const createMenuBtn = (item, isSpecial) => {
      const wrapper = document.createElement("div");
      wrapper.className = "menu-btn-wrap";
      wrapper.dataset.itemId = item.id;
      
      const b = document.createElement("button");
      b.className = "btn" + (isSpecial ? " special-btn" : "");
      
      const emojiSpan = item.emoji ? `<span class="btn-emoji">${item.emoji}</span>` : '';
      b.innerHTML = `${emojiSpan}${item.name} ($${money(item.price)})`;
      
      b.style.backgroundColor = item.color || (isSpecial ? "#dc2626" : "#6b7280");
      b.style.borderColor = item.color || (isSpecial ? "#dc2626" : "#6b7280");
      b.style.color = "#ffffff";
      b.onclick = (e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey) {
          // Ctrl/Cmd/Shift+click: +5
          order[item.id] = (order[item.id] || 0) + 5;
          persist();
          render();
        } else {
          addToOrder(item.id);
        }
      };
      b.oncontextmenu = (e) => {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey || e.shiftKey) {
          // Ctrl/Shift+right-click: -5
          if (order[item.id] && order[item.id] > 0) {
            setQty(item.id, Math.max(0, order[item.id] - 5));
          }
        } else {
          // Right-click: -1
          if (order[item.id] && order[item.id] > 0) {
            setQty(item.id, order[item.id] - 1);
          }
        }
      };
      b.title = "Click: +1 | Ctrl+Click: +5 | Right-click: -1 | Ctrl+Right-click: -5";
      
      wrapper.appendChild(b);
      
      // Quantity badge
      const qty = order[item.id];
      if (qty && qty > 0) {
        const badge = document.createElement("span");
        badge.className = "qty-badge";
        badge.textContent = qty;
        wrapper.appendChild(badge);
      }
      
      // Search filtering
      if (searchTerm) {
        const nameMatch = item.name.toLowerCase().includes(searchTerm);
        if (!nameMatch) {
          wrapper.style.display = "none";
        } else {
          totalVisible++;
        }
      } else {
        totalVisible++;
      }
      
      return wrapper;
    };
    
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
      
      let groupVisible = 0;
      groupItems.forEach(it => {
        const btn = createMenuBtn(it, false);
        if (btn.style.display !== "none") groupVisible++;
        groupContainer.appendChild(btn);
      });
      
      // Hide group header when all items are filtered out
      if (searchTerm && groupVisible === 0) {
        groupHeader.classList.add("group-hidden");
        groupContainer.classList.add("group-hidden");
      }
      
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
      
      let groupVisible = 0;
      ungroupedItems.forEach(it => {
        const btn = createMenuBtn(it, false);
        if (btn.style.display !== "none") groupVisible++;
        groupContainer.appendChild(btn);
      });
      
      if (searchTerm && groupVisible === 0) {
        groupHeader.classList.add("group-hidden");
        groupContainer.classList.add("group-hidden");
      }
      
      wrap.appendChild(groupContainer);
    }
    
    // Render specials section
    if (specials.length > 0) {
      const specialsHeader = document.createElement("h4");
      specialsHeader.className = "item-group-header specials-header";
      specialsHeader.textContent = "Specials";
      wrap.appendChild(specialsHeader);
      
      const specialsContainer = document.createElement("div");
      specialsContainer.className = "item-group-buttons";
      
      let specialsVisible = 0;
      [...specials].sort((a, b) => (a.order || 0) - (b.order || 0)).forEach(special => {
        const btn = createMenuBtn(special, true);
        if (btn.style.display !== "none") specialsVisible++;
        specialsContainer.appendChild(btn);
      });
      
      if (searchTerm && specialsVisible === 0) {
        specialsHeader.classList.add("group-hidden");
        specialsContainer.classList.add("group-hidden");
      }
      
      wrap.appendChild(specialsContainer);
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

    const onGroupMetaChange = () => {
      // Do not call full render() here: it re-creates the groups table and
      // causes the active input to lose focus while typing.
      persist();
      updateGroupSelects();
      renderButtons();
      renderEditor();
      updateJsonTextbox();
    };

    [...groups].sort((a, b) => a.order - b.order).forEach(group => {
      const tr = document.createElement("tr");

      const orderTd = document.createElement("td");
      const orderIn = document.createElement("input");
      orderIn.type = "number";
      orderIn.value = group.order;
      orderIn.style.width = "60px";
      orderIn.oninput = () => {
        group.order = Number(orderIn.value || 0);
        onGroupMetaChange();
      };
      orderTd.appendChild(orderIn);

      const nameTd = document.createElement("td");
      const nameIn = document.createElement("input");
      nameIn.value = group.name;
      nameIn.oninput = () => {
        group.name = nameIn.value;
        onGroupMetaChange();
      };
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
  
  function renderSpecialsEditor() {
    const wrap = $("specialsEditor");
    wrap.innerHTML = "";
    
    if (specials.length === 0) {
      wrap.appendChild(createElement('div', 'empty-state', { text: 'No specials yet. Add one above.' }));
      return;
    }
    
    const container = createElement('div', 'group-container');
    const itemsList = createElement('div', 'group-items-list');
    
    const setupDraggable = (wrapper, id, container) => {
      wrapper.draggable = true;
      wrapper.ondragstart = (e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", id);
        wrapper.classList.add("dragging");
      };
      wrapper.ondragend = () => wrapper.classList.remove("dragging");
      wrapper.ondragover = (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(container, e.clientY);
        const dragging = document.querySelector(".dragging");
        if (afterElement == null) container.appendChild(dragging);
        else container.insertBefore(dragging, afterElement);
      };
    };
    
    [...specials].sort((a, b) => (a.order || 0) - (b.order || 0)).forEach(special => {
      // Create a wrapper for the special and its sub-items
      const specialWrapper = createElement('div', 'special-wrapper');
      specialWrapper.dataset.specialId = special.id;
      setupDraggable(specialWrapper, special.id, itemsList);
      
      const row = createElement('div', 'item-row');
      
      const handle = createElement('div', 'drag-handle', { html: '⋮⋮' });
      
      const nameInput = createInput('text', 'item-input', special.name, {
        oninput: () => { special.name = nameInput.value; persist(); }
      });
      
      const priceInput = createInput('number', 'item-input price-input', special.price, {
        step: '0.01',
        oninput: () => {
          special.price = Number(priceInput.value || 0);
          persist(); renderButtons(); renderReceipt();
        }
      });
      
      const colorInput = createInput('color', 'color-picker', special.color || '#dc2626', {
        onchange: () => {
          special.color = colorInput.value;
          persist(); renderButtons();
        }
      });
      
      const copyBtn = createButton('⎘', 'btn small', () => {
        const maxOrder = specials.length > 0 ? Math.max(...specials.map(s => s.order || 0)) : -1;
        specials.push({
          id: crypto.randomUUID(),
          name: special.name + " (copy)",
          price: special.price,
          color: special.color,
          groupId: special.groupId,
          order: maxOrder + 1,
          subItems: [...(special.subItems || [])]
        });
        persist(); render();
      });
      copyBtn.title = "Duplicate special";
      
      const deleteBtn = createButton('×', 'btn small danger', () => {
        specials = specials.filter(x => x.id !== special.id);
        delete order[special.id];
        persist(); render();
      });
      
      row.appendChild(handle);
      row.appendChild(nameInput);
      row.appendChild(priceInput);
      row.appendChild(colorInput);
      row.appendChild(copyBtn);
      row.appendChild(deleteBtn);
      
      specialWrapper.appendChild(row);
      
      // Add sub-items input field
      const subItemsRow = createElement('div', 'sub-items-row');
      const subItemsLabel = createElement('label', 'sub-items-label', { text: 'Sub-items:' });
      const subItemsInput = createInput('text', 'sub-items-input', (special.subItems || []).join(", "), {
        placeholder: 'e.g., 2x Guku, 1x Tea, Salad',
        oninput: () => {
          special.subItems = subItemsInput.value.split(',').map(s => s.trim()).filter(s => s);
          persist(); renderReceipt();
        }
      });
      
      subItemsRow.append(subItemsLabel, subItemsInput);
      specialWrapper.appendChild(subItemsRow);
      
      itemsList.appendChild(specialWrapper);
    });
    
    // Reorder specials after drag
    itemsList.ondrop = () => {
      setTimeout(() => {
        const wrappers = itemsList.querySelectorAll(".special-wrapper");
        wrappers.forEach((wrapper, index) => {
          const specialId = wrapper.dataset.specialId;
          const special = specials.find(s => s.id === specialId);
          if (special) special.order = index;
        });
        persist();
      }, 0);
    };
    
    container.appendChild(itemsList);
    wrap.appendChild(container);
  }

  function updateGroupSelects() {
    const selects = [$("newGroupSelect"), $("newSpecialGroupSelect")];
    selects.forEach(select => {
      if (!select) return;
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
    
    const emojiInput = document.createElement("input");
    emojiInput.className = "item-input emoji-input";
    emojiInput.value = it.emoji || "";
    emojiInput.placeholder = "🍽️";
    emojiInput.title = "Emoji icon";
    emojiInput.oninput = () => {
      it.emoji = emojiInput.value;
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
        emoji: it.emoji || "",
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
    row.appendChild(emojiInput);
    row.appendChild(colorInput);
    row.appendChild(copyBtn);
    row.appendChild(deleteBtn);
    
    return row;
  }
  
  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll(".special-wrapper:not(.dragging), .item-row:not(.dragging)")];
    
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
      wrap.innerHTML = `<div class="empty-state">No items yet. Tap buttons above to add.</div>`;
      $("totalLine").textContent = "";
      return;
    }
    
    wrap.innerHTML = "";

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
      tr.className = "order-table-row";

      const itemTd = document.createElement("td");
      const emojiPrefix = it.emoji ? `${it.emoji} ` : '';
      itemTd.textContent = `${emojiPrefix}${it.name} ($${money(it.price)})`;

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

    wrap.appendChild(table);

    const discPct = Number($("discountPct").value || 0);
    const parts = [`Subtotal $${money(subtotal)}`];
    if (discPct > 0) parts.push(`Discount -$${money(discount)}`);
    parts.push(`Total $${money(total)}`);
    $("totalLine").textContent = parts.join("  |  ");
  }

  function renderReceipt() {
    const isShorthand = $("shorthandReceipt") && $("shorthandReceipt").checked;
    $("receiptOut").value = isShorthand ? shorthandReceiptText() : receiptText();
    renderComponentBreakdown();
  }
  
  function renderComponentBreakdown() {
    const breakdownWrap = $("componentBreakdownWrap");
    if (!breakdownWrap) return;
    
    const components = getComponentBreakdown();
    const hasSpecials = Object.keys(order).some(id => {
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

  // Update JSON textbox with current menu
  function updateJsonTextbox() {
    const menuData = {
      groups: groups,
      specials: specials.map(special => ({
        name: special.name,
        price: special.price,
        color: special.color,
        groupId: special.groupId || null,
        subItems: special.subItems || []
      })),
      items: items.map(item => ({ 
        name: item.name, 
        price: item.price, 
        color: item.color,
        emoji: item.emoji || "",
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
        
        if (menuData.specials && Array.isArray(menuData.specials)) {
          specials = menuData.specials.map((special, idx) => ({
            id: crypto.randomUUID(),
            name: special.name || "Unnamed Special",
            price: Number(special.price) || 0,
            color: special.color || "#dc2626",
            groupId: special.groupId || null,
            order: special.order ?? idx,
            subItems: special.subItems || []
          }));
        } else {
          specials = [];
        }
        
        items = menuData.items.map((item, idx) => ({
          id: crypto.randomUUID(),
          name: item.name || "Unnamed Item",
          price: Number(item.price) || 0,
          color: item.color || "#6b7280",
          emoji: item.emoji || "",
          groupId: item.groupId || null,
          order: item.order ?? idx
        }));
        
        if (menuData.title) {
          $("receiptTitle").value = menuData.title;
        }
        
        order = {};
        persist();
        render();
        setLoadedTemplate("Custom");
        showStatus("Menu loaded from JSON!");
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
      showStatus("JSON copied!", 1000);
    } catch {
      $("menuJsonText").select();
      showStatus("JSON selected - press Ctrl+C to copy", 0);
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
  
  $("addSpecialBtn").onclick = () => {
    const name = ($("newSpecialName").value || "").trim();
    const price = Number($("newSpecialPrice").value || 0);
    const color = $("newSpecialColor").value || "#dc2626";
    const groupId = $("newSpecialGroupSelect").value ? Number($("newSpecialGroupSelect").value) : null;
    if (!name) return;

    const maxOrder = specials.length > 0 ? Math.max(...specials.map(s => s.order || 0)) : -1;
    specials.push({ id: crypto.randomUUID(), name, price, color, groupId, order: maxOrder + 1 });
    $("newSpecialName").value = "";
    $("newSpecialPrice").value = "";
    $("newSpecialColor").value = "#dc2626";
    $("newSpecialGroupSelect").value = "";
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
    items.push({ id: crypto.randomUUID(), name, price, color, emoji: "", groupId, order: maxOrder + 1 });
    $("newName").value = "";
    $("newPrice").value = "";
    $("newColor").value = "#6b7280";
    $("newGroupSelect").value = "";
    persist();
    render();
  };

  $("discountPct").oninput = () => { persist(); render(); };
  $("receiptTitle").oninput = () => { persist(); render(); };
  if ($("showBreakdownInReceipt")) {
    $("showBreakdownInReceipt").onchange = () => { renderReceipt(); };
  }
  if ($("shorthandReceipt")) {
    $("shorthandReceipt").onchange = () => { renderReceipt(); };
  }

  $("clearOrderBtn").onclick = () => {
    saveLastOrder();
    order = {};
    persist();
    render();
    updateLastOrderButton();
  };

  $("resetDefaultBtn").onclick = () => {
    const selectedTemplate = $("templateSelect").value;
    if (confirm(`Reset all items to ${selectedTemplate} template? This will remove custom items.`)) {
      const template = menuTemplates[selectedTemplate];
      groups = template.groups ? [...template.groups] : [];
      specials = template.specials ? template.specials.map((s, idx) => ({
        ...s,
        id: crypto.randomUUID(),
        color: s.color || "#dc2626",
        order: idx,
        subItems: s.subItems || []
      })) : [];
      items = template.items.map((it, idx) => ({ 
        ...it, 
        id: crypto.randomUUID(),
        color: it.color || "#6b7280",
        emoji: it.emoji || "",
        groupId: it.groupId || null,
        order: idx
      }));
      if (template.title) {
        $("receiptTitle").value = template.title;
      }
      order = {};
      persist();
      render();
      setLoadedTemplate(selectedTemplate);
    }
  };

  // Helper: find template by name (case-insensitive)
  function findTemplate(name) {
    const key = Object.keys(menuTemplates).find(k => k.toLowerCase() === name.toLowerCase());
    return key ? { key, template: menuTemplates[key] } : null;
  }

  $("loadTemplateBtn").onclick = () => {
    // Typed name takes priority (allows loading hidden templates)
    const typedName = ($("templateNameInput").value || "").trim();
    const selectedTemplate = typedName || $("templateSelect").value;
    const found = findTemplate(selectedTemplate);
    
    if (!found) {
      alert(`Template "${selectedTemplate}" not found.`);
      return;
    }
    
    const { key: templateName, template } = found;
    
    if (confirm(`Load ${templateName} template? This will replace your current menu items.`)) {
      groups = template.groups ? [...template.groups] : [];
      specials = template.specials ? template.specials.map((s, idx) => ({
        ...s,
        id: crypto.randomUUID(),
        color: s.color || "#dc2626",
        order: idx,
        subItems: s.subItems || []
      })) : [];
      items = template.items.map((it, idx) => ({ 
        ...it, 
        id: crypto.randomUUID(),
        color: it.color || "#6b7280",
        emoji: it.emoji || "",
        groupId: it.groupId || null,
        order: idx
      }));
      if (template.title) {
        $("receiptTitle").value = template.title;
      }
      order = {};
      $("templateNameInput").value = "";
      persist();
      render();
      setLoadedTemplate(templateName);
      showStatus("Template loaded!");
    }
  };

  // Allow Enter key in the text input to trigger load
  $("templateNameInput").onkeypress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      $("loadTemplateBtn").click();
    }
  };

  $("copyBtn").onclick = async () => {
    const text = $("receiptOut").value;
    try {
      await navigator.clipboard.writeText(text);
      showStatus("Copied!", 900);
    } catch {
      showStatus("Copy failed (select + ctrl/cmd+c)", 0);
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
      specials: specials.map(special => ({
        name: special.name,
        price: special.price,
        color: special.color,
        groupId: special.groupId || null,
        subItems: special.subItems || []
      })),
      items: items.map(item => ({ 
        name: item.name, 
        price: item.price, 
        color: item.color,
        emoji: item.emoji || "",
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
    showStatus("Menu saved!");
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
          
          if (menuData.specials && Array.isArray(menuData.specials)) {
            specials = menuData.specials.map((special, idx) => ({
              id: crypto.randomUUID(),
              name: special.name || "Unnamed Special",
              price: Number(special.price) || 0,
              color: special.color || "#dc2626",
              groupId: special.groupId || null,
              order: special.order ?? idx,
              subItems: special.subItems || []
            }));
          } else {
            specials = [];
          }
          
          items = menuData.items.map((item, idx) => ({
            id: crypto.randomUUID(),
            name: item.name || "Unnamed Item",
            price: Number(item.price) || 0,
            color: item.color || "#6b7280",
            emoji: item.emoji || "",
            groupId: item.groupId || null,
            order: item.order ?? idx
          }));
          
          if (menuData.title) {
            $("receiptTitle").value = menuData.title;
          }
          
          order = {};
          persist();
          render();
          setLoadedTemplate("Custom");
          showStatus("Menu loaded!");
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

  // Specials collapse toggle
  $("specialsHeader").onclick = () => {
    const content = $("specialsCollapsible");
    const icon = $("specialsHeader").querySelector(".collapse-icon");
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
  const savedTab = localStorage.getItem('sop_current_tab') || 'ordering';
  switchTab(savedTab);

  // Initial render
  render();
  updateLastOrderButton();

  // === TIPS DRAWER ===
  const tipsToggle = $("tipsToggle");
  const tipsDrawer = $("tipsDrawer");
  if (tipsToggle && tipsDrawer) {
    tipsToggle.onclick = () => {
      tipsDrawer.classList.toggle("open");
      tipsToggle.classList.toggle("open");
    };
  }

  // === TEMPLATE BADGE ===
  function updateTemplateBadge() {
    const badge = $("templateBadge");
    if (!badge) return;
    const name = localStorage.getItem("sop_loaded_template") || "";
    badge.textContent = name;
  }
  function setLoadedTemplate(name) {
    localStorage.setItem("sop_loaded_template", name);
    updateTemplateBadge();
  }
  updateTemplateBadge();

  // === LAST ORDER RECALL ===
  if ($("lastOrderBtn")) {
    $("lastOrderBtn").onclick = () => {
      const lastOrder = getLastOrder();
      if (!lastOrder || Object.keys(lastOrder).length === 0) return;
      
      // Validate that item IDs still exist
      const validOrder = {};
      for (const [id, qty] of Object.entries(lastOrder)) {
        if (getItem(id)) validOrder[id] = qty;
      }
      
      if (Object.keys(validOrder).length === 0) {
        return;
      }
      
      order = { ...validOrder };
      persist();
      render();
    };
  }

  // === KEYBOARD SHORTCUTS ===
  document.addEventListener("keydown", (e) => {
    const activeTag = document.activeElement?.tagName;
    const isTyping = activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT";
    
    // Esc: clear order
    if (e.key === "Escape" && !isTyping && Object.keys(order).length > 0) {
      saveLastOrder();
      order = {};
      persist();
      render();
      updateLastOrderButton();
      return;
    }
    
    // Ctrl+Shift+C: copy receipt
    if (e.ctrlKey && e.shiftKey && e.key === "C") {
      e.preventDefault();
      const text = $("receiptOut").value;
      navigator.clipboard.writeText(text).then(() => {
        showStatus("Copied!", 900);
      }).catch(() => {
        showStatus("Copy failed", 0);
      });
      return;
    }
    
    // Ctrl+Shift+L: repeat last order
    if (e.ctrlKey && e.shiftKey && e.key === "L") {
      e.preventDefault();
      if ($("lastOrderBtn")) $("lastOrderBtn").click();
      return;
    }
  });
})();