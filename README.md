# Order Tool

A modern, responsive order management tool with menu sharing capabilities. Perfect for restaurants, food trucks, or any business that needs to manage orders and share menus with customers.

## Features

### Core Functionality
- **Interactive Order Management**: Add items, adjust quantities, calculate totals
- **Dynamic Menu Creation**: Create custom menus with colored item categories
- **Receipt Generation**: Generate formatted receipts with timestamps
- **Local Storage**: Automatic saving to browser storage
- **Responsive Design**: Works on desktop and mobile devices

### Menu Management
- **Template System**: Pre-built menu templates (KOI restaurant example included)
- **Custom Items**: Add items with prices and custom colors
- **Import/Export**: Save and load menus as JSON files
- **Color Coding**: Organize items by category with custom colors

### Sharing (New!)
- **Share with Codes**: Generate 6-character codes to share menus online
- **Easy Loading**: Load shared menus by entering a code
- **Cross-Device**: Access shared menus from any device
- **Persistent Storage**: Shared menus stored on backend server

## Quick Start

### Frontend (GitHub Pages)

1. **Direct Use**: Open [index.html](index.html) in your browser
2. **GitHub Pages**: Push to GitHub and enable Pages for automatic hosting
3. **Local Development**: Serve files with any web server

### Backend (Menu Sharing)

1. **Install dependencies**:
   ```bash
   cd api
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Deploy to Vercel**:
   ```bash
   npm install -g vercel
   cd api
   vercel
   ```

4. **Update API URL**: Edit `app.js` and change `API_BASE` to your deployed API URL

## Project Structure

```
Order Tool/
├── index.html          # Main application page
├── styles.css          # All styling and themes
├── app.js             # Application logic and API calls
├── README.md          # This file
├── api/               # Backend API
│   ├── index.js       # Express server
│   ├── package.json   # Node.js dependencies
│   ├── vercel.json    # Vercel deployment config
│   └── README.md      # API documentation
└── docs/              # Additional documentation
```

## Menu Sharing Workflow

### Sharing a Menu

1. Create or customize your menu items
2. Click "Share menu" button
3. Get a 6-character code (e.g., "ABC123")
4. Share this code with others

### Loading a Shared Menu

1. Get a share code from someone
2. Enter it in the "Load shared menu" field
3. Click "Load" to import their menu
4. Confirm to replace your current menu

## Customization

### Adding Menu Templates

Edit the `menuTemplates` object in `app.js`:

```javascript
const menuTemplates = {
  "Your Restaurant": [
    { name: "Item Name", price: 10.50, color: "#16a34a" },
    // Add more items...
  ]
};
```

### Styling

Modify `styles.css` to change:
- Color scheme (dark theme by default)
- Layout and spacing
- Button styles and animations
- Responsive breakpoints

### API Configuration

Change the backend URL in `app.js`:

```javascript
const API_BASE = 'https://your-api-domain.com';
```

## Development

### Frontend

No build process required! Files can be edited directly:
- `index.html`: Structure and layout
- `styles.css`: Appearance and responsive design  
- `app.js`: Functionality and API integration

### Backend

Built with Node.js and Express:
- File-based storage (easily replaceable)
- RESTful API design
- CORS enabled for cross-origin requests
- Input validation and error handling

## Deployment Options

### Frontend
- **GitHub Pages**: Free hosting for static sites
- **Vercel**: Automatic deployments from Git
- **Netlify**: Free static site hosting
- **Any web server**: Upload files to any hosting provider

### Backend
- **Vercel**: Serverless deployment (recommended)
- **Railway**: Simple app deployment
- **Render**: Free tier available
- **Heroku**: Classic PaaS option

## Browser Support

- **Modern browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile**: iOS Safari, Chrome Mobile, Samsung Browser
- **Features used**: ES6+, CSS Grid, Flexbox, Clipboard API, File API

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

MIT License - feel free to use for personal or commercial projects.

## Troubleshooting

### Menu Sharing Not Working
- Check that the backend API is deployed and running
- Verify the `API_BASE` URL in `app.js` is correct
- Check browser console for error messages

### Local Storage Issues
- Clear browser data if menus aren't saving
- Check that localStorage is enabled
- Try in an incognito/private window

### Mobile Display Issues
- Ensure viewport meta tag is present
- Check responsive CSS breakpoints
- Test on actual devices, not just browser dev tools

## Support

For issues or questions:
1. Check the browser console for errors
2. Review the API logs if menu sharing isn't working
3. Create an issue with reproduction steps