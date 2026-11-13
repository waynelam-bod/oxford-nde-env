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

interface PickupLocationLabelRule {
  append?: string;
  replace?: string;
}

let pickupLocationLabelRules: Record<string, PickupLocationLabelRule> = {};
let pickupLocationTextToRemove: string[] = [];
const defaultKeySuffixPrefixes: Record<string, string> = {
  CIRCULATION_DESK: 'Read At: ',
  LIBRARY: 'Borrow From: ',
};
let keySuffixPrefixes: Record<string, string> = defaultKeySuffixPrefixes;
let keyPrefixOverrides: Record<string, string> = {};

function parsePrefixMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([key, prefix]) => key.length > 0 && typeof prefix === 'string'));
}

export function setPickupLocationLabelRulesFromTranslation(value: unknown): void {
  let normalizedValue = value;
  try {
    for (let depth = 0; depth < 2 && typeof normalizedValue === 'string'; depth++) {
      normalizedValue = JSON.parse(normalizedValue);
    }
  } catch {
    return;
  }

  if (!normalizedValue || typeof normalizedValue !== 'object' || Array.isArray(normalizedValue)) return;
  const config = normalizedValue as { labels?: unknown; remove_text?: unknown; prefixes?: unknown; key_prefix_overrides?: unknown };
  const labels: Record<string, PickupLocationLabelRule> = Object.create(null);
  if (config.labels && typeof config.labels === 'object' && !Array.isArray(config.labels)) {
    for (const [key, rule] of Object.entries(config.labels)) {
      if (!rule || typeof rule !== 'object' || Array.isArray(rule)) continue;
      const { append, replace } = rule as { append?: unknown; replace?: unknown };
      labels[key] = {
        ...(typeof append === 'string' && append ? { append } : {}),
        ...(typeof replace === 'string' ? { replace } : {}),
      };
    }
  }
  pickupLocationLabelRules = labels;
  pickupLocationTextToRemove = Array.isArray(config.remove_text)
    ? config.remove_text.filter((text): text is string => typeof text === 'string' && text.length > 0)
    : [];
  keySuffixPrefixes = { ...defaultKeySuffixPrefixes, ...parsePrefixMap(config.prefixes) };
  keyPrefixOverrides = parsePrefixMap(config.key_prefix_overrides);
}

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

const ALMA_REQUEST_URL_PATTERN = /\/ILSServices\/titleServices\/[^/?#]+\/[^/?#]+\/AlmaRequest(?:[?#]|$)/;

export function isAlmaRequestUrl(url: string | null | undefined): boolean {
  return !!url && ALMA_REQUEST_URL_PATTERN.test(url);
}

function isBlacklisted(loc: PickupLocation): boolean {
  return pickupLocationBlacklist.includes(loc.key) || pickupLocationBlacklist.includes(loc.value);
}

function prefixForKey(key = ''): string | undefined {
  const override = Object.entries(keyPrefixOverrides)
    .filter(([start]) => key.startsWith(start))
    .sort(([first], [second]) => second.length - first.length)[0];
  if (override) return override[1];
  for (const [suffix, prefix] of Object.entries(keySuffixPrefixes)) {
    if (key.endsWith(suffix)) return prefix;
  }
  return undefined;
}

function withoutKnownPrefix(label: string): string {
  const prefixes = [...Object.values(defaultKeySuffixPrefixes), ...Object.values(keySuffixPrefixes), ...Object.values(keyPrefixOverrides)]
    .filter(prefix => prefix.length > 0)
    .sort((first, second) => second.length - first.length);
  const existingPrefix = prefixes.find(prefix => label.startsWith(prefix));
  return existingPrefix ? label.slice(existingPrefix.length) : label;
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
          if (typeof loc.value !== 'string') return loc;
          const prefix = prefixForKey(loc.key);
          let label = prefix === undefined ? loc.value : withoutKnownPrefix(loc.value);
          const rule = pickupLocationLabelRules[loc.key];
          if (rule?.replace !== undefined) label = rule.replace;
          if (rule?.append && !label.includes(rule.append)) label += rule.append;
          for (const text of pickupLocationTextToRemove) label = label.split(text).join('');
          return {...loc, value: `${prefix ?? ''}${label}`};
        });
    }
  }

  return json;
}
