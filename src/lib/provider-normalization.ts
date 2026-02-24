/**
 * Normalize provider names so channel/tier variants merge into canonical services.
 * E.g. "Paramount Plus Apple TV Channel" → "Paramount+"
 */

const PROVIDER_ALIASES: Record<string, string> = {
  // Paramount
  "Paramount Plus": "Paramount+",
  "Paramount+ Amazon Channel": "Paramount+",
  "Paramount Plus Apple TV Channel": "Paramount+",
  "Paramount+ Apple TV Channel": "Paramount+",
  "Paramount+ Roku Premium Channel": "Paramount+",
  "Paramount Plus Amazon Channel": "Paramount+",
  "Paramount+ with Showtime": "Paramount+",
  "Paramount Plus Essential": "Paramount+",
  "Paramount Plus Premium": "Paramount+",

  // HBO / Max
  "HBO Max": "Max",
  "HBO Max Amazon Video": "Max",
  "Max Amazon Channel": "Max",
  "HBO Max Free": "Max",

  // Disney
  "Disney Plus": "Disney+",

  // Apple TV
  "Apple TV Plus": "Apple TV+",

  // Amazon
  "Amazon Prime Video": "Prime Video",

  // Peacock
  "Peacock Premium": "Peacock",
  "Peacock Premium Plus": "Peacock",

  // Hulu
  "Hulu (No Ads)": "Hulu",

  // Starz
  "Starz Amazon Channel": "Starz",
  "Starz Apple TV Channel": "Starz",
  "Starz Roku Premium Channel": "Starz",
  "STARZ": "Starz",

  // Showtime
  "Showtime Amazon Channel": "Showtime",
  "Showtime Apple TV Channel": "Showtime",
  "Showtime Roku Premium Channel": "Showtime",

  // AMC
  "AMC+ Amazon Channel": "AMC+",
  "AMC+ Apple TV Channel": "AMC+",
  "AMC+ Roku Premium Channel": "AMC+",

  // MGM
  "MGM Plus Amazon Channel": "MGM+",
  "MGM Plus Apple TV Channel": "MGM+",
  "MGM Plus Roku Premium Channel": "MGM+",
  "EPIX Amazon Channel": "MGM+",
  "Epix Amazon Channel": "MGM+",

  // BritBox
  "BritBox Amazon Channel": "BritBox",
  "BritBox Apple TV Channel": "BritBox",

  // Discovery
  "Discovery+ Amazon Channel": "Discovery+",
  "Discovery Plus": "Discovery+",
};

// Channel suffixes to strip as a fallback
const CHANNEL_SUFFIXES = [
  " Amazon Channel",
  " Apple TV Channel",
  " Roku Premium Channel",
  " Roku Channel",
  " Amazon Video",
];

export function normalizeProviderName(name: string): string {
  // Direct alias match
  if (PROVIDER_ALIASES[name]) return PROVIDER_ALIASES[name];

  // Strip channel suffixes
  for (const suffix of CHANNEL_SUFFIXES) {
    if (name.endsWith(suffix)) {
      const base = name.slice(0, -suffix.length);
      return PROVIDER_ALIASES[base] || base;
    }
  }

  return name;
}

/**
 * Merge provider counts using normalized names.
 * Returns sorted by count descending.
 */
export function normalizeProviderCounts(
  counts: Record<string, number>
): { name: string; count: number }[] {
  const merged: Record<string, number> = {};

  for (const [rawName, count] of Object.entries(counts)) {
    const canonical = normalizeProviderName(rawName);
    merged[canonical] = (merged[canonical] || 0) + count;
  }

  return Object.entries(merged)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
