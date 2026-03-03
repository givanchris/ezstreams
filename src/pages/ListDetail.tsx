import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import MediaCard from "@/components/MediaCard";
import ShareButton from "@/components/ShareButton";
import Footer from "@/components/Footer";

const ListDetail = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: list, isLoading: loadingList } = useQuery({
    queryKey: ["list-detail", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_lists")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: items, isLoading: loadingItems } = useQuery({
    queryKey: ["list-items", list?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("list_items")
        .select("*")
        .eq("list_id", list!.id)
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!list?.id,
  });

  // Fetch the list creator's profile
  const { data: creator } = useQuery({
    queryKey: ["list-creator", list?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, display_name")
        .eq("user_id", list!.user_id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!list?.user_id,
  });

  if (loadingList) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-foreground">List not found</h1>
        <p className="text-muted-foreground mt-2">This list doesn't exist or is private.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <Link
            to={creator?.username ? `/user/${creator.username}` : "/lists"}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                {list.title}
              </h1>
              {list.description && (
                <p className="text-muted-foreground mt-2 max-w-2xl">{list.description}</p>
              )}
              {creator && (
                <p className="text-sm text-muted-foreground mt-2">
                  by{" "}
                  <Link to={`/user/${creator.username}`} className="text-primary hover:underline">
                    {creator.display_name || creator.username}
                  </Link>
                </p>
              )}
            </div>
            <ShareButton url={`/list/${slug}`} title={list.title} />
          </div>
        </div>

        {/* Items */}
        {loadingItems ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !items || items.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <p className="text-muted-foreground">This list is empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-fade-up">
            {items.map((item) => (
              <MediaCard
                key={item.id}
                id={item.tmdb_id}
                title={item.title}
                posterPath={item.poster_path}
                voteAverage={0}
                releaseDate=""
                overview=""
                mediaType={item.media_type as "movie" | "tv"}
              />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ListDetail;
