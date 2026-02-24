import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";

const PROVIDERS = [
  { id: "netflix", name: "Netflix", color: "#E50914" },
  { id: "disney_plus", name: "Disney+", color: "#113CCF" },
  { id: "prime_video", name: "Prime Video", color: "#00A8E1" },
  { id: "max", name: "Max", color: "#5822B4" },
  { id: "hulu", name: "Hulu", color: "#1CE783" },
  { id: "apple_tv", name: "Apple TV+", color: "#555555" },
  { id: "paramount_plus", name: "Paramount+", color: "#0064FF" },
  { id: "peacock", name: "Peacock", color: "#000000" },
];

const Subscriptions = () => {
  const { user } = useAuth();
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Load user preferences from localStorage (simple approach)
  useEffect(() => {
    const saved = localStorage.getItem(`ezstream_subs_${user?.id}`);
    if (saved) {
      try {
        setOwned(new Set(JSON.parse(saved)));
      } catch {
        // ignore
      }
    }
  }, [user?.id]);

  const toggleProvider = (id: string) => {
    setOwned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      // Persist
      localStorage.setItem(`ezstream_subs_${user?.id}`, JSON.stringify([...next]));
      return next;
    });
  };

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <h1 className="font-display text-4xl font-bold text-foreground mb-2">
          Manage <span className="text-gradient">Subscriptions</span>
        </h1>
        <p className="text-muted-foreground mb-8">
          Toggle the streaming services you currently subscribe to
        </p>

        <div className="grid gap-3">
          {PROVIDERS.map((provider) => {
            const isOwned = owned.has(provider.id);
            return (
              <button
                key={provider.id}
                onClick={() => toggleProvider(provider.id)}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  isOwned
                    ? "bg-accent/10 border-accent/40"
                    : "bg-secondary/30 border-border hover:bg-secondary/50"
                }`}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                  style={{ backgroundColor: provider.color }}
                >
                  {provider.name.charAt(0)}
                </div>
                <span className="flex-1 text-left font-medium text-foreground">{provider.name}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isOwned ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"
                }`}>
                  {isOwned ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Subscriptions;
