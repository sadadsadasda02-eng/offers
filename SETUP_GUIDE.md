# 🚀 Complete Setup Guide - Fragment Offers Site

Complete step-by-step guide to deploy your Fragment offers site with backend on Render.

## 📋 Prerequisites

- GitHub account
- Render account (free tier works)
- Netlify/Vercel account (for frontend)

## 🎯 Part 1: Deploy Backend to Render

### Step 1: Prepare GitHub Repository

```bash
cd /Users/francesco/Desktop/fragment/publish-offers-site/render-deploy

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Fragment Offers Backend"

# Create GitHub repo and push
# (Replace with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/fragment-offers-backend.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Render

1. Go to [https://render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Click **"Connect GitHub"** and authorize Render
4. Select your `fragment-offers-backend` repository
5. Configure the service:
   - **Name**: `fragment-offers-backend` (or your choice)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
6. Click **"Create Web Service"**
7. Wait 2-3 minutes for deployment
8. **Copy your backend URL**: `https://fragment-offers-backend.onrender.com`

### Step 3: Update Frontend API URL

Edit `/render-deploy/public/js/offers-manager.js`:

```javascript
// Line 10: Update with your Render URL
const API_URL = 'https://YOUR-SERVICE-NAME.onrender.com/api/offers';
```

Replace `YOUR-SERVICE-NAME` with your actual Render service name.

## 🌐 Part 2: Deploy Frontend

### Option A: Netlify (Recommended)

1. Go to [https://netlify.com](https://netlify.com)
2. Drag & drop the `/render-deploy/public` folder
3. Site deploys instantly
4. Copy your site URL: `https://your-site-name.netlify.app`

### Option B: Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Import the `public` folder
3. Deploy
4. Copy your site URL

### Option C: GitHub Pages

```bash
cd public
git init
git add .
git commit -m "Fragment offers site"
git remote add origin https://github.com/YOUR-USERNAME/fragment-offers-site.git
git push -u origin main

# Enable GitHub Pages in repository settings
```

## ⚙️ Part 3: Configure Admin Panel

1. Open `/admin-panel-deploy/index.html` in your browser
2. Navigate to **"💎 Offers Site Manager"** tab
3. Update **"Render Backend URL"** with your Render URL:
   ```
   https://fragment-offers-backend.onrender.com
   ```
4. Update **"Offers Site URL"** with your frontend URL:
   ```
   https://your-offers-site.netlify.app
   ```
5. Click **"💾 Save Configuration"**
6. Click **"🔄 Refresh Data"** to test connection

## 🎨 Part 4: Customize Your Offers

In the admin panel **"Offers Site Manager"** tab:

1. **Main Username**: The username shown as the domain (e.g., `danbao`)
2. **Owner Username**: Owner display name (e.g., `danbao-t-me.ton`)
3. **Sale Price**: Price in TON (syncs with offer)
4. **Offer Amount**: Latest offer amount in TON
5. **Offer From**: Buyer's username (appears as `t.me/buyer`)

Click **"💾 Update Offers Site"** to apply changes.

## 🎯 Part 5: Generate New Offers

To create a new offer with the current timestamp frozen:

1. Update the offer fields (buyer, amount, etc.)
2. Click **"🎯 Generate New Offer (Current Time)"**
3. The timestamp freezes at the moment of generation
4. Frontend updates automatically

## ✅ Testing Checklist

- [ ] Backend URL returns JSON at `/api/offers`
- [ ] Frontend loads without errors
- [ ] Admin panel connects to backend
- [ ] Update offer amount → changes reflect on frontend
- [ ] Generate new offer → timestamp updates
- [ ] Main username updates → domain name changes
- [ ] Buyer username updates → t.me link changes
- [ ] "Accept the Offer" button shows correctly

## 🔧 Troubleshooting

### Backend not responding

**Check:**
- Render service is running (green status)
- URL is correct (no trailing slash)
- CORS is enabled (already configured)

**Test in browser:**
```
https://YOUR-BACKEND-URL.onrender.com/health
```

Should return: `{"status":"ok","timestamp":"..."}`

### Frontend not updating

**Check:**
- Browser console for errors (F12)
- API_URL in `offers-manager.js` is correct
- Backend is returning data at `/api/offers`

**Test API:**
```
https://YOUR-BACKEND-URL.onrender.com/api/offers
```

Should return offer data JSON.

### Admin panel not connecting

**Check:**
- Backend URL saved in admin panel
- URL format: `https://name.onrender.com` (no `/api/offers`)
- Browser console for CORS errors

### Data not persisting

**Render free tier:**
- Server sleeps after 15 min inactivity
- Data in `offers-data.json` persists during active period
- For permanent storage, upgrade to paid plan

## 📁 File Structure

```
render-deploy/
├── server.js              # Express backend
├── package.json           # Dependencies
├── render.yaml            # Render config
├── offers-data.json       # Data storage (auto-created)
├── public/                # Frontend files
│   ├── index.html        # Main offers page
│   ├── js/
│   │   ├── offers-manager.js  # ⚠️ UPDATE API_URL HERE
│   │   ├── auction.js
│   │   └── ...
│   ├── css/
│   └── fonts/
└── README.md

admin-panel-deploy/
└── index.html            # Admin panel (open locally)
```

## 🎯 Quick Reference

### Backend API Endpoints

```
GET  /api/offers           # Get current offer data
POST /api/offers/update    # Update offer data
POST /api/offers/generate  # Generate new offer with timestamp
GET  /health              # Health check
```

### Admin Panel URLs

- **Local**: `file:///Users/francesco/Desktop/fragment/admin-panel-deploy/index.html`
- **Backend**: Your Render URL
- **Frontend**: Your Netlify/Vercel URL

## 🔄 Updating Your Site

### Update Offer Data

1. Open admin panel
2. Go to "Offers Site Manager"
3. Change fields
4. Click "Update Offers Site"
5. Check frontend (auto-refreshes every 30 seconds)

### Update Code

```bash
cd render-deploy

# Make changes to files

# Commit and push
git add .
git commit -m "Update offers site"
git push

# Render auto-deploys (if connected to GitHub)
```

## 🎉 You're Done!

Your Fragment offers site is now live with:
- ✅ Dynamic backend on Render
- ✅ Static frontend on Netlify
- ✅ Admin panel for easy management
- ✅ Real-time updates
- ✅ Timestamp freezing
- ✅ All fields editable

**Share your offers site**: `https://your-offers-site.netlify.app`

---

Need help? Check:
- Render logs: Dashboard → Your Service → Logs
- Browser console: F12 → Console tab
- Backend health: `https://YOUR-URL.onrender.com/health`
