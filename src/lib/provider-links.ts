/**
 * Provider link handling for streaming services
 * 
 * This module handles outbound links for Netflix, Hulu, Max (HBO),
 * and other providers with appropriate search fallbacks.
 */

// Provider sign-in page URLs
export const providerSignInUrls: Record<string, string> = {
  'netflix': 'https://www.netflix.com/login',
  'hulu': 'https://secure.hulu.com/account/signin',
  'max': 'https://play.max.com/signIn',
  'hbo max': 'https://play.max.com/signIn',
  'hbo': 'https://play.max.com/signIn',
  'amazon': 'https://www.amazon.com/ap/signin',
  'amazon prime video': 'https://www.amazon.com/ap/signin',
  'prime video': 'https://www.amazon.com/ap/signin',
  'disney plus': 'https://www.disneyplus.com/login',
  'disney+': 'https://www.disneyplus.com/login',
  'apple tv': 'https://tv.apple.com/',
  'apple tv plus': 'https://tv.apple.com/',
  'apple tv+': 'https://tv.apple.com/',
  'paramount plus': 'https://www.paramountplus.com/account/signin/',
  'paramount+': 'https://www.paramountplus.com/account/signin/',
  'peacock': 'https://www.peacocktv.com/signin',
  'peacock premium': 'https://www.peacocktv.com/signin',
};

/**
 * Get the sign-in URL for a provider
 * Returns undefined if the provider is not in the mapping
 */
export function getProviderSignInUrl(providerName: string): string | undefined {
  const normalized = providerName.toLowerCase().trim();
  
  // Exact match first
  if (providerSignInUrls[normalized]) {
    return providerSignInUrls[normalized];
  }
  
  // Partial match
  for (const key of Object.keys(providerSignInUrls)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return providerSignInUrls[key];
    }
  }
  
  return undefined;
}

// Provider search URL builders
const providerSearchUrls: Record<string, (title: string, year?: string) => string> = {
  // Netflix
  'netflix': (title, year) => {
    const query = year ? `${title} ${year}` : title;
    return `https://www.netflix.com/search?q=${encodeURIComponent(query.trim())}`;
  },
  
  // Hulu
  'hulu': (title, year) => {
    const query = year ? `${title} ${year}` : title;
    return `https://www.hulu.com/search?q=${encodeURIComponent(query.trim())}`;
  },
  
  // Max (HBO)
  'max': (title, year) => {
    const query = year ? `${title} ${year}` : title;
    return `https://play.max.com/search?q=${encodeURIComponent(query.trim())}`;
  },
  'hbo max': (title, year) => {
    const query = year ? `${title} ${year}` : title;
    return `https://play.max.com/search?q=${encodeURIComponent(query.trim())}`;
  },
  'hbo': (title, year) => {
    const query = year ? `${title} ${year}` : title;
    return `https://play.max.com/search?q=${encodeURIComponent(query.trim())}`;
  },
  
  // Disney Plus
  'disney plus': (title, year) => {
    const query = year ? `${title} ${year}` : title;
    return `https://www.disneyplus.com/search?q=${encodeURIComponent(query.trim())}`;
  },
  'disney+': (title, year) => {
    const query = year ? `${title} ${year}` : title;
    return `https://www.disneyplus.com/search?q=${encodeURIComponent(query.trim())}`;
  },
  
  // Apple TV
  'apple tv': (title, year) => {
    const query = year ? `${title} ${year}` : title;
    return `https://tv.apple.com/search?term=${encodeURIComponent(query.trim())}`;
  },
  'apple tv plus': (title, year) => {
    const query = year ? `${title} ${year}` : title;
    return `https://tv.apple.com/search?term=${encodeURIComponent(query.trim())}`;
  },
  'apple tv+': (title, year) => {
    const query = year ? `${title} ${year}` : title;
    return `https://tv.apple.com/search?term=${encodeURIComponent(query.trim())}`;
  },
  
  // Paramount+
  'paramount plus': (title, year) => {
    const query = year ? `${title} ${year}` : title;
    return `https://www.paramountplus.com/search/?q=${encodeURIComponent(query.trim())}`;
  },
  'paramount+': (title, year) => {
    const query = year ? `${title} ${year}` : title;
    return `https://www.paramountplus.com/search/?q=${encodeURIComponent(query.trim())}`;
  },
  
  // Peacock
  'peacock': (title, year) => {
    const query = year ? `${title} ${year}` : title;
    return `https://www.peacocktv.com/search?q=${encodeURIComponent(query.trim())}`;
  },
  'peacock premium': (title, year) => {
    const query = year ? `${title} ${year}` : title;
    return `https://www.peacocktv.com/search?q=${encodeURIComponent(query.trim())}`;
  },
};

