/**
 * Amazon Associates affiliate link helpers
 * 
 * These functions handle adding affiliate tags to Amazon URLs
 * and creating Amazon search fallback URLs.
 */

// Allowed Amazon domains for tagging
const AMAZON_DOMAINS = [
  'amazon.com',
  'www.amazon.com',
  'smile.amazon.com',
];

// The affiliate tag from environment (edge function will inject it)
const AMAZON_ASSOCIATE_TAG = 'ezstream05-20';

/**
 * Check if a hostname is an allowed Amazon domain
 */
function isAmazonDomain(hostname: string): boolean {
  const normalizedHostname = hostname.toLowerCase();
  return AMAZON_DOMAINS.some(domain => 
    normalizedHostname === domain || normalizedHostname.endsWith(`.${domain}`)
  );
}

/**
 * Apply Amazon affiliate tag to a URL if it's an Amazon domain
 * 
 * Rules:
 * - Only tag URLs with hostnames ending in amazon.com, www.amazon.com, or smile.amazon.com
 * - If tag= param exists, replace it
 * - Otherwise append it with proper ? or & delimiter
 * - Returns unchanged URL for non-Amazon domains
 */
export function applyAmazonTag(url: string): string {
  try {
    const parsedUrl = new URL(url);
    
    // Check if it's an Amazon domain
    if (!isAmazonDomain(parsedUrl.hostname)) {
      return url;
    }
    
    // Add or replace the tag parameter
    parsedUrl.searchParams.set('tag', AMAZON_ASSOCIATE_TAG);
    
    // Dev-only logging
    if (import.meta.env.DEV) {
      console.log('Amazon affiliate tag applied');
    }
    
    return parsedUrl.toString();
  } catch {
    // If URL parsing fails, return unchanged
    return url;
  }
}

/**
 * Build an Amazon search URL with affiliate tag
 * 
 * Used as a fallback when a provider is Amazon/Prime Video
 * but the provided link is not an Amazon domain (or missing)
 */
export function buildAmazonSearchUrl(title: string, year?: string | number): string {
  const searchQuery = year ? `${title} ${year}`.trim() : title.trim();
  const encodedQuery = encodeURIComponent(searchQuery);
  
  // Dev-only logging
  if (import.meta.env.DEV) {
    console.log('Amazon search fallback used');
  }
  
  return `https://www.amazon.com/s?k=${encodedQuery}&tag=${AMAZON_ASSOCIATE_TAG}`;
}

/**
 * Check if a provider name indicates Amazon/Prime Video
 */
export function isAmazonProvider(providerName: string): boolean {
  const normalized = providerName.toLowerCase();
  return normalized.includes('amazon') || normalized.includes('prime');
}

/**
 * Get the appropriate URL for a provider, applying Amazon tagging logic
 * 
 * For Amazon/Prime Video providers:
 * - If outbound link exists and is Amazon domain → apply tag
 * - Otherwise → use Amazon search fallback
 * 
 * For other providers:
 * - Return the original URL unchanged
 */
export function getAffiliateUrl(
  providerName: string,
  outboundUrl: string | undefined,
  mediaTitle: string,
  mediaYear?: string
): string {
  if (!isAmazonProvider(providerName)) {
    return outboundUrl || '';
  }
  
  // It's an Amazon provider
  if (outboundUrl) {
    try {
      const parsedUrl = new URL(outboundUrl);
      if (isAmazonDomain(parsedUrl.hostname)) {
        return applyAmazonTag(outboundUrl);
      }
    } catch {
      // URL parsing failed, use fallback
    }
  }
  
  // Use Amazon search fallback
  return buildAmazonSearchUrl(mediaTitle, mediaYear);
}
