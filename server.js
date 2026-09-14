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

// Initialize data structure
let offersData = {
  mainUsername: 'danbao',
  ownerUsername: 'danbao-t-me.ton',
  salePrice: 500,
  purchaseDate: new Date().toISOString(),
  offerAmount: 500,
  offerBuyer: 'ethlick',
  offerDate: new Date().toISOString(),
  claimedStatus: true
};

// Load data from file on startup
async function loadData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    offersData = JSON.parse(data);
    console.log('✅ Data loaded from file');
  } catch (error) {
    console.log('📝 No existing data file, using defaults');
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

// Get all offers data
app.get('/api/offers', (req, res) => {
  res.json(offersData);
});

// Update offers data (from admin panel)
app.post('/api/offers/update', async (req, res) => {
  try {
    const updates = req.body;
    
    // Validate and update fields
    if (updates.mainUsername !== undefined) offersData.mainUsername = updates.mainUsername;
    if (updates.ownerUsername !== undefined) offersData.ownerUsername = updates.ownerUsername;
    if (updates.salePrice !== undefined) offersData.salePrice = parseFloat(updates.salePrice);
    if (updates.purchaseDate !== undefined) offersData.purchaseDate = updates.purchaseDate;
    if (updates.offerAmount !== undefined) offersData.offerAmount = parseFloat(updates.offerAmount);
    if (updates.offerBuyer !== undefined) offersData.offerBuyer = updates.offerBuyer;
    if (updates.offerDate !== undefined) offersData.offerDate = updates.offerDate;
    if (updates.claimedStatus !== undefined) offersData.claimedStatus = updates.claimedStatus;
    
    // Save to file
    await saveData();
    
    res.json({ 
      success: true, 
      message: 'Offers data updated successfully',
      data: offersData 
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
    const now = new Date();
    offersData.offerDate = now.toISOString();
    offersData.purchaseDate = now.toISOString();
    
    await saveData();
    
    res.json({ 
      success: true, 
      message: 'New offer generated with current timestamp',
      data: offersData 
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