// Providers that should log when fallback is used
type LoggableProvider = 'netflix' | 'hulu' | 'max';
const loggableProviders: Record<string, LoggableProvider> = {
  'netflix': 'netflix',
  'hulu': 'hulu',
  'max': 'max',
  'hbo max': 'max',
  'hbo': 'max',
};

/**
 * Check if the provider name matches a known provider
 */
function matchProvider(providerName: string): string | null {
  const normalized = providerName.toLowerCase().trim();
  
  // Exact match first
  if (providerSearchUrls[normalized]) {
    return normalized;
  }
  
  // Partial match
  for (const key of Object.keys(providerSearchUrls)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return key;
    }
  }
  
  return null;
}

/**
 * Log fallback usage in dev mode
 */
function logFallbackUsage(providerKey: string): void {
  if (!import.meta.env.DEV) return;
  
  const loggableKey = loggableProviders[providerKey];
  if (loggableKey) {
    const logMessages: Record<LoggableProvider, string> = {
      'netflix': 'Netflix search fallback used',
      'hulu': 'Hulu search fallback used',
      'max': 'Max search fallback used',
    };
    console.log(logMessages[loggableKey]);
  }
}

/**
 * Get the search fallback URL for a provider
 */
export function getProviderSearchUrl(
  providerName: string, 
  title: string, 
  year?: string
): string | null {
  const providerKey = matchProvider(providerName);
  
  if (!providerKey) {
    return null;
  }
  
  const urlBuilder = providerSearchUrls[providerKey];
  if (urlBuilder) {
    logFallbackUsage(providerKey);
    return urlBuilder(title, year);
  }
  
  return null;
}

/**
 * Get the final outbound URL for a provider
 * 
 * Priority:
 * 1. Use TMDB-provided link if available and valid
 * 2. Use provider-specific search URL as fallback
 * 3. Fall back to Google search as last resort
 * 
 * Note: Amazon providers are handled separately in amazon-affiliate.ts
 */
export function getProviderOutboundUrl(
  providerName: string,
  tmdbLink: string | undefined,
  title: string,
  year?: string
): string {
  // If TMDB provides a link, use it (TMDB links are already provider-specific)
  if (tmdbLink) {
    return tmdbLink;
  }
  
  // Try provider-specific search URL
  const searchUrl = getProviderSearchUrl(providerName, title, year);
  if (searchUrl) {
    return searchUrl;
  }
  
  // Last resort: Google search
  const yearSuffix = year ? ` ${year}` : '';
  return `https://www.google.com/search?q=${encodeURIComponent(`${title}${yearSuffix} watch ${providerName}`)}`;
}

/**
 * Check if a provider is Netflix
 */
export function isNetflixProvider(providerName: string): boolean {
  return providerName.toLowerCase().includes('netflix');
}

/**
 * Check if a provider is Hulu
 */
export function isHuluProvider(providerName: string): boolean {
  return providerName.toLowerCase().includes('hulu');
}

/**
 * Check if a provider is Max (HBO)
 */
export function isMaxProvider(providerName: string): boolean {
  const normalized = providerName.toLowerCase();
  return normalized.includes('max') || normalized.includes('hbo');
}
