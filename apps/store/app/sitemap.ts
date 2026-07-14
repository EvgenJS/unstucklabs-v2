import type { MetadataRoute } from "next";
import { getAllPublishedPosts } from "../lib/blog";
import { getApiClient } from "../lib/api";

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
  const { products } = await getApiClient()
    .products.list()
    .catch(() => ({ products: [] }));

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: `${siteUrl}${path}`,
  }));

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: post.publishedAt ?? undefined,
  }));

  const productEntries: MetadataRoute.Sitemap = products
    .filter((product) => product.isActive)
    .map((product) => ({
      url: `${siteUrl}/apps/${product.slug}`,
      lastModified: product.updatedAt,
    }));

  return [...staticEntries, ...postEntries, ...productEntries];
}
