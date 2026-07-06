import type { MetadataRoute } from "next";
import { getAllPublishedPosts } from "../lib/blog";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const staticRoutes = [
  "",
  "/apps",
  "/blog",
  "/faq",
  "/about",
  "/contact",
  "/legal/terms",
  "/legal/privacy",
  "/legal/refund-policy",
  "/legal/shipping-policy",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPublishedPosts().catch(() => []);

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: `${siteUrl}${path}`,
  }));

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: post.publishedAt ?? undefined,
  }));

  return [...staticEntries, ...postEntries];
}
