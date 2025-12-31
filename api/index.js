const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:8080', 
    'http://localhost:5000', 
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:5000',
    'https://*.github.io', 
    'https://*.vercel.app',
    'null' // Allow file:// protocol for local testing
  ],
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined'));

// Simple file-based storage (for production, consider using a proper database)
const MENUS_DIR = path.join(__dirname, 'data', 'menus');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    await fs.mkdir(MENUS_DIR, { recursive: true });
  } catch (error) {
    console.log('Data directories already exist or error creating:', error.message);
  }
}

// Generate a random 6-character code
function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Check if code already exists
async function codeExists(code) {
  try {
    await fs.access(path.join(MENUS_DIR, `${code}.json`));
    return true;
  } catch {
    return false;
  }
}

// Generate unique code
async function generateUniqueCode() {
  let code;
  let attempts = 0;
  do {
    code = generateCode();
    attempts++;
    if (attempts > 10) {
      throw new Error('Unable to generate unique code');
    }
  } while (await codeExists(code));
  return code;
}

// Validate menu data
function validateMenuData(data) {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  if (!Array.isArray(data.items)) {
    return false;
  }
  
  // Validate each item
  for (const item of data.items) {
    if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
      return false;
    }
    if (typeof item.price !== 'number' || item.price < 0) {
      return false;
    }
    if (item.color && typeof item.color !== 'string') {
      return false;
    }
  }
  
  return true;
}

// Routes

// API Documentation page
app.get('/docs', (req, res) => {
  const baseUrl = req.protocol + '://' + req.get('host');
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Tool API Documentation</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
        .endpoint { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .method { display: inline-block; padding: 4px 8px; border-radius: 4px; color: white; font-size: 12px; font-weight: bold; }
        .get { background: #28a745; }
        .post { background: #ffc107; color: #000; }
        pre { background: #f1f3f4; padding: 15px; border-radius: 4px; overflow-x: auto; }
        code { background: #f1f3f4; padding: 2px 4px; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>🍽️ Order Tool API Documentation</h1>
    <p>API for sharing and retrieving restaurant menu data using 6-character codes.</p>
    
    <h2>Base URL: <code>${baseUrl}</code></h2>
    
    <div class="endpoint">
        <h3><span class="method get">GET</span> /health</h3>
        <p>Health check endpoint</p>
        <pre>Response: {"status": "ok", "timestamp": "2025-12-31T19:00:00.000Z"}</pre>
    </div>

    <div class="endpoint">
        <h3><span class="method post">POST</span> /api/share</h3>
        <p>Share a menu and get a unique code</p>
        <strong>Request Body:</strong>
        <pre>{
  "title": "My Restaurant",
  "items": [
    {"name": "Burger", "price": 12.99, "color": "#ef4444"},
    {"name": "Pizza", "price": 15.50}
  ]
}</pre>
        <strong>Response:</strong>
        <pre>{"success": true, "code": "ABC123", "message": "Menu shared successfully"}</pre>
    </div>

    <div class="endpoint">
        <h3><span class="method get">GET</span> /api/menu/:code</h3>
        <p>Retrieve a shared menu by code</p>
        <strong>Example:</strong> <code>GET /api/menu/ABC123</code>
        <pre>Response: {
  "items": [{"name": "Burger", "price": 12.99, "color": "#ef4444"}],
  "title": "My Restaurant",
  "createdAt": "2025-12-31T19:00:00.000Z"
}</pre>
    </div>

    <div class="endpoint">
        <h3><span class="method get">GET</span> /api/menus</h3>
        <p>List all shared menus (debug endpoint)</p>
        <pre>Response: {"menus": [{"code": "ABC123", "title": "My Restaurant", "itemCount": 2}]}</pre>
    </div>

    <h2>Notes</h2>
    <ul>
        <li>Codes are 6 characters (A-Z, 0-9), case-insensitive</li>
        <li>Maximum 100 items per menu</li>
        <li>Items need: name (string), price (number), optional color</li>
    </ul>
</body>
</html>`;
  res.send(html);
});

// Also serve docs at /api/docs for consistency
app.get('/api/docs', (req, res) => {
  res.redirect('/docs');
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Share a menu
app.post('/api/share', async (req, res) => {
  try {
    const menuData = req.body;
    
    // Validate input
    if (!validateMenuData(menuData)) {
      return res.status(400).json({ 
        error: 'Invalid menu data', 
        details: 'Menu must have items array with valid name and price' 
      });
    }
    
    // Limit menu size
    if (menuData.items.length > 100) {
      return res.status(400).json({ 
        error: 'Menu too large', 
        details: 'Maximum 100 items allowed' 
      });
    }
    
    // Generate unique code
    const code = await generateUniqueCode();
    
    // Prepare menu data for storage
    const storedMenu = {
      ...menuData,
      code,
      createdAt: new Date().toISOString(),
      version: '2.0',
      // Clean up items - only store necessary data
      items: menuData.items.map(item => ({
        name: item.name.trim(),
        price: Number(item.price),
        color: item.color || '#6b7280'
      }))
    };
    
    // Save to file
    const filePath = path.join(MENUS_DIR, `${code}.json`);
    await fs.writeFile(filePath, JSON.stringify(storedMenu, null, 2));
    
    console.log(`Menu shared with code: ${code}`);
    
    res.json({ 
      success: true, 
      code,
      message: 'Menu shared successfully' 
    });
    
  } catch (error) {
    console.error('Error sharing menu:', error);
    res.status(500).json({ 
      error: 'Failed to share menu', 
      details: error.message 
    });
  }
});

// Load a shared menu
app.get('/api/menu/:code', async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    
    // Validate code format
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      return res.status(400).json({ 
        error: 'Invalid code format', 
        details: 'Code must be 6 characters (letters and numbers only)' 
      });
    }
    
    const filePath = path.join(MENUS_DIR, `${code}.json`);
    
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const menuData = JSON.parse(fileContent);
      
      // Return only the necessary data (exclude internal fields)
      const responseData = {
        items: menuData.items,
        title: menuData.title,
        createdAt: menuData.createdAt,
        version: menuData.version
      };
      
      console.log(`Menu loaded with code: ${code}`);
      res.json(responseData);
      
    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        return res.status(404).json({ 
          error: 'Menu not found', 
          details: 'No menu found with this code' 
        });
      }
      throw fileError;
    }
    
  } catch (error) {
    console.error('Error loading menu:', error);
    res.status(500).json({ 
      error: 'Failed to load menu', 
      details: error.message 
    });
  }
});

// List shared menus (for debugging - remove in production)
app.get('/api/menus', async (req, res) => {
  try {
    const files = await fs.readdir(MENUS_DIR);
    const menus = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const code = file.replace('.json', '');
        const filePath = path.join(MENUS_DIR, file);
        const content = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(content);
        menus.push({
          code,
          title: data.title,
          itemCount: data.items.length,
          createdAt: data.createdAt
        });
      }
    }
    
    res.json({ menus });
  } catch (error) {
    console.error('Error listing menus:', error);
    res.status(500).json({ 
      error: 'Failed to list menus', 
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!', 
    details: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found', 
    details: `Route ${req.method} ${req.path} not found` 
  });
});

// Start server
async function startServer() {
  await ensureDataDir();
  
  app.listen(PORT, () => {
    console.log(`Order Tool API server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Data directory: ${MENUS_DIR}`);
  });
}

startServer().catch(console.error);