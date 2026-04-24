/**
 * Shared pickup location transformations.
 * Used by both the proxy (development) and Angular interceptor (if needed).
 */

// Debug mode - set to true to enable verbose logging
export const DEBUG = true;

function debugLog(...args) {
  if (DEBUG) {
    console.log('[AlmaRequest Transform]', ...args);
  }
}

/**
 * Keys to filter out (remove from pickup locations)
 */
export const pickupLocationFilters = [
  // Remove Weston Library (key starts with 16897678790007026)
  (key) => key?.startsWith('16897678790007026')
];

/**
 * Add new transformations as { keyPattern, transform } objects.
 */
export const pickupLocationTransforms = [
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
 * Apply all pickup location transformations to an AlmaRequest response JSON
 */
export function transformAlmaRequestResponse(json) {
  debugLog('Processing AlmaRequest response');
  
  if (!json?.['services-arr']?.services) {
    debugLog('No services-arr found in response');
    return json;
  }

  for (const service of json['services-arr'].services) {
    if (service['groups-list-map']) {
      for (const groupMap of service['groups-list-map']) {
        if (groupMap.pickupLocation && Array.isArray(groupMap.pickupLocation)) {
          const originalCount = groupMap.pickupLocation.length;
          
          // Filter out locations matching filter patterns
          groupMap.pickupLocation = groupMap.pickupLocation.filter(location => {
            const shouldFilter = pickupLocationFilters.some(filter => filter(location.key));
            if (shouldFilter) {
              debugLog(`FILTERED OUT: key="${location.key}", value="${location.value}"`);
            }
            return !shouldFilter;
          });
          
          debugLog(`Filtered ${originalCount - groupMap.pickupLocation.length} locations, ${groupMap.pickupLocation.length} remaining`);
          
          // Apply transforms to remaining locations
          for (const location of groupMap.pickupLocation) {
            const originalValue = location.value;
            for (const { keyPattern, transform } of pickupLocationTransforms) {
              if (keyPattern(location.key)) {
                location.value = transform(location.value);
                if (location.value !== originalValue) {
                  debugLog(`TRANSFORMED: "${originalValue}" → "${location.value}" (key: ${location.key})`);
                }
              }
            }
          }
        }
      }
    }
  }

  debugLog('AlmaRequest transformation complete');
  return json;
}
