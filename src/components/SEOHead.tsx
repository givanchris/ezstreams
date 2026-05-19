import { Helmet } from "react-helmet-async";

const SITE_URL = "https://givanchris.github.io/ezstreams";

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalPath: string;
  image?: string | null;
  jsonLd?: Record<string, unknown>;
}

const SEOHead = ({ title, description, canonicalPath, image, jsonLd }: SEOHeadProps) => {
  const canonical = `${SITE_URL}${canonicalPath}`;
  const ogImage = image || "https://lovable.dev/opengraph-image-p98pqg.png";

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
};

export default SEOHead;
