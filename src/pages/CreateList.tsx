import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Loader2, Search, X, Film, Tv2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { tmdbFetch, getImageUrl, TMDBSearchResponse } from "@/lib/tmdb";
import { toast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";

interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  media_type: "movie" | "tv";
}

interface ListItem {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  media_type: string;
}

const CreateList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [items, setItems] = useState<ListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 60)
      + "-" + Date.now().toString(36);
  };

  const searchTitles = async () => {
    if (searchQuery.trim().length < 2) return;
    setSearching(true);
    try {
      const data = await tmdbFetch<TMDBSearchResponse<SearchResult>>("/search/multi", {
        query: searchQuery.trim(),
        page: "1",
        include_adult: "false",
      });
      setSearchResults(
        data.results
          .filter((r) => r.media_type === "movie" || r.media_type === "tv")
          .slice(0, 8)
      );
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const addItem = (result: SearchResult) => {
    if (items.some((i) => i.tmdb_id === result.id && i.media_type === result.media_type)) return;
    setItems([
      ...items,
      {
        tmdb_id: result.id,
        title: result.title || result.name || "",
        poster_path: result.poster_path,
        media_type: result.media_type,
      },
    ]);
    setSearchResults([]);
    setSearchQuery("");
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!user || !title.trim()) return;
    setSaving(true);

    try {
      const slug = generateSlug(title);
      const { data: list, error: listError } = await supabase
        .from("user_lists")
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          slug,
          is_public: isPublic,
        })
        .select()
        .single();

      if (listError) throw listError;

      if (items.length > 0) {
        const listItems = items.map((item, index) => ({
          list_id: list.id,
          tmdb_id: item.tmdb_id,
          media_type: item.media_type,
          title: item.title,
          poster_path: item.poster_path,
          position: index,
        }));

        const { error: itemsError } = await supabase.from("list_items").insert(listItems);
        if (itemsError) throw itemsError;
      }

      toast({ title: "List created!" });
      navigate(`/list/${slug}`);
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to create list", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">Create a List</h1>

        <div className="space-y-6">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Top 10 Comedies"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="desc">Description (optional)</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="My favorite comedies of all time"
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
            <Label htmlFor="public" className="cursor-pointer">
              Make this list public
            </Label>
          </div>

          {/* Add titles */}
          <div>
            <Label>Add titles</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchTitles())}
                placeholder="Search for a movie or show..."
              />
              <Button variant="outline" onClick={searchTitles} disabled={searching}>
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="mt-2 border border-border rounded-xl overflow-hidden bg-card">
                {searchResults.map((r) => (
                  <button
                    key={`${r.media_type}-${r.id}`}
                    onClick={() => addItem(r)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left"
                  >
                    {r.poster_path ? (
                      <img src={getImageUrl(r.poster_path, "w92")!} alt="" className="w-8 h-12 rounded object-cover" />
                    ) : (
                      <div className="w-8 h-12 rounded bg-secondary flex items-center justify-center">
                        {r.media_type === "movie" ? <Film className="w-4 h-4 text-muted-foreground" /> : <Tv2 className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    )}
                    <span className="text-sm font-medium text-foreground">{r.title || r.name}</span>
                    <Badge variant="secondary" className="text-[10px] ml-auto">
                      {r.media_type === "movie" ? "Movie" : "TV"}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Added items */}
          {items.length > 0 && (
            <div>
              <Label className="mb-2 block">{items.length} title{items.length !== 1 ? "s" : ""} added</Label>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={`${item.media_type}-${item.tmdb_id}`} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30">
                    <span className="text-xs text-muted-foreground w-5 text-center">{i + 1}</span>
                    {item.poster_path ? (
                      <img src={getImageUrl(item.poster_path, "w92")!} alt="" className="w-8 h-12 rounded object-cover" />
                    ) : (
                      <div className="w-8 h-12 rounded bg-secondary" />
                    )}
                    <span className="flex-1 text-sm font-medium text-foreground truncate">{item.title}</span>
                    <button onClick={() => removeItem(i)} className="p-1 text-muted-foreground hover:text-destructive">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            variant="hero"
            size="lg"
            className="w-full"
            disabled={!title.trim() || saving}
            onClick={handleSave}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Create List
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CreateList;
