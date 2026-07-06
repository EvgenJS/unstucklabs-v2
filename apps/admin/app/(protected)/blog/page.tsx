"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "@unstucklabs/ui";
import type { BlogPost, BlogPostInput } from "@unstucklabs/sdk";
import { useAuth } from "../../../lib/auth-context";
import { getApiClient } from "../../../lib/api";
import { BlogPostForm } from "../../../components/BlogPostForm";

export default function BlogPage() {
  const { accessToken, user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[] | null>(null);
  const [editing, setEditing] = useState<BlogPost | "new" | null>(null);
  const [forbidden, setForbidden] = useState(false);

  // Mirrors core-api's requireRole("OWNER", "EDITOR") gate on blog write
  // routes -- server-side is the real enforcement, this just hides the
  // affordance for SUPPORT users.
  const canEdit = user?.roles?.some((r) => r === "OWNER" || r === "EDITOR");

  async function refresh() {
    if (!accessToken) return;
    try {
      const { posts } = await getApiClient(accessToken).blog.admin.list();
      setPosts(posts);
    } catch {
      // Blog admin routes have no SUPPORT read access -- the Sidebar hides
      // this link for SUPPORT-only users, but handle a direct link too.
      setForbidden(true);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function handleCreate(input: BlogPostInput) {
    if (!accessToken) return;
    await getApiClient(accessToken).blog.admin.create(input);
    setEditing(null);
    await refresh();
  }

  async function handleUpdate(id: string, input: BlogPostInput) {
    if (!accessToken) return;
    await getApiClient(accessToken).blog.admin.update(id, input);
    setEditing(null);
    await refresh();
  }

  async function togglePublish(post: BlogPost) {
    if (!accessToken) return;
    const nextStatus = post.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    await getApiClient(accessToken).blog.admin.update(post.id, {
      status: nextStatus,
      publishedAt: nextStatus === "PUBLISHED" ? new Date().toISOString() : undefined,
    });
    await refresh();
  }

  async function handleDelete(id: string) {
    if (!accessToken) return;
    if (!confirm("Delete this post? This cannot be undone.")) return;
    await getApiClient(accessToken).blog.admin.remove(id);
    await refresh();
  }

  if (forbidden) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-foreground">Blog</h1>
        <p className="mt-4 text-foreground/70">You don&apos;t have access to view blog posts.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Blog</h1>
        {canEdit && editing === null && <Button onClick={() => setEditing("new")}>New post</Button>}
      </div>

      {editing === "new" && (
        <div className="mt-6">
          <BlogPostForm onSubmit={handleCreate} onCancel={() => setEditing(null)} />
        </div>
      )}
      {editing && editing !== "new" && (
        <div className="mt-6">
          <BlogPostForm
            initial={editing}
            onSubmit={(input) => handleUpdate(editing.id, input)}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {posts === null ? (
          <p className="text-foreground/70">Loading…</p>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">
                  {post.title}{" "}
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                      post.status === "PUBLISHED" ? "bg-primary/10 text-primary" : "bg-muted text-foreground/60"
                    }`}
                  >
                    {post.status}
                  </span>
                </p>
                <p className="text-sm text-foreground/70">{post.slug}</p>
              </div>
              {canEdit && (
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setEditing(post)}>
                    Edit
                  </Button>
                  <Button variant="secondary" onClick={() => togglePublish(post)}>
                    {post.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                  </Button>
                  <Button variant="secondary" onClick={() => handleDelete(post.id)}>
                    Delete
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
