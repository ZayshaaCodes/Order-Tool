import { uid } from './utils.js';

// === BUILT-IN MENU TEMPLATES ===
// Starter menus. A shop seeds its menu from one of these at creation,
// and owners can re-load one at any time from the header.
export const menuTemplates = {
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
    specials: [],
    items: [
      { name: "Baguette", price: 50, color: "#16a34a", groupId: 1, emoji: "🥖" },
      { name: "French Onion Soup", price: 150, color: "#16a34a", groupId: 1, emoji: "🍲" },
      { name: "Fettuccine Alfredo", price: 120, color: "#16a34a", groupId: 1, emoji: "🍝" },
      { name: "Ratatouille", price: 120, color: "#16a34a", groupId: 1, emoji: "🥘" },
      { name: "Latte", price: 50, color: "#2563eb", groupId: 2, emoji: "☕" },
      { name: "Orangina", price: 40, color: "#2563eb", groupId: 2, emoji: "🍊" },
      { name: "Red Wine", price: 150, color: "#2563eb", groupId: 2, emoji: "🍷" },
      { name: "Bavarois", price: 35, color: "#8825ebff", groupId: 3, emoji: "🍮" },
      { name: "Chocolate Eclair", price: 35, color: "#8825ebff", groupId: 3, emoji: "🍫" }
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
      { name: "Bacon Special", price: 400, color: "#dc2626", groupId: 1, subItems: ["5x Stack of Donuts", "5x Coke"] },
      { name: "Mover Special", price: 380, color: "#dc2626", groupId: 1, subItems: ["10x Latte"] },
      { name: "Weight Watcher Special", price: 400, color: "#dc2626", groupId: 1, subItems: ["10x Orange Smoothie"] }
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
      { name: "Orange Smoothie", price: 50, color: "#2563eb", groupId: 2, emoji: "🍊" }
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
      { name: "Screwdriver", price: 15, color: "#16a34a", groupId: 1, emoji: "🪛" },
      { name: "Drill", price: 350, color: "#16a34a", groupId: 1, emoji: "🔩" },
      { name: "Safe Cracking Kit", price: 1500, color: "#16a34a", groupId: 1, emoji: "🔐" },
      { name: "Electronics Kit", price: 3500, color: "#16a34a", groupId: 1, emoji: "🔌" },
      { name: "Hacking Device", price: 7500, color: "#16a34a", groupId: 1, emoji: "💻" },
      { name: "Advanced Radio", price: 3000, color: "#2563eb", groupId: 2, emoji: "📻" },
      { name: "Basic Radio", price: 1500, color: "#2563eb", groupId: 2, emoji: "📡" },
      { name: "Camera", price: 500, color: "#2563eb", groupId: 2, emoji: "📷" },
      { name: "Phone", price: 750, color: "#2563eb", groupId: 2, emoji: "📱" },
      { name: "Smart Watch", price: 500, color: "#2563eb", groupId: 2, emoji: "⌚" },
      { name: "VPN", price: 4000, color: "#2563eb", groupId: 2, emoji: "🔒" },
      { name: "Green Laptop", price: 8000, color: "#8825ebff", groupId: 3, emoji: "💻" },
      { name: "Red Laptop", price: 15000, color: "#8825ebff", groupId: 3, emoji: "💻" },
      { name: "Gold Laptop", price: 25000, color: "#8825ebff", groupId: 3, emoji: "💻" },
      { name: "Blue Laptop", price: 30000, color: "#8825ebff", groupId: 3, emoji: "💻" },
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
      { name: "Plastic", price: 4, color: "#16a34a", groupId: 1, emoji: "🪣" },
      { name: "Rubber", price: 1, color: "#16a34a", groupId: 1, emoji: "⚫" },
      { name: "Iron Bars", price: 4, color: "#16a34a", groupId: 1, emoji: "🧱" },
      { name: "Copper Wire", price: 2, color: "#16a34a", groupId: 1, emoji: "🪭" },
      { name: "Heavy Duty Glue", price: 1, color: "#16a34a", groupId: 1, emoji: "🪥" },
      { name: "Glue", price: 1, color: "#16a34a", groupId: 1, emoji: "🪥" },
      { name: "Electronic Parts", price: 1, color: "#16a34a", groupId: 1, emoji: "⚡" },
      { name: "Scrap Metal", price: 4, color: "#16a34a", groupId: 1, emoji: "🔩" }
    ]
  },
  "Noodle Exchange": {
    title: "NE Reciept",
    groups: [
      { id: 1, order: 1, name: "Food" },
      { id: 2, order: 2, name: "Drinks" }
    ],
    specials: [
      { name: "California Quintuple", price: 500, color: "#dc2626", groupId: 1, subItems: ["X5 Cali Maki"] },
      { name: "Sashimi Fivefold", price: 500, color: "#dc2626", groupId: 1, subItems: ["X5 Sashimi Roll"] },
      { name: "Gang Of Guksu", price: 450, color: "#dc2626", groupId: 1, subItems: ["X5 Guksu"] },
      { name: "Battle Bod", price: 450, color: "#dc2626", groupId: 1, subItems: ["X2 Cali Maki", "X2 Sashimi Roll"] }
    ],
    items: [
      { name: "Guksu", price: 125, color: "#16a34a", groupId: 1, emoji: "🍛" },
      { name: "Pad Thai", price: 100, color: "#16a34a", groupId: 1, emoji: "🍜" },
      { name: "Cali Maki", price: 150, color: "#16a34a", groupId: 1, emoji: "🍣" },
      { name: "Salad", price: 50, color: "#16a34a", groupId: 1, emoji: "🥗" },
      { name: "Sashimi Roll", price: 150, color: "#16a34a", groupId: 1, emoji: "🍣" },
      { name: "Tuna Roll", price: 100, color: "#16a34a", groupId: 1, emoji: "🌣" },
      { name: "Chips", price: 50, color: "#16a34a", groupId: 1, emoji: "🍟" },
      { name: "Japanese Pan Noodles", price: 75, color: "#16a34a", groupId: 1, emoji: "🍜" }
    ]
  },
  "Bobs Balls": {
    title: "Bobs Balls Receipt",
    groups: [
      { id: 1, order: 1, name: "Food" },
      { id: 2, order: 2, name: "Drinks" }
    ],
    specials: [],
    items: [
      { name: "Fries", price: 50, color: "#16a34a", groupId: 1, emoji: "🍟" },
      { name: "Hot Dog", price: 50, color: "#16a34a", groupId: 1, emoji: "🌭" },
      { name: "Salad", price: 40, color: "#16a34a", groupId: 1, emoji: "🥗" },
      { name: "Coke", price: 50, color: "#2563eb", groupId: 2, emoji: "🥤" },
      { name: "Root Beer Float", price: 80, color: "#2563eb", groupId: 2, emoji: "🍺" },
      { name: "Beer", price: 60, color: "#2563eb", groupId: 2, emoji: "🍻" },
      { name: "Chocolate Shake", price: 80, color: "#2563eb", groupId: 2, emoji: "🥛" },
      { name: "Explosive Shake", price: 100, color: "#2563eb", groupId: 2, emoji: "💥" },
      { name: "Lemonade", price: 40, color: "#2563eb", groupId: 2, emoji: "🍋" }
    ]
  },
  "Burger Shot": {
    title: "Burger Shot Receipt",
    // stylePreset: "burger-shot",
    groups: [
      { id: 1, order: 1, name: "Burgers" },
      { id: 2, order: 2, name: "Wraps & Sides" },
      { id: 3, order: 3, name: "Drinks & Desserts" }
    ],
    specials: [
      { name: "Classic Combo", price: 130, color: "#dc2626", groupId: 1, subItems: ["1x Simple Burger", "1x Fries", "1x Burger Shot Drink"] },
      { name: "Heart Stopper Combo", price: 160, color: "#dc2626", groupId: 1, subItems: ["1x Heart Stopper", "1x Fries", "1x Burger Shot Drink"] },
      { name: "Double Shot Combo", price: 170, color: "#dc2626", groupId: 1, subItems: ["1x Double Shot", "1x Fries", "1x Burger Shot Drink"] },
      { name: "Chicken Combo", price: 150, color: "#dc2626", groupId: 1, subItems: ["1x The Prickly", "1x Fries", "1x Burger Shot Drink"] },
      { name: "Wrap Combo", price: 140, color: "#dc2626", groupId: 2, subItems: ["1x Any Wrap", "1x Fries", "1x Burger Shot Drink"] }
    ],
    items: [
      { name: "Simple Burger", price: 80, color: "#16a34a", groupId: 1, emoji: "🍔" },
      { name: "Heart Stopper", price: 110, color: "#16a34a", groupId: 1, emoji: "🍔" },
      { name: "Double Shot", price: 120, color: "#16a34a", groupId: 1, emoji: "🍔" },
      { name: "The Bleeder", price: 130, color: "#16a34a", groupId: 1, emoji: "🍔" },
      { name: "The Prickly", price: 110, color: "#16a34a", groupId: 1, emoji: "🍔" },
      { name: "Chicken Wrap", price: 90, color: "#f59e0b", groupId: 2, emoji: "🌯" },
      { name: "Goat Cheese Wrap", price: 95, color: "#f59e0b", groupId: 2, emoji: "🌯" },
      { name: "Taco", price: 70, color: "#f59e0b", groupId: 2, emoji: "🌮" },
      { name: "Fries", price: 50, color: "#f59e0b", groupId: 2, emoji: "🍟" },
      { name: "Burger Shot Drink", price: 25, color: "#2563eb", groupId: 3, emoji: "🥤" },
      { name: "Mocha Shake", price: 30, color: "#2563eb", groupId: 3, emoji: "🥤" },
      { name: "Orangotang Ice Cream", price: 30, color: "#8825ebff", groupId: 3, emoji: "🍦" },
      { name: "Meteorite Ice Cream", price: 35, color: "#8825ebff", groupId: 3, emoji: "🍦" }
    ]
  },
  "Cluckin Bell": {
    title: "Cluckin' Bell Receipt",
    // stylePreset: "cluckin-bell",
    groups: [
      { id: 1, order: 1, name: "Chicken" },
      { id: 2, order: 2, name: "Sides" },
      { id: 3, order: 3, name: "Smoothies" }
    ],
    specials: [
      { name: "Family Meal", price: 300, color: "#c50814", groupId: 1, subItems: ["1x Bucket", "1x Buffalo Wings", "1x Wing Dings", "1x Wedges", "4x Drink"] },
      { name: "Fillet Combo", price: 170, color: "#c50814", groupId: 1, subItems: ["1x Fillet", "1x Wedges", "1x Drink"] },
      { name: "Double Fillet Combo", price: 180, color: "#c50814", groupId: 1, subItems: ["1x Double Fillet", "1x Wedges", "1x Drink"] },
      { name: "Wrap Combo", price: 100, color: "#c50814", groupId: 1, subItems: ["1x Wrap", "1x Drink"] },
      { name: "Wings Combo", price: 110, color: "#c50814", groupId: 1, subItems: ["1x Buffalo Wings", "1x Wing Dings"] }
    ],
    items: [
      { name: "Bucket", price: 125, color: "#c50814", groupId: 1, emoji: "🍗" },
      { name: "Buffalo Wings", price: 80, color: "#c50814", groupId: 1, emoji: "🍗" },
      { name: "Fillet", price: 100, color: "#c50814", groupId: 1, emoji: "🥪" },
      { name: "Double Fillet", price: 110, color: "#c50814", groupId: 1, emoji: "🍔" },
      { name: "Pie", price: 25, color: "#c50814", groupId: 1, emoji: "🥧" },
      { name: "Wedges", price: 50, color: "#f0a800", groupId: 2, emoji: "🥔" },
      { name: "Wing Dings", price: 80, color: "#f0a800", groupId: 2, emoji: "🍗" },
      { name: "Wrap", price: 80, color: "#f0a800", groupId: 2, emoji: "🌯" },
      { name: "Banana Smoothie", price: 25, color: "#1752b5", groupId: 3, emoji: "🍌" },
      { name: "Raspberry Smoothie", price: 25, color: "#1752b5", groupId: 3, emoji: "🥤" }
    ]
  },
  "BeanMachine": {
    title: "BeanMachine Receipt",
    groups: [
      { id: 1, order: 1, name: "Classic Coffee" },
      { id: 2, order: 2, name: "Snacks" },
      { id: 3, order: 3, name: "Non Coffee" }
    ],
    specials: [],
    items: [
      { name: "Coffee", price: 40, color: "#16a34a", groupId: 1, emoji: "☕" },
      { name: "Espresso", price: 45, color: "#16a34a", groupId: 1, emoji: "☕" },
      { name: "Pumpkin Spice Latte", price: 55, color: "#16a34a", groupId: 1, emoji: "☕" },
      { name: "White Chocolate Mocha", price: 55, color: "#16a34a", groupId: 1, emoji: "☕" },
      { name: "Blueberry Muffin", price: 40, color: "#2563eb", groupId: 2, emoji: "🧁" },
      { name: "Chocolate Muffin", price: 40, color: "#2563eb", groupId: 2, emoji: "🧁" },
      { name: "Carrot Cake", price: 55, color: "#2563eb", groupId: 2, emoji: "🍰" },
      { name: "Millionaire Shortbread", price: 60, color: "#2563eb", groupId: 2, emoji: "🍫" },
      { name: "Coke", price: 25, color: "#8825ebff", groupId: 3, emoji: "🥤" },
      { name: "Lemonade", price: 35, color: "#8825ebff", groupId: 3, emoji: "🍋" },
      { name: "Orange Smoothie", price: 45, color: "#8825ebff", groupId: 3, emoji: "🍊" },
      { name: "Veg Smoothie", price: 45, color: "#8825ebff", groupId: 3, emoji: "🥬" }
    ]
  },
  "Caseys": {
    title: "Casey's Diner Receipt",
    groups: [
      { id: 1, order: 1, name: "Food" },
      { id: 3, order: 2, name: "Drinks" }
    ],
    specials: [
      { name: "Cop Special", price: 150, color: "#dc2626", groupId: null, subItems: ["1x Donut", "1x Espresso"] },
      { name: "Breakfast Special", price: 350, color: "#dc2626", groupId: null, subItems: ["1x Hash Brown", "1x Plate of Bacon", "1x Espresso"] },
      { name: "Wake Up Special", price: 375, color: "#dc2626", groupId: null, subItems: ["5x Espresso"] },
      { name: "Adrenaline Junkie", price: 280, color: "#dc2626", groupId: null, subItems: ["5x BedBull Energys"] }
    ],
    items: [
      { name: "Pancakes", price: 300, color: "#6b7280", groupId: 1, emoji: "" },
      { name: "Hash Browns", price: 200, color: "#6b7280", groupId: 1, emoji: "" },
      { name: "Omelette", price: 200, color: "#6b7280", groupId: 1, emoji: "" },
      { name: "Plate of Bacon", price: 200, color: "#6b7280", groupId: 1, emoji: "" },
      { name: "French Toast", price: 150, color: "#6b7280", groupId: 1, emoji: "" },
      { name: "Lasagna", price: 200, color: "#6b7280", groupId: 1, emoji: "" },
      { name: "Espresso", price: 100, color: "#6b7280", groupId: 3, emoji: "" },
      { name: "BedBull Energy", price: 75, color: "#6b7280", groupId: 3, emoji: "" },
      { name: "Cranberry Juice", price: 50, color: "#6b7280", groupId: 3, emoji: "" },
      { name: "Strawberry Milkshake", price: 100, color: "#6b7280", groupId: 3, emoji: "" }
    ]
  }
};

