import { useState } from "react";
import { TrendingDown, TrendingUp, AlertTriangle, Check, RotateCcw, Loader2, BarChart3 } from "lucide-react";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProviderTracking } from "@/hooks/useProviderTracking";
import { useAuth } from "@/contexts/AuthContext";

const REGIONS = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "IN", name: "India" },
];

// Known provider colors for visual consistency
const PROVIDER_COLORS: Record<string, string> = {
  "Netflix": "#E50914",
  "Disney Plus": "#113CCF",
  "Disney+": "#113CCF",
  "Amazon Prime Video": "#00A8E1",
  "Prime Video": "#00A8E1",
  "Max": "#5822B4",
  "HBO Max": "#5822B4",
  "Hulu": "#1CE783",
  "Apple TV Plus": "#555555",
  "Apple TV+": "#555555",
  "Paramount Plus": "#0064FF",
  "Paramount+": "#0064FF",
  "Peacock": "#000000",
  "Peacock Premium": "#000000",
};

function getProviderColor(name: string): string {
  return PROVIDER_COLORS[name] || "#6B7280";
}

function getRecommendation(percent: number): "keep" | "consider" | "cancel" {
  if (percent >= 50) return "keep";
  if (percent >= 20) return "consider";
  return "cancel";
}

const recStyles = {
  keep: {
    bg: "bg-accent/20",
    border: "border-accent/50",
    text: "text-accent",
    icon: Check,
    label: "High Coverage",
  },
  consider: {
    bg: "bg-yellow-500/20",
    border: "border-yellow-500/50",
    text: "text-yellow-400",
    icon: AlertTriangle,
    label: "Moderate",
  },
  cancel: {
    bg: "bg-destructive/20",
    border: "border-destructive/50",
    text: "text-destructive",
    icon: TrendingDown,
    label: "Low Coverage",
  },
};

const SavingsAnalyzer = () => {
  const { user } = useAuth();
  const [region, setRegion] = useState("US");
  const { stats, resetStats } = useProviderTracking(region);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    await resetStats();
    setResetting(false);
  };

  // Sort providers by coverage desc
  const sortedProviders = Object.entries(stats.providerCounts)
    .map(([name, count]) => ({
      name,
      count,
      percent: stats.totalTitles > 0 ? Math.round((count / stats.totalTitles) * 100) : 0,
    }))
    .sort((a, b) => b.percent - a.percent);

  if (!user) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center">
        <BarChart3 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="font-display text-2xl font-bold text-foreground mb-2">
          Smart Savings Analyzer
        </h3>
        <p className="text-muted-foreground">
          Sign in and browse titles to see which streaming services cover the most content you care about.
        </p>
      </div>
    );
  }

  if (stats.loading) {
    return (
      <div className="glass-card rounded-3xl p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h3 className="font-display text-2xl font-bold text-foreground mb-2">
            Smart Savings Analyzer
          </h3>
          <p className="text-muted-foreground">
            Coverage based on {stats.totalTitles} title{stats.totalTitles !== 1 ? "s" : ""} you've explored
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-[160px] bg-secondary/50 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((r) => (
                <SelectItem key={r.code} value={r.code}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={resetting || stats.totalTitles === 0}
          >
            {resetting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            <span className="ml-2 hidden sm:inline">Reset</span>
          </Button>
        </div>
      </div>

      {stats.totalTitles === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">No data yet</p>
          <p className="text-muted-foreground/70 text-sm mt-2">
            Search for movies and TV shows to see which streaming services cover them via flatrate subscriptions.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedProviders.map((provider) => {
            const rec = getRecommendation(provider.percent);
            const styles = recStyles[rec];
            const Icon = styles.icon;
            const color = getProviderColor(provider.name);

            return (
              <div
                key={provider.name}
                className={`relative p-5 rounded-2xl border transition-all duration-300 ${styles.bg} ${styles.border}`}
              >
                <div className="flex items-center gap-4">
                  {/* Provider logo placeholder */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 text-white"
                    style={{ backgroundColor: color }}
                  >
                    {provider.name.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-display font-semibold text-foreground">
                        {provider.name}
                      </h4>
                    </div>

                    {/* Coverage bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${provider.percent}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground w-12 text-right">
                        {provider.percent}%
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground mt-1">
                      {provider.count} of {stats.totalTitles} searched titles available
                    </p>
                  </div>

                  {/* Recommendation badge */}
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-full ${styles.bg} border ${styles.border}`}
                  >
                    <Icon className={`w-4 h-4 ${styles.text}`} />
                    <span className={`text-sm font-semibold ${styles.text}`}>
                      {styles.label}
                    </span>
                  </div>
                </div>

                {rec === "cancel" && (
                  <p className="mt-3 text-sm text-muted-foreground pl-16">
                    💡 Only {provider.percent}% of your searched titles are available here via subscription.
                  </p>
                )}
                {rec === "consider" && (
                  <p className="mt-3 text-sm text-muted-foreground pl-16">
                    🤔 Moderate coverage. Check if your must-watch titles are available elsewhere.
                  </p>
                )}
                {rec === "keep" && (
                  <p className="mt-3 text-sm text-muted-foreground pl-16">
                    ✨ Great coverage! This service has most of the titles you're interested in.
                  </p>
                )}
              </div>
            );
          })}

          {sortedProviders.length > 0 && (
            <div className="mt-6 p-6 rounded-2xl bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="font-display font-semibold text-foreground">
                    Top pick: {sortedProviders[0].name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Covers {sortedProviders[0].percent}% of the titles you've explored
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SavingsAnalyzer;
