import { Check, AlertCircle, Plus, Loader2, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CoverageResult } from "@/hooks/useWatchlistCoverage";

interface WatchlistCoverageProps {
  coverage: CoverageResult;
  totalItems: number;
}

const WatchlistCoverage = ({ coverage, totalItems }: WatchlistCoverageProps) => {
  if (totalItems === 0) return null;

  if (coverage.loading) {
    return (
      <div className="glass-card rounded-2xl p-6 mb-8 flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-muted-foreground text-sm">Analyzing coverage…</span>
      </div>
    );
  }

  const hasNoServices = coverage.score === 0 && coverage.missingItems.length === totalItems && !coverage.bestServiceToAdd;

  return (
    <div className="glass-card rounded-2xl p-6 mb-8 space-y-5 animate-fade-up">
      {/* Score Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg font-semibold text-foreground">
            Coverage Score
          </h3>
          {hasNoServices ? (
            <p className="text-sm text-muted-foreground">
              Select your streaming services in{" "}
              <Link to="/subscriptions" className="text-primary hover:underline">Subscriptions</Link>
              {" "}to see your coverage.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Your watchlist is <span className="text-foreground font-medium">{coverage.score}%</span> covered by your current subscriptions.
            </p>
          )}
        </div>
      </div>

      {!hasNoServices && (
        <>
          {/* Progress bar */}
          <Progress value={coverage.score} className="h-3" />

          {/* Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
              <div className="flex items-center gap-2 mb-1">
                <Check className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-foreground">Available</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{coverage.coveredItems.length}</p>
              <p className="text-xs text-muted-foreground">titles on your services</p>
            </div>
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm font-medium text-foreground">Missing</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{coverage.missingItems.length}</p>
              <p className="text-xs text-muted-foreground">not on your services</p>
            </div>
          </div>

          {/* Recommendation */}
          {coverage.bestServiceToAdd && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <Plus className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Recommendation</span>
              </div>
              <p className="text-sm text-muted-foreground">
                If you add <span className="text-foreground font-medium">{coverage.bestServiceToAdd.name}</span>,
                your coverage increases to{" "}
                <span className="text-primary font-semibold">{coverage.bestServiceToAdd.newScore}%</span>
                {" "}({coverage.bestServiceToAdd.additionalTitles} additional title{coverage.bestServiceToAdd.additionalTitles !== 1 ? "s" : ""}).
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WatchlistCoverage;
