import { ExternalLink } from "lucide-react";
import { WatchProvider, getImageUrl, getProviderUrl } from "@/lib/tmdb";
import { Button } from "@/components/ui/button";

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
  const providerUrl = getProviderUrl(provider.provider_name, movieTitle, movieYear);

  const handleClick = () => {
    // Prefer TMDB's link if available, otherwise use our provider URL
    window.open(tmdbLink || providerUrl, '_blank', 'noopener,noreferrer');
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
