import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { ApiError } from "@unstucklabs/sdk";
import { getApiClient } from "../../../lib/api";

interface Props {
  params: Promise<{ slug: string }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function resolveCoverUrl(url: string): string {
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}

async function getPost(slug: string) {
  try {
    const { post } = await getApiClient().blog.get(slug);
    return post;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  const title = post.seoTitle ?? post.title;
  const description = post.seoDescription ?? post.excerpt;

  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      images: post.coverImageUrl ? [resolveCoverUrl(post.coverImageUrl)] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.coverImageUrl ? [resolveCoverUrl(post.coverImageUrl)] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-2xl px-6 py-16">
      {post.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolveCoverUrl(post.coverImageUrl)}
          alt={post.title}
          className="mb-8 h-64 w-full rounded-xl object-cover sm:h-96"
        />
      )}
      <h1 className="text-3xl font-bold text-foreground">{post.title}</h1>
      {post.publishedAt && (
        <time dateTime={post.publishedAt} className="mt-2 block text-sm text-foreground/50">
          {new Date(post.publishedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
      )}
      <div className="prose prose-neutral mt-8 max-w-none prose-headings:font-bold prose-a:text-primary">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>
    </article>
  );
}
