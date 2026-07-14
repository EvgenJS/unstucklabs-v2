import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { ApiError } from "@unstucklabs/sdk";
import { getApiClient } from "../../../lib/api";

interface Props {
  params: Promise<{ slug: string }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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

  const postJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription ?? post.excerpt,
    // Google requires an image for BlogPosting rich results -- fall back to
    // the site hero shot (1376x768, well above the 696px-wide minimum) when
    // a post has no cover of its own.
    image: [post.coverImageUrl ? resolveCoverUrl(post.coverImageUrl) : `${siteUrl}/hero-focus.jpg`],
    datePublished: post.publishedAt ?? undefined,
    // UnstuckLabs is one person, not a company (see /about) -- attribute
    // posts to them directly rather than a generic Organization author.
    author: { "@type": "Person", name: "Yevhen Spatar" },
    publisher: {
      "@type": "Organization",
      name: "UnstuckLabs",
      logo: { "@type": "ImageObject", url: `${siteUrl}/icon.svg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${siteUrl}/blog/${post.slug}` },
  };

  return (
    <article className="mx-auto max-w-2xl px-6 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(postJsonLd) }} />
      {post.coverImageUrl && (
        <div className="relative mb-8 h-64 w-full overflow-hidden rounded-xl sm:h-96">
          <Image
            src={resolveCoverUrl(post.coverImageUrl)}
            alt={post.title}
            fill
            sizes="(min-width: 672px) 672px, 100vw"
            className="object-cover"
            priority
          />
        </div>
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
