import type { MetadataRoute } from "next";

// The root layout already sets `robots: { index: false, follow: false }`,
// but that meta tag only takes effect after a page is fetched -- it doesn't
// stop crawling itself. This blocks crawling outright for anything that
// respects robots.txt (Admin is internal/role-gated; there's no benefit to
// any crawler requesting it pre- or post-launch).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
