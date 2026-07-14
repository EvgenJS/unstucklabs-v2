// Strips common Markdown syntax down to plain text for places that need a
// clean, quotable string (JSON-LD `description`/`headline` fields) rather
// than the formatted version ReactMarkdown renders on the page itself.
export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n{2,}/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// Meta descriptions/OG descriptions should be short, plain-text, and not
// truncated mid-word by consuming platforms -- do it ourselves instead.
export function toMetaDescription(markdown: string, maxLength = 160): string {
  const plain = stripMarkdown(markdown);
  if (plain.length <= maxLength) return plain;
  const truncated = plain.slice(0, maxLength - 1);
  return `${truncated.slice(0, truncated.lastIndexOf(" "))}…`;
}
