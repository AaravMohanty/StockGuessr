# StockGuessr Deployment Guide

## Backend Deployment on Railway

### Step 1: Create Railway Account & Project
1. Go to [railway.app](https://railway.app) and sign up/login
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Connect your GitHub account if needed
5. Select the **StockGuessr** repository

### Step 2: Configure the Backend Service
1. Railway will auto-detect the monorepo. Click on the service that was created
2. Go to **Settings** → **Root Directory**
3. Set Root Directory to: `server`
4. Railway will auto-detect Node.js and use the `railway.json` config

### Step 3: Add Environment Variables
Go to **Variables** tab and add:

```
PORT=5001
MONGODB_URI=<your-mongodb-atlas-connection-string>
JWT_SECRET=<your-secret-key>
OPENAI_API_KEY=<your-openai-key>
NODE_ENV=production
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

> **Important**: After deploying frontend to Vercel, update `CORS_ORIGIN` with the actual Vercel URL!

### Step 4: Deploy
**Backend URL:** `https://stockguessr-production.up.railway.app`
**Frontend URL:** `https://stock-guessr-ni6v.vercel.app`

1. Railway has automatically deployed your app
2. Use these URLs for your configuration

---

## Frontend Deployment on Vercel

### Step 1: Create Vercel Account & Project
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **"Add New Project"**
3. Import your **StockGuessr** repository from GitHub

### Step 2: Configure the Frontend Build
1. Set **Framework Preset**: Next.js
2. Set **Root Directory**: `client`
3. Build Command: `npm run build` (default)
4. Output Directory: `.next` (default for Next.js)

### Step 3: Add Environment Variables
Add this environment variable in Vercel:

```
NEXT_PUBLIC_API_URL=https://stockguessr-production.up.railway.app/api
```

### Step 4: Deploy
1. Click **Deploy**
2. Wait for the build to complete
3. Your app will be live at `https://your-project.vercel.app`

---

## Post-Deployment Steps

### 1. Update Railway CORS
Go back to Railway and update the `CORS_ORIGIN` variable:
```
CORS_ORIGIN=https://your-stockguessr.vercel.app
```

### 2. Verify the Deployment
1. Visit your Vercel frontend URL
2. Try registering/logging in
3. Test the game functionality
4. Check that Socket.io connects properly

---

## Environment Variables Reference

### Backend (Railway)
| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port (Railway provides this automatically) | `5001` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret for JWT tokens | `your-super-secret-key` |
| `OPENAI_API_KEY` | OpenAI API key for analysis | `sk-...` |
| `NODE_ENV` | Environment mode | `production` |
| `CORS_ORIGIN` | Frontend URL for CORS | `https://app.vercel.app` |

### Frontend (Vercel)
| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://app.railway.app/api` |

---

## Troubleshooting

### Socket.io Connection Issues
- Ensure `CORS_ORIGIN` on Railway includes your Vercel URL
- The socket URL is derived from `NEXT_PUBLIC_API_URL` (stripping `/api`)

### MongoDB Connection Fails
- Whitelist `0.0.0.0/0` in MongoDB Atlas Network Access (for Railway's dynamic IPs)

### Build Fails on Vercel
- Ensure `client/` directory has all dependencies in `package.json`
- Check that TypeScript types are correct

### API Calls Return 404
- Verify `NEXT_PUBLIC_API_URL` environment variable is set correctly
- Ensure the backend is running (check Railway logs)
