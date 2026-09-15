// Client-side twin of proxy/alma-request-override.mjs (used in production where the dev proxy does not run).
export interface PickupLocation {
  key: string;
  value: string;
  category?: string;
  userAffiliatedCampus?: boolean;
}

// Add a key or a value string here to hide that pickup location from the list.
export const pickupLocationBlacklist: string[] = [
  // '24904615900007026$$CIRCULATION_DESK',
  // 'Staff Office: Weston Archives Holding Area',
];

// Prefix applied to the display value based on the suffix of pickupLocation.key
// (key format is "<id>$$<SUFFIX>").
const KEY_SUFFIX_PREFIXES: Record<string, string> = {
  CIRCULATION_DESK: 'Read At: ',
  LIBRARY: 'Borrow From: ',
};

const ALMA_REQUEST_URL_PATTERN = /\/ILSServices\/titleServices\/[^/?#]+\/[^/?#]+\/AlmaRequest(?:[?#]|$)/;

export function isAlmaRequestUrl(url: string | null | undefined): boolean {
  return !!url && ALMA_REQUEST_URL_PATTERN.test(url);
}

function isBlacklisted(loc: PickupLocation): boolean {
  return pickupLocationBlacklist.includes(loc.key) || pickupLocationBlacklist.includes(loc.value);
}

function prefixForKey(key = ''): string {
  for (const [suffix, prefix] of Object.entries(KEY_SUFFIX_PREFIXES)) {
    if (key.endsWith(suffix)) return prefix;
  }
  return '';
}

export function applyAlmaRequestOverride(json: any): any {
  const services = json?.['services-arr']?.services;
  if (!Array.isArray(services)) return json;

  for (const service of services) {
    const groupsListMap = service?.['groups-list-map'];
    if (!Array.isArray(groupsListMap)) continue;

    for (const group of groupsListMap) {
      if (!Array.isArray(group?.pickupLocation)) continue;

      group.pickupLocation = group.pickupLocation
        .filter((loc: PickupLocation) => !isBlacklisted(loc))
        .map((loc: PickupLocation) => {
          const prefix = prefixForKey(loc.key);
          if (!prefix || loc.value?.startsWith(prefix)) return loc;
          return {...loc, value: `${prefix}${loc.value}`};
        });
    }
  }

  return json;
}
