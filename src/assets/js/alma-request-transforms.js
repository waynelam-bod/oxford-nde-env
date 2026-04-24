/**
 * AlmaRequest Response Transforms
 * Intercepts fetch requests to modify pickup location values in AlmaRequest responses.
 * 
 * This file runs in the shell/host application context.
 */

/**
 * Keys to filter out (remove from pickup locations)
 */
const pickupLocationFilters = [
  // Remove Weston Library (key starts with 16897678790007026)
  (key) => key?.startsWith('16897678790007026')
];

/**
 * Pickup location value transformations based on key patterns.
 * Add new transformations here as { keyPattern, transform } objects.
 */
const pickupLocationTransforms = [
  {
    // Keys ending with $$LIBRARY get "BORROW FROM: " prefix
    keyPattern: (key) => key?.endsWith('$$LIBRARY'),
    transform: (value) => {
      if (value && !value.startsWith('BORROW FROM: ')) {
        return `BORROW FROM: ${value}`;
      }
      return value;
    }
  },
  {
    // Keys ending with $$CIRCULATION_DESK get "READ AT: " prefix
    keyPattern: (key) => key?.endsWith('$$CIRCULATION_DESK'),
    transform: (value) => {
      if (value && !value.startsWith('READ AT: ')) {
        return `READ AT: ${value}`;
      }
      return value;
    }
  }
];

/**
 * Apply all pickup location transformations to an AlmaRequest response
 */
function transformAlmaRequestResponse(json) {
  if (!json?.['services-arr']?.services) {
    return json;
  }

  for (const service of json['services-arr'].services) {
    if (service['groups-list-map']) {
      for (const groupMap of service['groups-list-map']) {
        if (groupMap.pickupLocation && Array.isArray(groupMap.pickupLocation)) {
          // Filter out locations matching filter patterns
          groupMap.pickupLocation = groupMap.pickupLocation.filter(location => {
            return !pickupLocationFilters.some(filter => filter(location.key));
          });
          
          // Apply transforms to remaining locations
          for (const location of groupMap.pickupLocation) {
            for (const { keyPattern, transform } of pickupLocationTransforms) {
              if (keyPattern(location.key)) {
                location.value = transform(location.value);
              }
            }
          }
        }
      }
    }
  }

  return json;
}

/**
 * Check if URL is an AlmaRequest endpoint
 */
function isAlmaRequestUrl(url) {
  return url.includes('/ILSServices/titleServices/') && url.includes('/AlmaRequest');
}

/**
 * Intercept fetch requests to modify AlmaRequest responses
 */
(function() {
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const [resource, config] = args;
    const url = typeof resource === 'string' ? resource : resource.url;
    
    const response = await originalFetch.apply(this, args);
    
    // Only intercept AlmaRequest responses
    if (isAlmaRequestUrl(url)) {
      try {
        // Clone response to read body
        const clone = response.clone();
        const json = await clone.json();
        const transformed = transformAlmaRequestResponse(json);
        
        // Return new response with transformed body
        return new Response(JSON.stringify(transformed), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      } catch (e) {
        console.error('Error transforming AlmaRequest response:', e);
      }
    }
    
    return response;
  };
  
  console.log('AlmaRequest fetch interceptor installed');
})();
