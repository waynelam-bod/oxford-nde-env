/**
 * Custom JavaScript that runs in the shell/host application context.
 * Loads modular customization scripts.
 * 
 * Note: Pickup location dropdown styling is handled by the PickupLocationStylerComponent
 * which is appended to nde-request-form-after hook.
 */

(function() {
  // Get the base URL for custom assets
  function getCustomAssetsBase() {
    // Find the script tag that loaded this file to determine base path
    const scripts = document.querySelectorAll('script[src*="custom.js"]');
    if (scripts.length > 0) {
      const src = scripts[scripts.length - 1].src;
      return src.replace(/js\/custom\.js.*$/, '');
    }
    // Fallback: try to find from existing custom asset paths
    const customLinks = document.querySelectorAll('link[href*="/custom/"]');
    if (customLinks.length > 0) {
      const href = customLinks[0].href;
      const match = href.match(/(.*\/custom\/[^/]+\/)/);
      if (match) return match[1];
    }
    return '/custom/';
  }

  const assetsBase = getCustomAssetsBase();

  // Load additional JS modules
  const jsModules = [
    'js/alma-request-transforms.js'
  ];

  jsModules.forEach(module => {
    const script = document.createElement('script');
    script.src = assetsBase + module;
    script.async = false;
    script.onload = () => {
      console.log(`Loaded custom module: ${script.src}`);
    };
    script.onerror = (e) => {
      console.error(`Failed to load custom module: ${script.src}`, e);
    };
    document.head.appendChild(script);
  });

  console.log('Custom modules loading from:', assetsBase);

  // Inject solo-record-message component on fulldisplay pages
  function injectRecordMessage() {
    if (!document.querySelector('solo-record-message')) {
      const el = document.createElement('solo-record-message');
      document.body.appendChild(el);
    }
  }

  // Run on page load and navigation
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectRecordMessage);
  } else {
    injectRecordMessage();
  }
})();

