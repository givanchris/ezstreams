import { ExternalLink, LogIn } from "lucide-react";
import { WatchProvider, getImageUrl } from "@/lib/tmdb";
import { Button } from "@/components/ui/button";
import { isAmazonProvider, getAffiliateUrl } from "@/lib/amazon-affiliate";
import { getProviderOutboundUrl, getProviderSignInUrl } from "@/lib/provider-links";
import { openWithDeepLink, isMobileDevice } from "@/lib/provider-utils";

interface ProviderButtonProps {
  provider: WatchProvider;
  category: "Streaming" | "Rent" | "Buy";
  movieTitle: string;
  movieYear?: string;
  tmdbLink?: string;
}

const categoryColors = {
  Streaming: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Rent: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Buy: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const categoryLabels = {
  Streaming: "Free with subscription",
  Rent: "Rent",
  Buy: "Buy",
};

const ProviderButton = ({ provider, category, movieTitle, movieYear, tmdbLink }: ProviderButtonProps) => {
  const logoUrl = getImageUrl(provider.logo_path, "w92");
  const signInUrl = getProviderSignInUrl(provider.provider_name);
  
  // Determine the outbound URL based on provider type
  const getOutboundUrl = (): string => {
    // For Amazon providers, apply affiliate tagging logic
    if (isAmazonProvider(provider.provider_name)) {
      return getAffiliateUrl(provider.provider_name, tmdbLink, movieTitle, movieYear);
    }
    
    // For all other providers (Netflix, Hulu, Max, etc.), use provider link handler
    // This will use TMDB link if available, or fall back to provider search URL
    return getProviderOutboundUrl(provider.provider_name, tmdbLink, movieTitle, movieYear);
  };

  const handleClick = () => {
    const outboundUrl = getOutboundUrl();
    
    // On mobile, try deep link first with web fallback
    if (isMobileDevice()) {
      openWithDeepLink(provider.provider_name, movieTitle, outboundUrl);
    } else {
      // Desktop: open in new tab
      window.open(outboundUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSignInClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent button click
    if (signInUrl) {
      window.open(signInUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Show "Free with subscription" for streaming category
  const displayLabel = category === "Streaming" ? categoryLabels.Streaming : category;

  return (
    <Button
      variant="glass"
      className="h-auto p-3 flex items-center gap-3 justify-start group"
      onClick={handleClick}
    >
      {logoUrl && (
        <img
          src={logoUrl}
          alt={provider.provider_name}
          className="w-10 h-10 rounded-lg object-cover"
        />
      )}
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground text-sm">{provider.provider_name}</p>
          {signInUrl && (
            <button
              onClick={handleSignInClick}
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              title={`Sign in to ${provider.provider_name}`}
            >
              <LogIn className="w-3 h-3" />
              Sign in
            </button>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColors[category]}`}>
          {displayLabel}
        </span>
      </div>
      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </Button>
  );
};

export default ProviderButton;
