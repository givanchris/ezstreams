/**
 * Lightweight natural language query parser.
 * Converts phrases like "short comedies on netflix" into structured filters.
 */

export interface ParsedQuery {
  /** Remaining text query after extracting NLP tokens */
  textQuery: string;
  /** Detected genre IDs (comma-separated) */
  genre?: string;
  /** Max runtime in minutes */
  maxRuntime?: number;
  /** Detected provider name */
  provider?: string;
  /** Sort preference */
  sort?: string;
  /** Human-readable label for the parsed intent */
  label?: string;
}

const GENRE_KEYWORDS: Record<string, string> = {
  comedy: "35",
  comedies: "35",
  funny: "35",
  humor: "35",
  action: "28",
  drama: "18",
  horror: "27",
  scary: "27",
  thriller: "53",
  suspense: "53",
  intense: "53,28",
  romance: "10749",
  romantic: "10749",
  romcom: "35,10749",
  "rom-com": "35,10749",
  animation: "16",
  animated: "16",
  cartoon: "16",
  documentary: "99",
  "sci-fi": "878",
  scifi: "878",
  "science fiction": "878",
  fantasy: "14",
  mystery: "9648",
  crime: "80",
  western: "37",
  war: "10752",
  family: "10751",
  kids: "16,10751",
  "family friendly": "10751,16",
  musical: "10402",
  history: "36",
  historical: "36",
};

const PROVIDER_KEYWORDS: Record<string, string> = {
  netflix: "Netflix",
  hulu: "Hulu",
  "disney+": "Disney Plus",
  "disney plus": "Disney Plus",
  disney: "Disney Plus",
  hbo: "Max",
  "hbo max": "Max",
  max: "Max",
  prime: "Amazon Prime Video",
  "prime video": "Amazon Prime Video",
  amazon: "Amazon Prime Video",
  "apple tv": "Apple TV Plus",
  "apple tv+": "Apple TV Plus",
  apple: "Apple TV Plus",
  peacock: "Peacock",
  paramount: "Paramount Plus",
  "paramount+": "Paramount Plus",
};

const RUNTIME_PATTERNS: { pattern: RegExp; minutes: number }[] = [
  { pattern: /under\s+(\d+)\s*min(ute)?s?/i, minutes: 0 }, // dynamic
  { pattern: /less\s+than\s+(\d+)\s*min(ute)?s?/i, minutes: 0 },
  { pattern: /(\d+)\s*min(ute)?s?\s+or\s+less/i, minutes: 0 },
  { pattern: /\bshort\b/i, minutes: 120 },
  { pattern: /\bquick\b/i, minutes: 120 },
  { pattern: /under\s+2\s*h(ou)?rs?/i, minutes: 120 },
  { pattern: /under\s+90\s*min(ute)?s?/i, minutes: 90 },
  { pattern: /under\s+(\d+)\s*h(ou)?rs?/i, minutes: 0 }, // dynamic hours
];

const SORT_KEYWORDS: Record<string, string> = {
  "top rated": "vote_average.desc",
  "highest rated": "vote_average.desc",
  "best rated": "vote_average.desc",
  trending: "popularity.desc",
  popular: "popularity.desc",
  newest: "primary_release_date.desc",
  latest: "primary_release_date.desc",
  recent: "primary_release_date.desc",
  new: "primary_release_date.desc",
};

export function parseNaturalLanguageQuery(raw: string): ParsedQuery {
  let text = raw.trim().toLowerCase();
  const result: ParsedQuery = { textQuery: "" };
  const labelParts: string[] = [];

  // 1. Extract runtime patterns (dynamic minutes)
  for (const { pattern, minutes } of RUNTIME_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      if (minutes > 0) {
        result.maxRuntime = minutes;
      } else if (match[1]) {
        const num = parseInt(match[1]);
        // Check if this is hours or minutes
        if (pattern.source.includes("h(ou)?r")) {
          result.maxRuntime = num * 60;
        } else {
          result.maxRuntime = num;
        }
      }
      text = text.replace(match[0], " ").trim();
      labelParts.push(
        result.maxRuntime! <= 120
          ? `Under ${result.maxRuntime} min`
          : `Under ${Math.round(result.maxRuntime! / 60)}h`
      );
      break;
    }
  }

  // 2. Extract provider (check multi-word first)
  const sortedProviders = Object.keys(PROVIDER_KEYWORDS).sort(
    (a, b) => b.length - a.length
  );
  for (const keyword of sortedProviders) {
    const regex = new RegExp(`\\bon\\s+${keyword.replace(/[+]/g, "\\+")}\\b`, "i");
    const regex2 = new RegExp(`\\b${keyword.replace(/[+]/g, "\\+")}\\b`, "i");
    const match = text.match(regex) || text.match(regex2);
    if (match) {
      result.provider = PROVIDER_KEYWORDS[keyword];
      text = text.replace(match[0], " ").trim();
      labelParts.push(`on ${result.provider}`);
      break;
    }
  }

  // 3. Extract sort keywords (check multi-word first)
  const sortedSortKeys = Object.keys(SORT_KEYWORDS).sort(
    (a, b) => b.length - a.length
  );
  for (const keyword of sortedSortKeys) {
    if (text.includes(keyword)) {
      result.sort = SORT_KEYWORDS[keyword];
      text = text.replace(keyword, " ").trim();
      labelParts.push(
        keyword.charAt(0).toUpperCase() + keyword.slice(1)
      );
      break;
    }
  }

  // 4. Extract genre keywords (check multi-word first)
  const sortedGenreKeys = Object.keys(GENRE_KEYWORDS).sort(
    (a, b) => b.length - a.length
  );
  for (const keyword of sortedGenreKeys) {
    const regex = new RegExp(`\\b${keyword.replace(/-/g, "[-\\s]?")}\\b`, "i");
    if (regex.test(text)) {
      result.genre = GENRE_KEYWORDS[keyword];
      text = text.replace(regex, " ").trim();
      labelParts.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      break;
    }
  }

  // 5. Clean up remaining text
  text = text
    .replace(/\b(show|find|get|me|movies?|shows?|tv|series|something|what's|what is|some)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  result.textQuery = text;

  if (labelParts.length > 0) {
    result.label = labelParts.join(" · ");
  }

  return result;
}

/** Returns true if the parser extracted any meaningful filters */
export function hasNLPFilters(parsed: ParsedQuery): boolean {
  return !!(parsed.genre || parsed.maxRuntime || parsed.provider || parsed.sort);
}
