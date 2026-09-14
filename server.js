const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

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
