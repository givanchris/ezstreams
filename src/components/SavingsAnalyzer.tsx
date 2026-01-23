import { TrendingDown, TrendingUp, AlertTriangle, Check, DollarSign } from "lucide-react";
import { Button } from "./ui/button";

interface PlatformUsage {
  id: string;
  name: string;
  logo: string;
  color: string;
  monthlyPrice: number;
  usagePercent: number;
  showsWatched: number;
  recommendation: "keep" | "consider" | "cancel";
}

interface SavingsAnalyzerProps {
  platforms: PlatformUsage[];
}

const SavingsAnalyzer = ({ platforms }: SavingsAnalyzerProps) => {
  const totalMonthly = platforms.reduce((sum, p) => sum + p.monthlyPrice, 0);
  const potentialSavings = platforms
    .filter((p) => p.recommendation === "cancel")
    .reduce((sum, p) => sum + p.monthlyPrice, 0);

  const getRecommendationStyles = (rec: "keep" | "consider" | "cancel") => {
    switch (rec) {
      case "keep":
        return {
          bg: "bg-accent/20",
          border: "border-accent/50",
          text: "text-accent",
          icon: Check,
          label: "Keep",
        };
      case "consider":
        return {
          bg: "bg-yellow-500/20",
          border: "border-yellow-500/50",
          text: "text-yellow-400",
          icon: AlertTriangle,
          label: "Consider",
        };
      case "cancel":
        return {
          bg: "bg-destructive/20",
          border: "border-destructive/50",
          text: "text-destructive",
          icon: TrendingDown,
          label: "Cancel",
        };
    }
  };

  return (
    <div className="glass-card rounded-3xl p-8">
      {/* Header Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h3 className="font-display text-2xl font-bold text-foreground mb-2">
            Smart Savings Analyzer
          </h3>
          <p className="text-muted-foreground">
            Based on your viewing habits, here's how to optimize your subscriptions
          </p>
        </div>
        
        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Current Spend</p>
            <p className="font-display text-2xl font-bold text-foreground">
              ${totalMonthly.toFixed(2)}<span className="text-sm font-normal text-muted-foreground">/mo</span>
            </p>
          </div>
          {potentialSavings > 0 && (
            <div className="text-center pl-6 border-l border-border">
              <p className="text-sm text-muted-foreground mb-1">You Could Save</p>
              <p className="font-display text-2xl font-bold text-accent">
                ${potentialSavings.toFixed(2)}<span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Platform Analysis */}
      <div className="space-y-4">
        {platforms
          .sort((a, b) => b.usagePercent - a.usagePercent)
          .map((platform) => {
            const styles = getRecommendationStyles(platform.recommendation);
            const Icon = styles.icon;

            return (
              <div
                key={platform.id}
                className={`relative p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.01] ${styles.bg} ${styles.border}`}
              >
                <div className="flex items-center gap-4">
                  {/* Platform Logo */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shrink-0"
                    style={{ backgroundColor: platform.color }}
                  >
                    {platform.logo}
                  </div>

                  {/* Platform Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-display font-semibold text-foreground">
                        {platform.name}
                      </h4>
                      <span className="text-sm text-muted-foreground">
                        ${platform.monthlyPrice}/mo
                      </span>
                    </div>

                    {/* Usage Bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${platform.usagePercent}%`,
                            backgroundColor: platform.color,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground w-12 text-right">
                        {platform.usagePercent}%
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mt-1">
                      {platform.showsWatched} shows watched this month
                    </p>
                  </div>

                  {/* Recommendation Badge */}
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-full ${styles.bg} border ${styles.border}`}
                  >
                    <Icon className={`w-4 h-4 ${styles.text}`} />
                    <span className={`text-sm font-semibold ${styles.text}`}>
                      {styles.label}
                    </span>
                  </div>
                </div>

                {/* Recommendation Message */}
                {platform.recommendation === "cancel" && (
                  <p className="mt-3 text-sm text-muted-foreground pl-16">
                    💡 You only use {platform.usagePercent}% of this service. Consider canceling to save ${platform.monthlyPrice}/month.
                  </p>
                )}
                {platform.recommendation === "consider" && (
                  <p className="mt-3 text-sm text-muted-foreground pl-16">
                    🤔 Moderate usage. Check if your favorite shows are available elsewhere.
                  </p>
                )}
                {platform.recommendation === "keep" && platform.usagePercent >= 50 && (
                  <p className="mt-3 text-sm text-muted-foreground pl-16">
                    ✨ Great value! You're getting the most out of this subscription.
                  </p>
                )}
              </div>
            );
          })}
      </div>

      {/* Action */}
      {potentialSavings > 0 && (
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/30">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="font-display font-semibold text-foreground">
                  Save ${(potentialSavings * 12).toFixed(0)} per year
                </p>
                <p className="text-sm text-muted-foreground">
                  By canceling underused subscriptions
                </p>
              </div>
            </div>
            <Button variant="hero">
              <TrendingUp className="w-4 h-4 mr-2" />
              Optimize Subscriptions
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingsAnalyzer;
