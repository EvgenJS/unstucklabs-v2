import { apiRequest, type ApiClientConfig } from "../client";
import type { BlogPost, BlogPostSummary } from "../types";

export function createBlogModule(config: ApiClientConfig) {
  return {
    list(params: { page?: number; pageSize?: number } = {}) {
      const query = new URLSearchParams();
      if (params.page) query.set("page", String(params.page));
      if (params.pageSize) query.set("pageSize", String(params.pageSize));
      const qs = query.toString();

      return apiRequest<{ posts: BlogPostSummary[]; page: number; pageSize: number; total: number }>(
        config,
        `/blog/posts${qs ? `?${qs}` : ""}`
      );
    },

    get(slug: string) {
      return apiRequest<{ post: BlogPost }>(config, `/blog/posts/${slug}`);
    },
  };
}
