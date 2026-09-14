const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// GitHub configuration for image storage (separate from auction)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;       // e.g. 'fragment-offers-images'
const GITHUB_BRANCH = 'main';

// GitHub API helper
async function githubAPI(endpoint, method = 'GET', data = null) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}${endpoint}`;
  const headers = {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
  try {
    const response = await axios({ method, url, headers, data });
    return response.data;
  } catch (error) {
    console.error('GitHub API Error:', error.response?.data || error.message);
    throw error;
  }
}

// Upload file to GitHub
async function uploadToGitHub(filepath, content, message) {
  let sha = null;
  try {
    const existing = await githubAPI(`/contents/${filepath}`);
    sha = existing.sha;
  } catch (e) { /* file doesn't exist yet */ }

  const base64Content = Buffer.isBuffer(content)
    ? content.toString('base64')
    : Buffer.from(content).toString('base64');

  const data = {
    message: message || `Update ${filepath}`,
    content: base64Content,
    branch: GITHUB_BRANCH,
  };
  if (sha) data.sha = sha;
  return await githubAPI(`/contents/${filepath}`, 'PUT', data);
}

// Get mappings from GitHub
async function getMappings() {
  try {
    const file = await githubAPI('/contents/mappings.json');
    const content = Buffer.from(file.content, 'base64').toString('utf8');
    return JSON.parse(content);
  } catch (e) {
    return {};
  }
}

// In-memory storage (persisted to file)
const DATA_FILE = path.join(__dirname, 'offers-data.json');

// Initialize data structure - now stores per-username offers
let offersData = {};

// Load data from file on startup
async function loadData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    offersData = JSON.parse(data);
    console.log('✅ Data loaded from file');
  } catch (error) {
    console.log('📝 No existing data file, using defaults');
    offersData = {};
    await saveData();
  }
}

// Save data to file
async function saveData() {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(offersData, null, 2));
    console.log('💾 Data saved to file');
  } catch (error) {
    console.error('❌ Error saving data:', error);
  }
}

// API Routes

// Get offers data for a specific username or all offers
app.get('/api/offers', (req, res) => {
  const username = req.query.u || req.query.username;
  
  if (username) {
    // Return data for specific username
    const userData = offersData[username];
    if (userData) {
      res.json(userData);
    } else {
      res.status(404).json({ 
        success: false, 
        message: `No offer data found for username: ${username}` 
      });
    }
  } else {
    // Return all offers
    res.json(offersData);
  }
});

// Update offers data (from admin panel)
app.post('/api/offers/update', async (req, res) => {
  try {
    const updates = req.body;
    const username = updates.mainUsername;
    
    if (!username) {
      return res.status(400).json({ 
        success: false, 
        message: 'mainUsername is required' 
      });
    }
    
    // Create or update offer for this username
    if (!offersData[username]) {
      offersData[username] = {};
    }
    
    // Update fields for this username
    if (updates.ownerUsername !== undefined) offersData[username].ownerUsername = updates.ownerUsername;
    if (updates.salePrice !== undefined) offersData[username].salePrice = parseFloat(updates.salePrice);
    if (updates.purchaseDate !== undefined) offersData[username].purchaseDate = updates.purchaseDate;
    if (updates.offerAmount !== undefined) offersData[username].offerAmount = parseFloat(updates.offerAmount);
    if (updates.offerBuyer !== undefined) offersData[username].offerBuyer = updates.offerBuyer;
    if (updates.offerDate !== undefined) offersData[username].offerDate = updates.offerDate;
    if (updates.claimedStatus !== undefined) offersData[username].claimedStatus = updates.claimedStatus;
    
    // Store the mainUsername in the data itself
    offersData[username].mainUsername = username;
    
    // Save to file
    await saveData();
    
    res.json({ 
      success: true, 
      message: `Offers data updated for @${username}`,
      data: offersData[username]
    });
  } catch (error) {
    console.error('Error updating offers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating offers data',
      error: error.message 
    });
  }
});

// Generate new offer with current timestamp
app.post('/api/offers/generate', async (req, res) => {
  try {
    const username = req.body.username || req.body.mainUsername;
    
    if (!username) {
      return res.status(400).json({ 
        success: false, 
        message: 'username is required' 
      });
    }
    
    const now = new Date();
    
    if (!offersData[username]) {
      offersData[username] = {};
    }
    
    offersData[username].offerDate = now.toISOString();
    offersData[username].purchaseDate = now.toISOString();
    
    await saveData();
    
    res.json({ 
      success: true, 
      message: `New offer generated for @${username}`,
      data: offersData[username]
    });
  } catch (error) {
    console.error('Error generating offer:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error generating offer',
      error: error.message 
    });
  }
});

// Upload preview image to GitHub (offers-specific repo)
app.post('/api/upload-preview', async (req, res) => {
  try {
    const { username, imageData } = req.body;

    if (!username || !imageData) {
      return res.status(400).json({ success: false, error: 'Missing username or imageData' });
    }

    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
      return res.status(500).json({ success: false, error: 'GitHub env vars not set (GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO)' });
    }

    // 1. Get existing mappings
    const mappings = await getMappings();

    // 2. Determine image number
    let imageNum;
    if (mappings[username] !== undefined) {
      imageNum = mappings[username]; // reuse existing slot
    } else {
      const existing = Object.values(mappings);
      imageNum = existing.length > 0 ? Math.max(...existing) + 1 : 1;
    }

    // 3. Strip base64 header and upload PNG
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    await uploadToGitHub(`images/${imageNum}.png`, imageBuffer, `Offers preview: @${username}`);

    // 4. Update mappings
    mappings[username] = imageNum;
    await uploadToGitHub('mappings.json', JSON.stringify(mappings, null, 2), `Map @${username} → ${imageNum}`);

    // 5. Build image URL
    const imageUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/images/${imageNum}.png`;

    console.log(`[Offers Upload] @${username} → image #${imageNum}`);
    res.json({ success: true, imageUrl, imageNum, username });

  } catch (error) {
    console.error('Upload preview error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get current mappings
app.get('/api/mappings', async (req, res) => {
  try {
    const mappings = await getMappings();
    res.json(mappings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, async () => {
  await loadData();
  console.log(`🚀 Offers Site Backend running on port ${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/offers`);
});
