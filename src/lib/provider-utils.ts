import { WatchProvider } from '@/lib/tmdb';

/**
 * Sort providers by category priority:
 * 1. Streaming (flatrate) - highest priority
 * 2. Rent
 * 3. Buy
 */
export interface CategorizedProvider {
  provider: WatchProvider;
  category: 'Streaming' | 'Rent' | 'Buy';
}

export function getSortedProviders(
  flatrate?: WatchProvider[],
  rent?: WatchProvider[],
  buy?: WatchProvider[]
): CategorizedProvider[] {
  const result: CategorizedProvider[] = [];

  // Add streaming providers first
  if (flatrate?.length) {
    flatrate.forEach(provider => {
      result.push({ provider, category: 'Streaming' });
    });
  }

  // Add rent providers second
  if (rent?.length) {
    rent.forEach(provider => {
      // Skip if already in streaming
      if (!result.some(p => p.provider.provider_id === provider.provider_id)) {
        result.push({ provider, category: 'Rent' });
      }
    });
  }

  // Add buy providers last
  if (buy?.length) {
    buy.forEach(provider => {
      // Skip if already in streaming or rent
      if (!result.some(p => p.provider.provider_id === provider.provider_id)) {
        result.push({ provider, category: 'Buy' });
      }
    });
  }

  return result;
}

/**
 * Mobile deep link configurations for streaming services
 * Returns app deep link URL for mobile, null if not supported
 */
const mobileDeepLinks: Record<string, (title: string) => string | null> = {
  'netflix': (title) => `nflx://www.netflix.com/search?q=${encodeURIComponent(title)}`,
  'hulu': (title) => `hulu://search?query=${encodeURIComponent(title)}`,
  'disney plus': (title) => `disneyplus://search?q=${encodeURIComponent(title)}`,
  'disney+': (title) => `disneyplus://search?q=${encodeURIComponent(title)}`,
  'amazon prime video': (title) => `primevideo://search?phrase=${encodeURIComponent(title)}`,
  'prime video': (title) => `primevideo://search?phrase=${encodeURIComponent(title)}`,
  'hbo max': (title) => `hbomax://search?q=${encodeURIComponent(title)}`,
  'max': (title) => `max://search?q=${encodeURIComponent(title)}`,
  'apple tv': (title) => null, // Apple TV uses universal links
  'paramount plus': (title) => `paramountplus://search?query=${encodeURIComponent(title)}`,
  'paramount+': (title) => `paramountplus://search?query=${encodeURIComponent(title)}`,
  'peacock': (title) => `peacock://search?q=${encodeURIComponent(title)}`,
};

/**
 * Check if the current device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Get mobile deep link URL for a provider
 */
export function getMobileDeepLink(providerName: string, title: string): string | null {
  if (!isMobileDevice()) return null;

  const normalized = providerName.toLowerCase().trim();
  
  // Exact match first
  if (mobileDeepLinks[normalized]) {
    return mobileDeepLinks[normalized](title);
  }
  
  // Partial match
  for (const [key, urlFn] of Object.entries(mobileDeepLinks)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return urlFn(title);
    }
  }
  
  return null;
}

/**
 * Attempt to open a mobile deep link with web fallback
 * Returns true if deep link was attempted
 */
export function openWithDeepLink(
  providerName: string,
  title: string,
  webFallbackUrl: string
): void {
  const deepLink = getMobileDeepLink(providerName, title);
  
  if (!deepLink) {
    // Not on mobile or provider doesn't support deep links
    window.open(webFallbackUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  // Try deep link first, with web fallback after timeout
  const timeout = setTimeout(() => {
    window.open(webFallbackUrl, '_blank', 'noopener,noreferrer');
  }, 500);

  // Attempt deep link
  window.location.href = deepLink;
  
  // If app opens, clear the timeout
  window.addEventListener('blur', () => clearTimeout(timeout), { once: true });
}
