import { getApiClient } from "../../lib/api";
import { getAllPublishedPosts } from "../../lib/blog";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// llms.txt (llmstxt.org convention) -- a content map for AI crawlers/agents,
// separate from robots.txt (crawl permissions) and sitemap.xml (all URLs).
// Kept as a route handler rather than a static public/ file so the domain
// tracks NEXT_PUBLIC_SITE_URL the same way robots.ts and sitemap.ts do, and
// so individual app/blog links stay in sync with the catalog automatically.
async function buildLlmsTxt(): Promise<string> {
  const { products } = await getApiClient()
    .products.list()
    .catch(() => ({ products: [] }));
  const posts = await getAllPublishedPosts().catch(() => []);

  const appLines = products
    .filter((product) => product.isActive)
    .map((product) => `- [${product.name}](${siteUrl}/apps/${product.slug})${product.tagline ? `: ${product.tagline}` : ""}`)
    .join("\n");

  const postLines = posts
    .map((post) => `- [${post.title}](${siteUrl}/blog/${post.slug}): ${post.excerpt}`)
    .join("\n");

  return `# UnstuckLabs

> Small, focused productivity and wellness tools sold as individual mini-app PWAs, each on its own subdomain. Built for the moment before a to-do list helps -- when a task is too big or vague to even start. Every app is priced and sold on its own; there is no bundle.

## Apps
- [Browse all apps](${siteUrl}/apps): Catalog of every UnstuckLabs tool, with pricing.
${appLines}

## About
- [About](${siteUrl}/about): Why UnstuckLabs exists and who's behind it.
- [FAQ](${siteUrl}/faq): Common questions about pricing, subscriptions, and how the apps work.
- [Contact](${siteUrl}/contact): How to get in touch.

## Blog
- [Blog](${siteUrl}/blog): Notes on productivity, task paralysis, and building small tools.
${postLines}

## Policies
- [Refund Policy](${siteUrl}/legal/refund-policy)
- [Terms of Service](${siteUrl}/legal/terms)
- [Privacy Policy](${siteUrl}/legal/privacy)
`;
}

export async function GET() {
  return new Response(await buildLlmsTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
