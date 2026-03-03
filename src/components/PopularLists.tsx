import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { List, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const PopularLists = () => {
  const { data: lists, isLoading } = useQuery({
    queryKey: ["popular-lists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_lists")
        .select("id, title, description, slug, created_at, user_id")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-40" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!lists || lists.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
          <List className="w-5 h-5 text-primary" />
          Popular Lists
        </h2>
        <Link to="/lists" className="text-sm text-primary hover:underline flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lists.map((list) => (
          <Link
            key={list.id}
            to={`/list/${list.slug}`}
            className="glass-card rounded-xl p-5 hover:border-primary/50 transition-colors block"
          >
            <h3 className="font-semibold text-foreground mb-1 truncate">{list.title}</h3>
            {list.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{list.description}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PopularLists;