export const stylePresets = {
  default: { label: "Default" },
  "burger-shot": { label: "Burger Shot" },
  "cluckin-bell": { label: "Cluckin' Bell" }
};

export function normalizeStylePreset(preset) {
  return stylePresets[preset] ? preset : "default";
}

// Find a template by name (case/apostrophe/whitespace-insensitive)
export function findTemplate(name) {
  const normalize = (value) => value.toLowerCase().replace(/[']/g, "").replace(/\s+/g, " ").trim();
  const normalized = normalize(name);
  const key = Object.keys(menuTemplates).find(k => normalize(k) === normalized);
  return key ? { key, template: menuTemplates[key] } : null;
}

// === HYDRATION ===
// Template/import data carries no ids or order; assign them once here.
// After hydration the ids are stable — they live in the DB for shop menus.

export function hydrateItems(rawItems) {
  return (rawItems || []).map((item, idx) => ({
    id: uid(),
    name: item.name || "Unnamed Item",
    price: Number(item.price) || 0,
    color: item.color || "#6b7280",
    emoji: item.emoji || "",
    groupId: item.groupId ?? null,
    order: item.order ?? idx
  }));
}

export function hydrateSpecials(rawSpecials) {
  return (rawSpecials || []).map((special, idx) => ({
    id: uid(),
    name: special.name || "Unnamed Special",
    price: Number(special.price) || 0,
    color: special.color || "#dc2626",
    groupId: special.groupId ?? null,
    order: special.order ?? idx,
    subItems: special.subItems || []
  }));
}

/** Turn a template or imported menu JSON into a full menu object with stable ids. */
export function hydrateMenu(raw) {
  return {
    title: raw.title || "Receipt",
    stylePreset: normalizeStylePreset(raw.stylePreset),
    groups: Array.isArray(raw.groups) ? raw.groups.map(g => ({ ...g })) : [],
    items: hydrateItems(raw.items),
    specials: hydrateSpecials(raw.specials)
  };
}

export function blankMenu() {
  return { title: "Receipt", stylePreset: "default", groups: [], items: [], specials: [] };
}
