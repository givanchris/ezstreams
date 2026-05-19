import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const SITE_URL = "https://givanchris.github.io/ezstreams";

const staticPages = [
  { loc: "/", priority: "1.0", changefreq: "daily" },
  { loc: "/search", priority: "0.8", changefreq: "daily" },
  { loc: "/movies", priority: "0.8", changefreq: "daily" },
  { loc: "/series", priority: "0.8", changefreq: "daily" },
];

const genrePages = [
  "comedy", "horror", "action", "drama", "thriller",
  "sci-fi", "romance", "animation", "documentary",
];

async function fetchTmdbIds(endpoint: string, apiKey: string, isBearer: boolean): Promise<number[]> {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (isBearer) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  } else {
    url.searchParams.set("api_key", apiKey);
  }

  const ids: number[] = [];
  for (let page = 1; page <= 2; page++) {
    url.searchParams.set("page", String(page));
    try {
      const res = await fetch(url.toString(), { headers });
      if (res.ok) {
        const data = await res.json();
        for (const item of data.results ?? []) {
          if (item.id && !ids.includes(item.id)) ids.push(item.id);
        }
      }
    } catch {
      // skip on error
    }
  }
  return ids;
}

serve(async () => {
  try {
    const apiKey = Deno.env.get("TMDB_API_KEY") ?? "";
    if (!apiKey) {
      return new Response("TMDB_API_KEY not configured", { status: 500 });
    }

    const isBearer = apiKey.startsWith("eyJ") || (apiKey.match(/\./g)?.length ?? 0) === 2;
    const today = new Date().toISOString().split("T")[0];

    const [popularMovies, trendingMovies, popularTv, trendingTv] = await Promise.all([
      fetchTmdbIds("/movie/popular", apiKey, isBearer),
      fetchTmdbIds("/trending/movie/week", apiKey, isBearer),
      fetchTmdbIds("/tv/popular", apiKey, isBearer),
      fetchTmdbIds("/trending/tv/week", apiKey, isBearer),
    ]);

    const movieIds = [...new Set([...popularMovies, ...trendingMovies])];
    const tvIds = [...new Set([...popularTv, ...trendingTv])];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages
    for (const page of staticPages) {
      xml += `  <url>\n    <loc>${SITE_URL}${page.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
    }

    // Genre pages
    for (const slug of genrePages) {
      xml += `  <url>\n    <loc>${SITE_URL}/genre/${slug}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    }

    // Movie detail pages
    for (const id of movieIds) {
      xml += `  <url>\n    <loc>${SITE_URL}/movie/${id}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    }

    // TV detail pages
    for (const id of tvIds) {
      xml += `  <url>\n    <loc>${SITE_URL}/tv/${id}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    }

    xml += `</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response("Error generating sitemap", { status: 500 });
  }
});
