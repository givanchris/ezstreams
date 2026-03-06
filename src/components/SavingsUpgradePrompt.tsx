import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, X, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";
import { useSubscription } from "@/contexts/SubscriptionContext";

const DISMISS_KEY = "ezstream_upgrade_prompt_dismissed";
const DISMISS_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface Props {
  potentialSavings?: number; // dollar amount
}

const SavingsUpgradePrompt = ({ potentialSavings }: Props) => {
  const { subscribed } = useSubscription();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const last = localStorage.getItem(DISMISS_KEY);
    if (last) {
      const elapsed = Date.now() - parseInt(last, 10);
      setDismissed(elapsed < DISMISS_INTERVAL_MS);
    } else {
      setDismissed(false);
    }
  }, []);

  if (subscribed || dismissed || !potentialSavings || potentialSavings <= 0) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setDismissed(true);
  };

  return (
    <div className="mt-6 p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 relative animate-fade-up">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <TrendingUp className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h4 className="font-display font-semibold text-foreground mb-1">
            You could save ${potentialSavings}/month
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            EZstream helps you discover what to watch faster and optimize your streaming subscriptions. If EZstream saved you time or money, support the platform by paying what you think is fair.
          </p>
          <div className="flex items-center gap-3">
            <Button variant="hero" size="sm" asChild>
              <Link to="/upgrade">
                <Heart className="w-4 h-4 mr-1" /> Support EZstream
              </Link>
            </Button>
            <button onClick={handleDismiss} className="text-sm text-muted-foreground hover:text-foreground">
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavingsUpgradePrompt;
