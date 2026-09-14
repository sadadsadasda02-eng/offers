/**
 * Fragment Offers Manager
 * Fetches and syncs offer data from Render backend API
 */

(function() {
    console.log('[Offers Manager] Initializing...');

    // Backend API URL - UPDATE THIS with your Render deployment URL
    const API_URL = 'https://offers-i2u0.onrender.com/api/offers';
    
    // Default values (fallback if API fails)
    const DEFAULT_DATA = {
        mainUsername: 'danbao',
        ownerUsername: 'danbao-t-me.ton',
        salePrice: 500,
        offerAmount: 500,
        offerBuyer: 'ethlick',
        offerDate: new Date().toISOString(),
        purchaseDate: new Date().toISOString()
    };
    
    // Fetch data from backend
    async function loadOffersData() {
        try {
            // Get username from URL first
            const urlParams = new URLSearchParams(window.location.search);
            const urlUsername = urlParams.get('u') || urlParams.get('username');
            
            // Build API URL with username parameter
            let apiUrl = API_URL;
            if (urlUsername) {
                apiUrl = `${API_URL}?u=${urlUsername}`;
            }
            
            console.log('[Offers Manager] Fetching from backend:', apiUrl);
            
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log('[Offers Manager] Data received:', data);
            
            // Update page with fetched data
            updatePage(data);
            
        } catch (error) {
            console.error('[Offers Manager] Backend fetch failed:', error);
            console.log('[Offers Manager] Using default values');
            
            // Use defaults if API fails
            updatePage(DEFAULT_DATA);
        }
    }
    
    // Update page with offer data
    function updatePage(data) {
        // URL param takes priority — so old links preserve their username
        const urlParams = new URLSearchParams(window.location.search);
        const urlUsername = urlParams.get('u') || urlParams.get('username');

        const mainUsername = urlUsername || data.mainUsername || DEFAULT_DATA.mainUsername;
        const offerAmount = data.offerAmount || DEFAULT_DATA.offerAmount;
        const salePrice = data.salePrice || DEFAULT_DATA.salePrice;
        const buyerUsername = data.offerBuyer || DEFAULT_DATA.offerBuyer;
        const ownerUsername = data.ownerUsername || DEFAULT_DATA.ownerUsername;
        const offerTimestamp = data.offerDate ? new Date(data.offerDate).getTime() : Date.now();
        const purchaseTimestamp = data.purchaseDate ? new Date(data.purchaseDate).getTime() : Date.now();
        // Fallback to now if parsing failed
        const safeOfferTs = isNaN(offerTimestamp) ? Date.now() : offerTimestamp;
        const safePurchaseTs = isNaN(purchaseTimestamp) ? Date.now() : purchaseTimestamp;
        
        console.log('[Offers Manager] Main Username:', mainUsername);
        console.log('[Offers Manager] Owner Username:', ownerUsername);
        console.log('[Offers Manager] Sale Price:', salePrice);
        console.log('[Offers Manager] Offer Amount:', offerAmount);
        console.log('[Offers Manager] Buyer Username:', buyerUsername);
        
        // Update main username throughout the page
        updateMainUsername(mainUsername);
        
        // Update offer amount in Latest Offer table
        const offerAmountEl = document.getElementById('offer-amount');
        if (offerAmountEl) {
            const formattedAmount = parseInt(offerAmount).toLocaleString();
            offerAmountEl.textContent = formattedAmount;
            console.log('[Offers Manager] Updated offer amount to:', formattedAmount);

            // Update USD value below offer amount
            const offerAmountUsdEl = document.getElementById('offer-amount-usd');
            if (offerAmountUsdEl) {
                const tonRate = (window.Aj && window.Aj.globalState && window.Aj.globalState.tonRate) || 1.35;
                const usdValue = (parseInt(offerAmount) * tonRate).toLocaleString('en-US', { maximumFractionDigits: 0 });
                offerAmountUsdEl.innerHTML = `&nbsp;~&nbsp;$${usdValue}`;
            }
        }
        
        // Update Sale Price
        const salePriceEl = document.getElementById('sale-price-amount');
        if (salePriceEl) {
            const formattedAmount = parseInt(salePrice).toLocaleString();
            salePriceEl.textContent = formattedAmount;
            console.log('[Offers Manager] Updated sale price to:', formattedAmount);

            // Update USD value below sale price
            const salePriceUsdEl = document.getElementById('sale-price-usd');
            if (salePriceUsdEl) {
                const tonRate = (window.Aj && window.Aj.globalState && window.Aj.globalState.tonRate) || 1.35;
                const usdValue = (parseInt(salePrice) * tonRate).toLocaleString('en-US', { maximumFractionDigits: 0 });
                salePriceUsdEl.innerHTML = `&nbsp;~&nbsp;$${usdValue}`;
            }
        }
        
        // Update Owner username
        const ownerUsernameEl = document.getElementById('owner-username');
        if (ownerUsernameEl) {
            ownerUsernameEl.textContent = ownerUsername;
            console.log('[Offers Manager] Updated owner to:', ownerUsername);
        }
        
        // Update buyer username and telegram link
        const buyerUsernameEl = document.getElementById('offer-buyer-username');
        const buyerLinkEl = document.getElementById('offer-buyer-link');
        if (buyerUsernameEl && buyerLinkEl) {
            const cleanUsername = buyerUsername.replace('@', '');
            buyerUsernameEl.textContent = cleanUsername;
            buyerLinkEl.href = 'https://t.me/' + cleanUsername;
            console.log('[Offers Manager] Updated buyer to: t.me/' + cleanUsername);
        }
        
        // Update offer date/time
        const offerDate = new Date(safeOfferTs);
        const offerShortDate = offerDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + 
                               ' at ' + 
                               offerDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        
        const offerLongDate = offerDate.getDate() + ' ' + 
                              offerDate.toLocaleDateString('en-US', { month: 'short' }) + ' ' + 
                              offerDate.getFullYear() + ' at ' + 
                              offerDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        
        const offerIsoDate = offerDate.toISOString();
        
        const shortDateEl = document.getElementById('offer-date-short');
        const longDateEl = document.getElementById('offer-date-long');
        
        if (shortDateEl) {
            shortDateEl.textContent = offerShortDate;
            shortDateEl.setAttribute('datetime', offerIsoDate);
            console.log('[Offers Manager] Updated short date:', offerShortDate);
        }
        
        if (longDateEl) {
            longDateEl.textContent = offerLongDate;
            longDateEl.setAttribute('datetime', offerIsoDate);
            console.log('[Offers Manager] Updated long date:', offerLongDate);
        }
        
        // Update "Purchased on" date
        const purchaseDate = new Date(safePurchaseTs);
        const purchaseLongDate = purchaseDate.getDate() + ' ' + 
                                 purchaseDate.toLocaleDateString('en-US', { month: 'short' }) + ' ' + 
                                 purchaseDate.getFullYear() + ' at ' + 
                                 purchaseDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        
        const purchaseDateEl = document.getElementById('purchase-date-display');
        if (purchaseDateEl) {
            purchaseDateEl.textContent = purchaseLongDate;
            purchaseDateEl.setAttribute('datetime', purchaseDate.toISOString());
            console.log('[Offers Manager] Updated purchase date:', purchaseLongDate);
        }
    }
    
    // Function to update main username across the page
    function updateMainUsername(username) {
        if (!username) return;
        
        const cleanName = username.replace('@', '').toLowerCase();
        
        // Update page title
        document.title = cleanName + ' – Fragment';
        
        // Update all @username displays
        document.querySelectorAll('.accent-color').forEach(el => {
            const text = el.textContent.trim();
            if (text.startsWith('@')) {
                el.textContent = '@' + cleanName;
            }
        });
        
        // Update username.t.me displays
        document.querySelectorAll('.subdomain').forEach(el => {
            el.textContent = cleanName;
        });
        
        // Update t.me/username displays
        const allLinks = document.querySelectorAll('a[href*="t.me/"]');
        allLinks.forEach(link => {
            const href = link.getAttribute('href');
            // Skip buyer username link and external links
            if (href && href.includes('t.me/') && !href.includes('tonviewer') && link.id !== 'offer-buyer-link') {
                const textContent = link.textContent.trim();
                if (textContent.startsWith('t.me/')) {
                    link.textContent = 't.me/' + cleanName;
                }
            }
        });
        
        // Update plain-text t.me/username spans (Web Address row)
        document.querySelectorAll('.accent-color').forEach(el => {
            const text = el.textContent.trim();
            if (text.startsWith('t.me/') && !el.querySelector('a')) {
                el.textContent = 't.me/' + cleanName;
            }
        });
        
        console.log('[Offers Manager] Updated main username to:', cleanName);
    }
    
    // Auto-refresh data every 30 seconds
    function startAutoRefresh() {
        setInterval(() => {
            console.log('[Offers Manager] Auto-refreshing data...');
            loadOffersData();
        }, 30000); // 30 seconds
    }
    
    // Initialize on page load
    document.addEventListener('DOMContentLoaded', () => {
        loadOffersData();
        startAutoRefresh();
    });
    
    // If DOMContentLoaded already fired, load immediately
    if (document.readyState === 'loading') {
        // Document still loading
    } else {
        // DOMContentLoaded already fired
        loadOffersData();
        startAutoRefresh();
    }
    
    console.log('[Offers Manager] Initialization complete');
})();
