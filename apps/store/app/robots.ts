import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// AI answer-engine crawlers, listed explicitly (rather than left to the "*"
// catch-all) so the GEO intent is visible in the source: we want to be
// citable in AI Overviews/ChatGPT/Perplexity, not just indexed by Google.
const AI_CRAWLER_USER_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "PerplexityBot",
  "ClaudeBot",
  "Google-Extended",
  "CCBot",
  "Applebot-Extended",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/account"] },
      ...AI_CRAWLER_USER_AGENTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: ["/account"],
      })),
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
