import { useState, useEffect, useCallback } from "react";
import { Star, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Review {
  id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  display_name: string | null;
  created_at: string;
}

interface ReviewSectionProps {
  tmdbId: number;
  mediaType: "movie" | "tv";
}

const StarRating = ({ rating, onRate, interactive = false }: { rating: number; onRate?: (r: number) => void; interactive?: boolean }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => onRate?.(star)}
        >
          <Star
            className={`w-5 h-5 ${
              star <= (hover || rating)
                ? "text-primary fill-primary"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const ReviewSection = ({ tmdbId, mediaType }: ReviewSectionProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [displayName, setDisplayName] = useState("");

  const loadReviews = useCallback(async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType)
      .order("created_at", { ascending: false });

    if (!error && data) setReviews(data as Review[]);
    setLoading(false);
  }, [tmdbId, mediaType]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const userReview = reviews.find((r) => r.user_id === user?.id);
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const handleEdit = (review: Review) => {
    setEditingId(review.id);
    setRating(review.rating);
    setReviewText(review.review_text || "");
    setDisplayName(review.display_name || "");
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete review", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Review removed" });
      loadReviews();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || rating === 0) {
      toast({ title: "Rating required", description: "Please select a star rating", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from("reviews")
          .update({ rating, review_text: reviewText || null, display_name: displayName || null })
          .eq("id", editingId);
        if (error) throw error;
        toast({ title: "Updated", description: "Review updated" });
      } else {
        const { error } = await supabase.from("reviews").insert({
          user_id: user.id,
          tmdb_id: tmdbId,
          media_type: mediaType,
          rating,
          review_text: reviewText || null,
          display_name: displayName || null,
        });
        if (error) throw error;
        toast({ title: "Submitted", description: "Review added" });
      }
      resetForm();
      loadReviews();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setRating(0);
    setReviewText("");
    setDisplayName("");
  };

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            User <span className="text-gradient">Reviews</span>
          </h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={Math.round(avgRating)} />
              <span className="text-foreground font-medium">{avgRating.toFixed(1)}</span>
              <span className="text-muted-foreground text-sm">({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
            </div>
          )}
        </div>
        {user && !userReview && !showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            Write a Review
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showForm && user && (
        <form onSubmit={handleSubmit} className="mb-8 p-5 rounded-xl bg-secondary/30 border border-border space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Your Rating *</label>
            <StarRating rating={rating} onRate={setRating} interactive />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Display Name (optional)</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Anonymous"
              className="bg-secondary/50"
              maxLength={50}
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Review (optional)</label>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your thoughts..."
              className="bg-secondary/50"
              maxLength={2000}
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting || rating === 0} size="sm">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {editingId ? "Update" : "Submit"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={resetForm}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No reviews yet. {user ? "Be the first to review!" : "Log in to leave a review."}
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="p-4 rounded-xl bg-secondary/20 border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <StarRating rating={review.rating} />
                  <span className="text-sm font-medium text-foreground">
                    {review.display_name || "Anonymous"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                {user?.id === review.user_id && (
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(review)} className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(review.id)} className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              {review.review_text && (
                <p className="text-muted-foreground text-sm leading-relaxed">{review.review_text}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
