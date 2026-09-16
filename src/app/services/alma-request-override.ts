// Client-side twin of proxy/alma-request-override.mjs (used in production where the dev proxy does not run).
export interface PickupLocation {
  key: string;
  value: string;
  category?: string;
  userAffiliatedCampus?: boolean;
}

// Add a key or a value string here to hide that pickup location from the list.
export const pickupLocationBlacklist: string[] = [
];

export function setPickupLocationBlacklistFromTranslation(value: unknown): void {
  let normalizedValue = value;
  if (typeof normalizedValue === 'string') {
    const trimmedValue = normalizedValue.trim();
    if (!trimmedValue || trimmedValue === 'fulldisplay.constants.request_blacklist') return;

    const unquotedValue = trimmedValue.startsWith('"') && trimmedValue.endsWith('"')
      ? trimmedValue.slice(1, -1)
      : trimmedValue;

    try {
      normalizedValue = JSON.parse(unquotedValue);
      if (typeof normalizedValue === 'string') normalizedValue = JSON.parse(normalizedValue);
    } catch {
      return;
    }
  }

  const translatedKeys = Array.isArray(normalizedValue)
    ? normalizedValue
    : (normalizedValue as { blacklist_keys?: unknown } | null)?.blacklist_keys;

  if (!Array.isArray(translatedKeys)) return;

  const keys = translatedKeys
    .map((entry) => typeof entry === 'string' ? entry : (entry as { key?: unknown } | null)?.key)
    .filter((key): key is string => typeof key === 'string' && key.length > 0);

  if (keys.length > 0) pickupLocationBlacklist.splice(0, pickupLocationBlacklist.length, ...keys);
}

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
