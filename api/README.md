# Order Tool API

Simple backend API for sharing menus in the Order Tool application.

## Features

- Share menus with 6-character codes
- Load shared menus by code
- File-based storage (easily replaceable with database)
- CORS enabled for GitHub Pages deployment
- Input validation and error handling

## Local Development

1. Install dependencies:
```bash
cd api
npm install
```

2. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## API Endpoints

### POST /api/share
Share a menu and get a unique code.

**Request body:**
```json
{
  "items": [
    {
      "name": "Item Name",
      "price": 10.50,
      "color": "#16a34a"
    }
  ],
  "title": "My Menu",
  "version": "2.0"
}
```

**Response:**
```json
{
  "success": true,
  "code": "ABC123",
  "message": "Menu shared successfully"
}
```

### GET /api/menu/:code
Load a shared menu by code.

**Response:**
```json
{
  "items": [
    {
      "name": "Item Name", 
      "price": 10.50,
      "color": "#16a34a"
    }
  ],
  "title": "My Menu",
  "createdAt": "2023-12-31T12:00:00.000Z",
  "version": "2.0"
}
```

### GET /health
Health check endpoint.

## Deployment

### Vercel Deployment

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
cd api
vercel
```

3. Update the `API_BASE` URL in `../app.js` to point to your deployed API.

### Other Platforms

This API can be deployed to any Node.js hosting platform:
- Railway
- Render
- Heroku
- DigitalOcean App Platform

## Data Storage

Currently uses file-based storage in the `data/menus/` directory. Each shared menu is stored as a JSON file named with its share code.

For production use, consider migrating to:
- PostgreSQL
- MongoDB 
- SQLite
- Cloud storage (AWS S3, Google Cloud Storage)

## Environment Variables

- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)

## Security Considerations

- Menu data is validated before storage
- Maximum 100 items per menu
- 6-character alphanumeric codes provide good collision resistance
- CORS is configured for known domains
- Input size limits prevent abuse