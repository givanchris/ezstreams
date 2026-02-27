import { Smile, Timer, Flame, Users, Award } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MoodPreset {
  label: string;
  icon: React.ElementType;
  genre?: string;
  under2h?: boolean;
  sort?: string;
}

export const MOOD_PRESETS: MoodPreset[] = [
  { label: "Something funny", icon: Smile, genre: "35" },
  { label: "Something quick", icon: Timer, under2h: true },
  { label: "Something intense", icon: Flame, genre: "53,28" },
  { label: "Family friendly", icon: Users, genre: "16,10751" },
  { label: "Critically acclaimed", icon: Award, sort: "vote_average.desc" },
];

interface MoodChipsProps {
  onSelect: (preset: MoodPreset) => void;
}

const MoodChips = ({ onSelect }: MoodChipsProps) => {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">
        What are you in the mood for?
      </p>
      <div className="flex flex-wrap gap-2">
        {MOOD_PRESETS.map((mood) => (
          <button
            key={mood.label}
            onClick={() => onSelect(mood)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium",
              "bg-secondary/50 text-muted-foreground border border-border",
              "hover:border-primary/50 hover:text-foreground hover:bg-secondary transition-colors"
            )}
          >
            <mood.icon className="w-3.5 h-3.5" />
            {mood.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MoodChips;
