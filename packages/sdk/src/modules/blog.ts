import { apiRequest, apiUpload, type ApiClientConfig } from "../client";
import type { BlogPost, BlogPostSummary } from "../types";

export interface BlogPostInput {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
}

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

    admin: {
      list() {
        return apiRequest<{ posts: BlogPost[] }>(config, "/admin/blog/posts");
      },

      create(input: BlogPostInput) {
        return apiRequest<{ post: BlogPost }>(config, "/admin/blog/posts", {
          method: "POST",
          body: JSON.stringify(input),
        });
      },

      update(id: string, input: Partial<BlogPostInput> & { status?: "DRAFT" | "PUBLISHED"; publishedAt?: string }) {
        return apiRequest<{ post: BlogPost }>(config, `/admin/blog/posts/${id}`, {
          method: "PATCH",
          body: JSON.stringify(input),
        });
      },

      remove(id: string) {
        return apiRequest<void>(config, `/admin/blog/posts/${id}`, { method: "DELETE" });
      },

      uploadCover(id: string, file: File) {
        return apiUpload<{ post: BlogPost }>(config, `/admin/blog/posts/${id}/cover`, file);
      },

      deleteCover(id: string) {
        return apiRequest<{ post: BlogPost }>(config, `/admin/blog/posts/${id}/cover`, { method: "DELETE" });
      },
    },
  };
}
