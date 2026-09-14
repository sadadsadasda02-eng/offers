# Fragment Offers Site - Render Backend

Complete backend server for the Fragment Offers site, deployable to Render.com

## 📦 What's Included

- **Node.js Express Server** - Handles all API requests
- **Data Persistence** - Stores offer data in `offers-data.json`
- **CORS Enabled** - Works with any frontend domain
- **RESTful API** - Clean endpoints for managing offers
- **Health Check** - Monitor server status

## 🚀 Quick Deploy to Render

### 1. Push to GitHub

```bash
cd render-deploy
git init
git add .
git commit -m "Initial offers backend"
git remote add origin https://github.com/YOUR-USERNAME/fragment-offers-backend.git
git push -u origin main
```

### 2. Deploy on Render

1. Go to [Render.com](https://render.com) and sign in
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `fragment-offers-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Click **Create Web Service**
6. Wait for deployment (2-3 minutes)
7. Copy your backend URL (e.g., `https://fragment-offers-backend.onrender.com`)

### 3. Connect to Admin Panel

1. Open `/admin-panel-deploy/index.html`
2. Navigate to **Offers Site Manager** tab
3. Update **Render Backend URL** with your deployment URL
4. Click **Save Configuration**
5. Click **Refresh Data** to test connection

### 4. Deploy Frontend

Copy the `public` folder contents to:
- Netlify
- Vercel
- GitHub Pages
- Or any static host

## 🔌 API Endpoints

### Get Offers Data
```
GET /api/offers
```
Returns current offer configuration.

### Update Offers Data
```
POST /api/offers/update
Content-Type: application/json

{
  "mainUsername": "danbao",
  "ownerUsername": "danbao-t-me.ton",
  "salePrice": 500,
  "offerAmount": 500,
  "offerBuyer": "ethlick"
}
```

### Generate New Offer (with current timestamp)
```
POST /api/offers/generate
```
Creates new offer with current date/time frozen.

### Health Check
```
GET /health
```
Returns server status.

## 📁 File Structure

```
render-deploy/
├── server.js           # Express server
├── package.json        # Dependencies
├── render.yaml         # Render configuration
├── offers-data.json    # Data storage (auto-created)
├── public/             # Frontend files
│   ├── index.html     # Offers site page
│   ├── css/           # Stylesheets
│   ├── js/            # JavaScript
│   └── fonts/         # Fonts
└── README.md          # This file
```

## 🔧 Environment Variables

The server uses:
- `PORT` - Automatically set by Render (default: 3000)
- `NODE_ENV` - Set to `production` in render.yaml

## 💾 Data Persistence

Offers data is stored in `offers-data.json` on the server disk. **Note**: Render's free tier may reset data on server sleep/restart. For production, consider upgrading to a paid plan or using a database.

## 🧪 Local Development

```bash
npm install
npm run dev  # Uses nodemon for auto-reload
```

Server runs on `http://localhost:3000`

## 🔗 Integration with Admin Panel

The admin panel (`/admin-panel-deploy/index.html`) has a dedicated **Offers Site Manager** section:

- ✅ View current offer stats
- ✅ Update all offer fields
- ✅ Generate new offers with frozen timestamps
- ✅ Monitor backend connection status
- ✅ Quick access to offers site

## 📊 Features

- **Real-time Updates**: Changes reflect immediately on the frontend
- **Timestamp Freezing**: Each offer generation freezes the current date/time
- **Editable Fields**:
  - Main username (domain)
  - Owner username
  - Sale price (synced with offer)
  - Offer amount
  - Offer buyer (with t.me link)
- **Anti-refresh Protection**: Site doesn't reload on wallet connect

## 🛠️ Troubleshooting

**Backend not responding?**
- Check if Render service is running
- Verify backend URL in admin panel
- Check browser console for CORS errors

**Data not persisting?**
- Render free tier resets on sleep
- Upgrade to paid plan or add database

**CORS errors?**
- Backend has CORS enabled for all origins
- Check if backend URL is correct

## 📝 Notes

- Backend URL format: `https://YOUR-SERVICE-NAME.onrender.com`
- No trailing slash in backend URL
- Free tier servers sleep after 15 mins of inactivity
- First request after sleep takes ~30 seconds to wake up

## 🎯 Next Steps

1. Deploy backend to Render
2. Deploy frontend to Netlify/Vercel
3. Update admin panel with both URLs
4. Test all functionality
5. Share offers site link!

---

Made with 💎 for Fragment Offers
