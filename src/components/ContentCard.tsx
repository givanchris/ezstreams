import { Link } from "react-router-dom";
import { Play, Star } from "lucide-react";

interface ContentCardProps {
  title: string;
  image: string;
  rating: number;
  year: string;
  type: "movie" | "series";
  streamingServices: string[];
  id?: number;
}

const serviceColors: Record<string, string> = {
  Netflix: "#E50914",
  "Disney+": "#113CCF",
  "HBO Max": "#5822B4",
  "Prime Video": "#00A8E1",
  Hulu: "#1CE783",
  "Apple TV+": "#000000",
  Peacock: "#000000",
  Paramount: "#0064FF",
};

const ContentCard = ({
  title,
  image,
  rating,
  year,
  type,
  streamingServices,
  id,
}: ContentCardProps) => {
  // Generate a deterministic ID from title if none provided (for demo content)
  const contentId = id || Math.abs(title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
  const linkPath = type === "movie" ? `/movie/${contentId}` : `/tv/${contentId}`;

  return (
    <Link to={linkPath} className="content-card group block">
      <div className="aspect-[2/3] relative overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Type badge */}
        <div className="absolute top-3 left-3">
          <span className="streaming-badge">
            {type === "movie" ? "Movie" : "Series"}
          </span>
        </div>

        {/* Rating */}
        <div className="absolute top-3 right-3 flex items-center gap-1 streaming-badge">
          <Star className="w-3 h-3 text-primary" fill="currentColor" />
          <span className="text-foreground font-medium">{rating}</span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-display font-semibold text-foreground truncate mb-1 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">{year}</p>
        
        {/* Streaming services */}
        <div className="flex flex-wrap gap-2">
          {streamingServices.map((service) => (
            <span
              key={service}
              className="text-xs px-2 py-1 rounded-md font-medium"
              style={{
                backgroundColor: `${serviceColors[service]}20`,
                color: serviceColors[service] === "#000000" ? "hsl(var(--foreground))" : serviceColors[service],
                border: `1px solid ${serviceColors[service]}40`,
              }}
            >
              {service}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
};

export default ContentCard;
