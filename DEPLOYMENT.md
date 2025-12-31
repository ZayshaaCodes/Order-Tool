# Deployment Guide

This guide walks you through deploying both the frontend and backend of the Order Tool.

## Overview

- **Frontend**: Static files that can be deployed to GitHub Pages, Vercel, Netlify, etc.
- **Backend**: Node.js API that needs to be deployed to a serverless platform or VPS

## Frontend Deployment

### Option 1: GitHub Pages (Recommended for beginners)

1. **Create a GitHub repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/order-tool.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Click Settings → Pages
   - Source: Deploy from a branch
   - Branch: main / (root)
   - Click Save

3. **Your site will be available at**:
   `https://yourusername.github.io/order-tool`

### Option 2: Vercel

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Follow the prompts** to link to your GitHub repository

### Option 3: Netlify

1. **Drag and drop** your folder to [netlify.com/drop](https://netlify.com/drop)
2. **Or connect your Git repository** for automatic deployments

## Backend Deployment

### Option 1: Vercel (Recommended)

1. **Navigate to API directory**:
   ```bash
   cd api
   ```

2. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Note your API URL** (e.g., `https://order-tool-api.vercel.app`)

5. **Update frontend configuration**:
   Edit `app.js` and change:
   ```javascript
   const API_BASE = 'https://your-actual-api-url.vercel.app';
   ```

### Option 2: Railway

1. **Create account** at [railway.app](https://railway.app)

2. **Connect GitHub repository** with the API folder

3. **Set start command**:
   ```
   npm start
   ```

4. **Set port variable**:
   - Variable: `PORT`
   - Value: `3001` (or leave default)

### Option 3: Render

1. **Create account** at [render.com](https://render.com)

2. **Create new Web Service**:
   - Connect your repository
   - Root Directory: `api`
   - Build Command: `npm install`
   - Start Command: `npm start`

## Complete Deployment Workflow

### 1. Deploy Backend First

```bash
# Navigate to API directory
cd api

# Install dependencies
npm install

# Test locally
npm run dev

# Deploy to Vercel
vercel

# Note the deployment URL
```

### 2. Update Frontend Configuration

```javascript
// In app.js, update this line:
const API_BASE = 'https://your-deployed-api-url.com';
```

### 3. Deploy Frontend

```bash
# From project root
git add .
git commit -m "Update API URL"
git push

# If using GitHub Pages, it will auto-deploy
# If using Vercel/Netlify, redeploy or it will auto-deploy
```

## Custom Domain (Optional)

### Frontend Custom Domain

**GitHub Pages**:
1. Add a `CNAME` file with your domain
2. Configure DNS to point to `yourusername.github.io`

**Vercel/Netlify**:
1. Add domain in dashboard
2. Configure DNS as instructed

### Backend Custom Domain

**Vercel**:
1. Add domain in project settings
2. Configure DNS as instructed

## Environment Variables

### Backend

Create `.env` file in `api/` directory (for local development):
```
PORT=3001
NODE_ENV=development
```

For production, set environment variables in your hosting platform.

## Testing Deployment

### Frontend Test
1. Open your deployed frontend URL
2. Create a test menu
3. Try basic functionality

### Backend Test
1. Visit `https://your-api-url.com/health`
2. Should return: `{"status":"ok","timestamp":"..."}`

### Full Integration Test
1. Create a menu in the frontend
2. Click "Share menu"
3. Copy the generated code
4. Enter the code in "Load shared menu"
5. Verify the menu loads correctly

## Troubleshooting

### Common Issues

**CORS Errors**:
- Ensure your frontend domain is allowed in the backend CORS configuration
- Check that API_BASE URL is correct (no trailing slash)

**API Not Found**:
- Verify the backend is deployed and running
- Check the health endpoint: `/health`
- Ensure the URL in `app.js` is correct

**Menu Sharing Not Working**:
- Check browser console for errors
- Verify API endpoints are responding
- Test with a simple curl command:
  ```bash
  curl https://your-api-url.com/health
  ```

### Debugging

**Frontend Issues**:
- Open browser developer tools
- Check Console tab for JavaScript errors
- Check Network tab for failed requests

**Backend Issues**:
- Check hosting platform logs
- Verify environment variables
- Test API endpoints directly

## Security Considerations

### Frontend
- HTTPS only (enforced by most modern hosting)
- Content Security Policy (optional)

### Backend
- Input validation (already implemented)
- Rate limiting (consider adding for production)
- CORS properly configured
- Environment variables for sensitive data

## Scaling Considerations

### High Traffic
- Consider using a proper database (PostgreSQL, MongoDB)
- Add Redis for caching
- Implement rate limiting
- Use CDN for frontend assets

### Multiple Regions
- Deploy API to multiple regions
- Use database replication
- Consider edge functions

## Cost Estimation

### Free Tier Limits
- **GitHub Pages**: Unlimited for public repos
- **Vercel**: 100GB bandwidth, 1000 serverless function invocations/month
- **Netlify**: 100GB bandwidth, 125k function invocations/month
- **Railway**: $5/month after free tier

### Paid Options
- **Vercel Pro**: $20/month per user
- **Netlify Pro**: $19/month per user
- **Railway**: Usage-based pricing
- **Render**: $7/month for web services