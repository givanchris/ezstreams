import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Zap, BarChart3, Clock, Heart, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";

const PRICE_OPTIONS = [
  { label: "$2/mo", amount: 2, priceId: "price_1T84lwPBtt1ZFWAGZGu2hGJD" },
  { label: "$5/mo", amount: 5, priceId: "price_1T84mEPBtt1ZFWAGUBqqcyhd" },
  { label: "$10/mo", amount: 10, priceId: "price_1T84mUPBtt1ZFWAGRo1xmglT" },
  { label: "$20/mo", amount: 20, priceId: "price_1T84mkPBtt1ZFWAGR8s75Xy4" },
];

const BENEFITS = [
  { icon: Sparkles, text: "Unlimited advanced filtering" },
  { icon: BarChart3, text: "Smart Savings Analyzer insights" },
  { icon: Zap, text: "Faster decision tools & recommendations" },
  { icon: Clock, text: "Early access to new features" },
  { icon: Heart, text: "Support the development of EZstream" },
];

const Upgrade = () => {
  const { user, session } = useAuth();
  const { subscribed } = useSubscription();
  const navigate = useNavigate();
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-foreground mb-4">Upgrade to EZstream Pro</h1>
        <p className="text-muted-foreground mb-6">Log in to upgrade your account.</p>
        <Button asChild><Link to="/login">Log In</Link></Button>
      </div>
    );
  }

  if (subscribed) {
    return (
      <div className="min-h-screen px-6 py-24">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-accent" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">You're an EZstream Pro member!</h1>
          <p className="text-muted-foreground mb-6">Thank you for supporting EZstream. Manage your subscription from your profile.</p>
          <Button asChild><Link to="/profile">Go to Profile</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  const handleCheckout = async () => {
    let priceId = selectedPrice;

    if (useCustom) {
      const amt = parseFloat(customAmount);
      if (isNaN(amt) || amt < 1) {
        toast({ title: "Minimum amount is $1/month", variant: "destructive" });
        return;
      }
      // For custom amounts, use closest tier or $2 tier as fallback
      const closest = PRICE_OPTIONS.reduce((prev, curr) =>
        Math.abs(curr.amount - amt) < Math.abs(prev.amount - amt) ? curr : prev
      );
      priceId = closest.priceId;
    }

    if (!priceId) {
      toast({ title: "Please select an amount", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast({ title: "Checkout failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-24">
      <div className="hero-glow top-0 left-1/4 animate-pulse-glow" />
      <div className="max-w-2xl mx-auto relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="text-center mb-12 animate-fade-up">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            <span className="text-gradient">Pay What You Think Is Fair</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            EZstream saves you time and money by helping you decide what to watch faster and optimize your streaming subscriptions. Pay whatever you think the service is worth.
          </p>
        </div>

        {/* Benefits */}
        <div className="glass-card rounded-2xl p-8 mb-8 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="font-display text-xl font-semibold text-foreground mb-6">EZstream Pro includes:</h2>
          <div className="space-y-4">
            {BENEFITS.map((b, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <b.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-foreground">{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Price selection */}
        <div className="glass-card rounded-2xl p-8 animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <h2 className="font-display text-xl font-semibold text-foreground mb-6">Choose your amount</h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {PRICE_OPTIONS.map((opt) => (
              <button
                key={opt.priceId}
                onClick={() => { setSelectedPrice(opt.priceId); setUseCustom(false); }}
                className={`p-4 rounded-xl border-2 text-center font-semibold transition-all ${
                  selectedPrice === opt.priceId && !useCustom
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary/30 text-foreground hover:border-primary/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <button
              onClick={() => setUseCustom(true)}
              className={`text-sm mb-2 ${useCustom ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"}`}
            >
              Or enter a custom amount
            </button>
            {useCustom && (
              <div className="flex items-center gap-2">
                <span className="text-foreground font-semibold">$</span>
                <Input
                  type="number"
                  min="1"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-32"
                />
                <span className="text-muted-foreground text-sm">/ month</span>
              </div>
            )}
          </div>

          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={handleCheckout}
            disabled={loading || (!selectedPrice && !useCustom)}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Heart className="w-5 h-5 mr-2" />}
            Support EZstream
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Minimum $1/month · Cancel anytime · Secure payment via Stripe
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Upgrade;
