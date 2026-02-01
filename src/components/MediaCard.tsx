import { Link } from "react-router-dom";
import { Play, Star } from "lucide-react";
import { getImageUrl } from "@/lib/tmdb";

interface MediaCardProps {
  id: number;
  title: string;
  posterPath: string | null;
  voteAverage: number;
  releaseDate: string;
  overview: string;
  mediaType: "movie" | "tv";
}

const MediaCard = ({
  id,
  title,
  posterPath,
  voteAverage,
  releaseDate,
  overview,
  mediaType,
}: MediaCardProps) => {
  const posterUrl = getImageUrl(posterPath, "w342");
  const year = releaseDate ? new Date(releaseDate).getFullYear() : "N/A";
  const linkPath = mediaType === "movie" ? `/movie/${id}` : `/tv/${id}`;
  const rating = voteAverage > 0 ? voteAverage.toFixed(1) : "N/A";
  
  // Truncate overview for card display
  const truncatedOverview = overview && overview.length > 100 
    ? overview.substring(0, 100) + "..." 
    : overview;

  return (
    <Link 
      to={linkPath} 
      className="content-card group block transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-xl"
    >
      <div className="aspect-[2/3] relative overflow-hidden rounded-t-xl">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/50 text-muted-foreground">
            No Poster
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-7 h-7 text-primary-foreground ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <span className="streaming-badge text-xs">
            {mediaType === "movie" ? "Movie" : "TV"}
          </span>
        </div>

        {/* Rating */}
        {rating !== "N/A" && (
          <div className="absolute top-2 right-2 flex items-center gap-1 streaming-badge text-xs">
            <Star className="w-3 h-3 text-primary" fill="currentColor" />
            <span className="text-foreground font-medium">{rating}</span>
          </div>
        )}
      </div>

      <div className="p-3 bg-card rounded-b-xl">
        <h3 className="font-display font-semibold text-foreground truncate text-sm group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground mb-2">{year}</p>
        
        {truncatedOverview && (
          <p className="text-xs text-muted-foreground/80 line-clamp-2">
            {truncatedOverview}
          </p>
        )}
      </div>
    </Link>
  );
};

export default MediaCard;
