// Transform for the AlmaRequest titleServices response's pickupLocation lists.
// Add a key or a value string here to hide that pickup location from the list.
export const pickupLocationBlacklist = [
];

// Prefix applied to the display value based on the suffix of pickupLocation.key
// (key format is "<id>$$<SUFFIX>").
const KEY_SUFFIX_PREFIXES = {
  CIRCULATION_DESK: 'Read At: ',
  LIBRARY: 'Borrow From: ',
};

function isBlacklisted(loc) {
  return pickupLocationBlacklist.includes(loc.key) || pickupLocationBlacklist.includes(loc.value);
}

function prefixForKey(key = '') {
  for (const [suffix, prefix] of Object.entries(KEY_SUFFIX_PREFIXES)) {
    if (key.endsWith(suffix)) return prefix;
  }
  return '';
}

export function applyAlmaRequestOverride(json) {
  const services = json?.['services-arr']?.services;
  if (!Array.isArray(services)) return json;

  for (const service of services) {
    const groupsListMap = service?.['groups-list-map'];
    if (!Array.isArray(groupsListMap)) continue;

    for (const group of groupsListMap) {
      if (!Array.isArray(group?.pickupLocation)) continue;

      group.pickupLocation = group.pickupLocation
        .filter((loc) => !isBlacklisted(loc))
        .map((loc) => {
          const prefix = prefixForKey(loc.key);
          if (!prefix || loc.value?.startsWith(prefix)) return loc;
          return {...loc, value: `${prefix}${loc.value}`};
        });
    }
  }

  return json;
}
