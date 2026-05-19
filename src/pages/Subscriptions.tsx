import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, X, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAvailableProviders } from "@/hooks/useAvailableProviders";
import Footer from "@/components/Footer";

const Subscriptions = () => {
  const { user } = useAuth();
  const [owned, setOwned] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const { data: providers = [], isLoading } = useAvailableProviders();

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

  const toggleProvider = (id: number) => {
    setOwned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
        <p className="text-muted-foreground mb-6">
          Toggle the streaming services you currently subscribe to
        </p>

        {/* Search */}
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary/50"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-secondary/30 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3">
            {providers.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase())).map((provider) => {
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
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-secondary/50 shrink-0 flex items-center justify-center">
                    {provider.logoUrl ? (
                      <img src={provider.logoUrl} alt={provider.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-foreground">{provider.name.charAt(0)}</span>
                    )}
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
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Subscriptions;
