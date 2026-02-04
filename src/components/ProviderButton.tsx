import { ExternalLink } from "lucide-react";
import { WatchProvider, getImageUrl, getProviderUrl } from "@/lib/tmdb";
import { Button } from "@/components/ui/button";
import { isAmazonProvider, getAffiliateUrl } from "@/lib/amazon-affiliate";

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

const ProviderButton = ({ provider, category, movieTitle, movieYear, tmdbLink }: ProviderButtonProps) => {
  const logoUrl = getImageUrl(provider.logo_path, "w92");
  const fallbackProviderUrl = getProviderUrl(provider.provider_name, movieTitle, movieYear);
  
  // Determine the outbound URL with Amazon affiliate logic
  const getOutboundUrl = (): string => {
    const baseUrl = tmdbLink || fallbackProviderUrl;
    
    // For Amazon providers, apply affiliate tagging logic
    if (isAmazonProvider(provider.provider_name)) {
      return getAffiliateUrl(provider.provider_name, baseUrl, movieTitle, movieYear);
    }
    
    // For non-Amazon providers, use the original URL
    return baseUrl;
  };

  const handleClick = () => {
    const outboundUrl = getOutboundUrl();
    // All outbound links open in new tab with security attributes
    window.open(outboundUrl, '_blank', 'noopener,noreferrer');
  };

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
        <p className="font-medium text-foreground text-sm">{provider.provider_name}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColors[category]}`}>
          {category}
        </span>
      </div>
      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </Button>
  );
};

export default ProviderButton;
