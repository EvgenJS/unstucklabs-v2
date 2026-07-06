import type { BlogPostSummary } from "@unstucklabs/sdk";
import { getApiClient } from "./api";

const MAX_PAGE_SIZE = 50;

// Used by sitemap.ts and the RSS feed, which both need every published post,
// not just one page of it. Loops pages rather than assuming everything fits
// in one request, so this keeps working once the blog grows past 50 posts.
export async function getAllPublishedPosts(): Promise<BlogPostSummary[]> {
  const api = getApiClient();
  const all: BlogPostSummary[] = [];
  let page = 1;

  while (true) {
    const { posts, total } = await api.blog.list({ page, pageSize: MAX_PAGE_SIZE });
    all.push(...posts);
    if (all.length >= total || posts.length === 0) break;
    page += 1;
  }

  return all;
}
