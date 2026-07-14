import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getApiClient } from "../../lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function resolveCoverUrl(url: string): string {
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  return {
    title: "Blog",
    description: "Notes on productivity, task paralysis, and building small tools that actually help.",
    alternates: { canonical: page > 1 ? `/blog?page=${page}` : "/blog" },
  };
}

export default async function BlogPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const { posts, total, pageSize } = await getApiClient().blog.list({ page });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-foreground">Blog</h1>

      {posts.length === 0 ? (
        <p className="mt-10 text-foreground/70">No posts yet — check back soon.</p>
      ) : (
        <div className="mt-10 space-y-10">
          {posts.map((post) => (
            <article key={post.id}>
              <Link href={`/blog/${post.slug}`}>
                {post.coverImageUrl && (
                  <div className="relative mb-3 h-48 w-full overflow-hidden rounded-xl">
                    <Image
                      src={resolveCoverUrl(post.coverImageUrl)}
                      alt={post.title}
                      fill
                      sizes="(min-width: 768px) 768px, 100vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <h2 className="text-xl font-semibold text-foreground hover:text-primary">{post.title}</h2>
              </Link>
              <p className="mt-2 text-foreground/70">{post.excerpt}</p>
              {post.publishedAt && (
                <time dateTime={post.publishedAt} className="mt-2 block text-sm text-foreground/50">
                  {new Date(post.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              )}
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-12 flex justify-between text-sm font-medium">
          {page > 1 ? (
            <Link href={`/blog?page=${page - 1}`} className="text-primary hover:text-primary/80">
              ← Newer posts
            </Link>
          ) : (
            <span />
          )}
          {page < totalPages && (
            <Link href={`/blog?page=${page + 1}`} className="text-primary hover:text-primary/80">
              Older posts →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
