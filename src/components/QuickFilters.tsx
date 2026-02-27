import { Clock, Star, TrendingUp, Tv2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type QuickFilter = "under2h" | "highlyRated" | "trending" | "mySubscriptions";

interface QuickFiltersProps {
  active: QuickFilter[];
  onToggle: (filter: QuickFilter) => void;
}

const filters: { id: QuickFilter; label: string; icon: React.ElementType }[] = [
  { id: "under2h", label: "Under 2 Hours", icon: Clock },
  { id: "highlyRated", label: "Highly Rated (7.5+)", icon: Star },
  { id: "trending", label: "Trending Now", icon: TrendingUp },
  { id: "mySubscriptions", label: "Only My Subscriptions", icon: Tv2 },
];

const QuickFilters = ({ active, onToggle }: QuickFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground mr-1">Find Faster:</span>
      {filters.map((f) => {
        const isActive = active.includes(f.id);
        return (
          <button
            key={f.id}
            onClick={() => onToggle(f.id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
            )}
          >
            <f.icon className="w-3.5 h-3.5" />
            {f.label}
          </button>
        );
      })}
    </div>
  );
};

export default QuickFilters;
