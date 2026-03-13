import { Link } from "react-router-dom";
import { Lock, BarChart3, Zap, TrendingDown } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BENEFITS = [
  { icon: TrendingDown, text: "Which subscriptions you can cancel" },
  { icon: BarChart3, text: "Overlapping streaming services" },
  { icon: Zap, text: "Optimized streaming plan & estimated savings" },
];

const UpgradeModal = ({ open, onOpenChange }: UpgradeModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <DialogTitle className="font-display text-2xl text-center">
            Unlock Your Full Streaming Savings
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            EZstream Pro analyzes your subscriptions and shows exactly where
            you're overspending.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-4">
          {BENEFITS.map((b, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <b.icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-foreground">{b.text}</span>
            </div>
          ))}
        </div>

        <div className="text-center mb-2">
          <p className="text-2xl font-bold text-foreground">
            $10<span className="text-sm font-normal text-muted-foreground">/month</span>
          </p>
        </div>

        <Button variant="hero" size="lg" className="w-full" asChild>
          <Link to="/upgrade" onClick={() => onOpenChange(false)}>
            Upgrade to EZstream Pro
          </Link>
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-1">
          Cancel anytime · Secure payment via Stripe
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
