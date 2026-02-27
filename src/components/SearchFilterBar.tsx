import { useState, useEffect } from "react";
import { Filter } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { loadGenres } from "@/lib/genre-detection";

export interface SearchFilters {
  genre: string;
  sort: string;
  streamingOnly: boolean;
  under2h: boolean;
}

export const DEFAULT_FILTERS: SearchFilters = {
  genre: "",
  sort: "",
  streamingOnly: false,
  under2h: false,
};

interface SearchFilterBarProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
}

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "popularity.desc", label: "Popularity" },
  { value: "vote_average.desc", label: "Rating" },
  { value: "primary_release_date.desc", label: "Newest" },
];

const SearchFilterBar = ({ filters, onChange }: SearchFilterBarProps) => {
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    loadGenres().then((g) => {
      const uniqueGenres = new Map<string, number>();
      g.movie.forEach((id, name) => uniqueGenres.set(name, id));
      g.tv.forEach((id, name) => {
        if (!uniqueGenres.has(name)) uniqueGenres.set(name, id);
      });
      const sorted = Array.from(uniqueGenres.entries())
        .map(([name, id]) => ({
          id,
          name: name.charAt(0).toUpperCase() + name.slice(1),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setGenres(sorted);
    });
  }, []);

  const update = (partial: Partial<SearchFilters>) => {
    onChange({ ...filters, ...partial });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 py-2">
      <Filter className="w-4 h-4 text-muted-foreground shrink-0" />

      <Select
        value={filters.genre || "all"}
        onValueChange={(v) => update({ genre: v === "all" ? "" : v })}
      >
        <SelectTrigger className="w-[140px] h-8 text-xs bg-secondary/50 border-border">
          <SelectValue placeholder="Genre" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Genres</SelectItem>
          {genres.map((g) => (
            <SelectItem key={g.id} value={g.id.toString()}>
              {g.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.sort || "relevance"}
        onValueChange={(v) => update({ sort: v === "relevance" ? "" : v })}
      >
        <SelectTrigger className="w-[130px] h-8 text-xs bg-secondary/50 border-border">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1.5">
        <Switch
          id="streaming-filter"
          checked={filters.streamingOnly}
          onCheckedChange={(v) => update({ streamingOnly: v })}
          className="scale-75"
        />
        <Label
          htmlFor="streaming-filter"
          className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap"
        >
          Streaming only
        </Label>
      </div>

      <div className="flex items-center gap-1.5">
        <Switch
          id="under2h-filter"
          checked={filters.under2h}
          onCheckedChange={(v) => update({ under2h: v })}
          className="scale-75"
        />
        <Label
          htmlFor="under2h-filter"
          className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap"
        >
          Under 2h
        </Label>
      </div>
    </div>
  );
};

export default SearchFilterBar;
