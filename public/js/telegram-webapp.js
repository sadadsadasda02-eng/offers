/**
 * Telegram Web App Integration
 * Detects if running in Telegram and enables Web App features
 */

(function() {
  'use strict';

  // Detect if running in Telegram
  const isTelegram = window.Telegram && window.Telegram.WebApp;
  const urlParams = new URLSearchParams(window.location.search);
  const isTelegramUrl = urlParams.has('tgWebAppData') || urlParams.has('tgWebAppVersion');

  if (isTelegram) {
    const tg = window.Telegram.WebApp;
    
    // Initialize Telegram Web App
    tg.ready();
    tg.expand();

    // Set theme colors
    if (tg.colorScheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Track Telegram user info
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
      const user = tg.initDataUnsafe.user;

      // Store user info for session tracking
      localStorage.setItem('telegramUser', JSON.stringify(user));

      // Send to session tracker
      window.postMessage({
        type: 'TELEGRAM_USER_DATA',
        user: user
      }, '*');
    }

    // Listen for viewport changes
    tg.onEvent('viewportChanged', function() {
    });

    // Listen for theme changes
    tg.onEvent('themeChanged', function() {
      if (tg.colorScheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    });

    // Add Telegram-specific styles
    const style = document.createElement('style');
    style.textContent = `
      body {
        background-color: var(--tg-theme-bg-color, #1a2026);
        color: var(--tg-theme-text-color, #fff);
      }
      .tm-header {
        background-color: var(--tg-theme-secondary-bg-color, #242e38);
      }
    `;
    document.head.appendChild(style);

    // Enable Telegram Web App features
    window.TelegramWebApp = {
      showAlert: (message) => tg.showAlert(message),
      showConfirm: (message, callback) => tg.showConfirm(message, callback),
      showPopup: (params, callback) => tg.showPopup(params, callback),
      close: () => tg.close(),
      openLink: (url) => tg.openLink(url),
      openTelegramLink: (url) => tg.openTelegramLink(url)
    };

  } else {
    // Add class to body for browser-specific styling
    document.body.classList.add('browser-mode');
  }

  // Universal detection for Telegram user agent
  const isTelegramUA = /Telegram/i.test(navigator.userAgent);
  if (isTelegramUA) {
    document.body.classList.add('telegram-browser');
  }

})();
