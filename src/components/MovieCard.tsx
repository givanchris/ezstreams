import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { TMDBMovie, getImageUrl } from "@/lib/tmdb";

interface MovieCardProps {
  movie: TMDBMovie;
}

const MovieCard = ({ movie }: MovieCardProps) => {
  const posterUrl = getImageUrl(movie.poster_path, "w342");
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null;

  return (
    <Link
      to={`/movie/${movie.id}`}
      className="group glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)]"
    >
      <div className="aspect-[2/3] relative overflow-hidden bg-secondary/50">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No Poster
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {movie.title}
        </h3>
        
        <div className="flex items-center justify-between text-sm">
          {year && (
            <span className="text-muted-foreground">{year}</span>
          )}
          {movie.vote_average > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-primary fill-primary" />
              <span className="text-foreground">{movie.vote_average.toFixed(1)}</span>
            </div>
          )}
        </div>
        
        {movie.overview && (
          <p className="text-muted-foreground text-xs line-clamp-2">
            {movie.overview}
          </p>
        )}
      </div>
    </Link>
  );
};

export default MovieCard;
