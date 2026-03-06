import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, LogOut, Home, Mail, Calendar, List, Plus, Edit2, Check, X, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";

const Profile = () => {
  const { user, session, signOut } = useAuth();
  const { subscribed, subscriptionEnd, priceAmount, loading: subLoading, checkSubscription } = useSubscription();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: myLists } = useQuery({
    queryKey: ["my-lists", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_lists")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (profile?.username) setNewUsername(profile.username);
  }, [profile?.username]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: "Could not open portal", description: err.message, variant: "destructive" });
    } finally {
      setPortalLoading(false);
    }
  };

  const saveUsername = async () => {
    if (!user || !newUsername.trim()) return;
    const { error } = await supabase
      .from("profiles")
      .update({ username: newUsername.trim().toLowerCase() })
      .eq("user_id", user.id);
    if (error) {
      toast({ title: "Username taken or invalid", variant: "destructive" });
    } else {
      toast({ title: "Username updated!" });
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      setEditingUsername(false);
    }
  };

  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen px-6 py-24">
      <div className="hero-glow top-0 left-1/4 animate-pulse-glow" />
      <div className="hero-glow bottom-0 right-1/4 animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="text-center mb-12 animate-fade-up">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center mx-auto mb-6">
            <User className="w-12 h-12 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            <span className="text-gradient">Profile</span>
          </h1>
          {profile?.username && (
            <Link to={`/user/${profile.username}`} className="text-sm text-primary hover:underline">
              View public profile →
            </Link>
          )}
        </div>

        {/* Profile info card */}
        <div className="glass-card rounded-2xl p-8 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="font-display text-xl font-semibold text-foreground mb-6">
            Account Information
          </h2>

          <div className="space-y-4">
            {/* Username */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Username</p>
                {editingUsername ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <button onClick={saveUsername} className="text-primary"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setEditingUsername(false)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{profile?.username || "Not set"}</p>
                    <button onClick={() => setEditingUsername(true)} className="text-muted-foreground hover:text-foreground">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{user?.email || "Not available"}</p>
              </div>
            </div>

            {createdAt && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Member since</p>
                  <p className="font-medium text-foreground">{createdAt}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Subscription */}
        <div className="glass-card rounded-2xl p-8 mt-6 animate-fade-up" style={{ animationDelay: "0.12s" }}>
          <h2 className="font-display text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5" /> EZstream Pro
          </h2>
          {subscribed ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-accent/10 border border-accent/30">
                <Check className="w-5 h-5 text-accent" />
                <div>
                  <p className="font-medium text-foreground">Active — ${priceAmount ? (priceAmount / 100).toFixed(0) : "?"}/month</p>
                  {subscriptionEnd && (
                    <p className="text-sm text-muted-foreground">
                      Next billing: {new Date(subscriptionEnd).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={portalLoading}>
                {portalLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Manage Subscription
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-muted-foreground text-sm mb-4">Unlock unlimited features by supporting EZstream.</p>
              <Button variant="hero" size="sm" asChild>
                <Link to="/upgrade">Upgrade to Pro</Link>
              </Button>
            </div>
          )}
        </div>

        {/* My Lists */}
        <div className="glass-card rounded-2xl p-8 mt-6 animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
              <List className="w-5 h-5" /> My Lists
            </h2>
            <Button variant="outline" size="sm" asChild>
              <Link to="/create-list">
                <Plus className="w-4 h-4 mr-1" /> New List
              </Link>
            </Button>
          </div>
          {!myLists || myLists.length === 0 ? (
            <p className="text-muted-foreground text-sm">No lists yet. Create your first list!</p>
          ) : (
            <div className="space-y-2">
              {myLists.map((list) => (
                <Link
                  key={list.id}
                  to={`/list/${list.slug}`}
                  className="block p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <p className="font-medium text-foreground text-sm">{list.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {list.is_public ? "Public" : "Private"} · {new Date(list.created_at).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <Button variant="outline" size="lg" className="flex-1" asChild>
            <Link to="/">
              <Home className="w-5 h-5 mr-2" />
              Back to Home
            </Link>
          </Button>
          <Button
            variant="destructive"
            size="lg"
            className="flex-1"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
