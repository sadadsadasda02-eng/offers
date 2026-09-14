/**
 * Offers Preview Image Loader
 * Dynamically updates og:image based on username in URL
 */

(function() {
  'use strict';

  const GITHUB_OWNER = 'sadadsadasda02-eng';
  const GITHUB_REPO = 'offers';
  const GITHUB_BRANCH = 'main';
  const MAPPINGS_URL = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/mappings.json`;

  async function updatePreviewImage() {
    // Get username from URL param
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('u') || urlParams.get('username');
    
    if (!username) return; // No username in URL, use default

    try {
      // Fetch mappings from GitHub
      const response = await fetch(MAPPINGS_URL);
      const mappings = await response.json();
      
      // Get image number for this username
      const imageNum = mappings[username];
      if (!imageNum) {
        console.warn(`[Offers Preview] No image found for @${username}`);
        return;
      }

      // Update og:image meta tag
      const imageUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/images/${imageNum}.png`;
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) {
        ogImage.setAttribute('content', imageUrl);
        console.log(`[Offers Preview] Updated og:image for @${username} → image #${imageNum}`);
      }

    } catch (error) {
      console.error('[Offers Preview] Failed to load mappings:', error);
    }
  }

  // Run as early as possible (before Telegram crawls)
  updatePreviewImage();

})();
