import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { User, List, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/Footer";

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["public-profile", username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });

  const { data: lists, isLoading: loadingLists } = useQuery({
    queryKey: ["public-lists", profile?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_lists")
        .select("*")
        .eq("user_id", profile!.user_id)
        .eq("is_public", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.user_id,
  });

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-foreground">User not found</h1>
        <p className="text-muted-foreground mt-2">This profile doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-24">
      <div className="max-w-4xl mx-auto">
        {/* Profile header */}
        <div className="text-center mb-12 animate-fade-up">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center mx-auto mb-4">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-primary-foreground" />
            )}
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            {profile.display_name || profile.username}
          </h1>
          {profile.bio && (
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">{profile.bio}</p>
          )}
        </div>

        {/* Public lists */}
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <List className="w-5 h-5" />
            Public Lists
          </h2>
          {loadingLists ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : !lists || lists.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <p className="text-muted-foreground">No public lists yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {lists.map((list) => (
                <Link
                  key={list.id}
                  to={`/list/${list.slug}`}
                  className="glass-card rounded-xl p-5 hover:border-primary/50 transition-colors block"
                >
                  <h3 className="font-semibold text-foreground mb-1">{list.title}</h3>
                  {list.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{list.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(list.created_at).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PublicProfile;
