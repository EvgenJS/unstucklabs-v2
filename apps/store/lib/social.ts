export interface SocialLink {
  name: "Threads" | "X" | "TikTok" | "Instagram" | "YouTube";
  href: string;
}

// Fill in each real profile URL once the account exists -- an empty href
// means "not live yet." Both the Footer icon row and the Organization
// JSON-LD `sameAs` list (see app/layout.tsx) read this same array and skip
// anything empty, so there's nothing else to wire up when these are filled
// in. Deliberately not pre-filled with guessed/reserved-but-unclaimed URLs --
// a sameAs pointing at a profile that doesn't exist is worse than no
// sameAs at all (see docs/ROADMAP.md's SEO/GEO section).
export const socialLinks: SocialLink[] = [
  { name: "Threads", href: "" },
  { name: "X", href: "" },
  { name: "TikTok", href: "" },
  { name: "Instagram", href: "" },
  { name: "YouTube", href: "" },
];

export function getActiveSocialLinks(): SocialLink[] {
  return socialLinks.filter((link) => link.href.length > 0);
}
