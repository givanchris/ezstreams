import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Zap, BarChart3, Clock, Heart, Loader2, Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";

const PRO_PRICE_ID = "price_1T84mEPBtt1ZFWAGUBqqcyhd"; // $5/mo

const BENEFITS = [
  { icon: Sparkles, text: "Unlimited advanced filtering" },
  { icon: BarChart3, text: "Full Smart Savings Analyzer insights" },
  { icon: Zap, text: "Faster decision tools & recommendations" },
  { icon: Clock, text: "Early access to new features" },
  { icon: Heart, text: "Support the development of EZstream" },
];

const Upgrade = () => {
  const { user, session } = useAuth();
  const { subscribed } = useSubscription();
  const navigate = useNavigate();
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
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: PRO_PRICE_ID },
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
            <span className="text-gradient">EZstream Pro</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Unlock the full power of EZstream — advanced savings insights, unlimited filters, and more.
          </p>
        </div>

        {/* Benefits */}
        <div className="glass-card rounded-2xl p-8 mb-8 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="font-display text-xl font-semibold text-foreground mb-6">Everything in Pro:</h2>
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
          <p className="text-4xl font-bold text-foreground mb-1">
            $5<span className="text-lg font-normal text-muted-foreground">/month</span>
          </p>
          <p className="text-sm text-muted-foreground mb-6">Cancel anytime</p>

          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Crown className="w-5 h-5 mr-2" />}
            Upgrade to EZstream Pro
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            Secure payment via Stripe
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Upgrade;
