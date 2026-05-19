import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, BarChart3, TrendingDown, DollarSign, Loader2, Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";

const PRICE_ID = import.meta.env.VITE_STRIPE_PRO_PRICE_ID as string;

const BENEFITS = [
  { icon: BarChart3, text: "Full Savings Analyzer — see every service ranked by cost-per-view" },
  { icon: TrendingDown, text: "Cancel recommendations — know exactly which subscriptions to cut" },
  { icon: DollarSign, text: "Cost-per-view breakdown — see what you're actually paying per title" },
  { icon: Sparkles, text: "Early access to new features" },
];

const Upgrade = () => {
  const { user, session } = useAuth();
  const { subscribed } = useSubscription();
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-foreground mb-4">Unlock EZstream Pro</h1>
        <p className="text-muted-foreground mb-6">Log in to unlock your savings analysis.</p>
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
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">You have EZstream Pro!</h1>
          <p className="text-muted-foreground mb-6">Your full savings analysis is unlocked. Check your profile for details.</p>
          <Button asChild><Link to="/profile">Go to Profile</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: PRICE_ID },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
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
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Unlock <span className="text-gradient">EZstream Pro</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            One-time purchase. Find out exactly which streaming subscriptions to cut — and save an average of $18/month.
          </p>
        </div>

        {/* Benefits */}
        <div className="glass-card rounded-2xl p-8 mb-8 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="font-display text-xl font-semibold text-foreground mb-6">What you unlock:</h2>
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

        {/* CTA */}
        <div className="glass-card rounded-2xl p-8 text-center animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <p className="text-5xl font-bold text-foreground mb-2">$4.99</p>
          <p className="text-muted-foreground mb-2">one-time purchase · no subscription</p>
          <p className="text-sm text-accent font-medium mb-6">Pays for itself the first time you cancel a service you don't need</p>

          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Crown className="w-5 h-5 mr-2" />}
            Unlock Pro — $4.99
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            Secure payment via Stripe · Instant access
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Upgrade;
