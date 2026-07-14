import { Instagram, X, Youtube } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import type { SocialLink } from "../lib/social";

function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.5 2h-3v13.5a3 3 0 1 1-2.5-2.96V9.4a6 6 0 1 0 5.5 5.98V9.1a7.6 7.6 0 0 0 4.5 1.46V7.56A4.5 4.5 0 0 1 16.5 3.1Z" />
    </svg>
  );
}

function ThreadsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 2C6.5 2 4 5.5 4 10.5v3c0 5 2.5 8.5 8 8.5s8-3.5 8-8.5c0-2-1-3.3-2.8-3.3-1.6 0-2.5.9-2.9 2-.1-1.6-1.2-2.6-2.8-2.6-1.7 0-2.8 1.1-2.8 2.6 0 1.7 1.3 2.7 3 2.7 2.3 0 3.9-1.5 4.3-3.4"
      />
    </svg>
  );
}

const ICONS: Record<SocialLink["name"], ComponentType<SVGProps<SVGSVGElement>>> = {
  Threads: ThreadsIcon,
  X: X,
  TikTok: TikTokIcon,
  Instagram: Instagram,
  YouTube: Youtube,
};

export function SocialIcon({ name, className }: { name: SocialLink["name"]; className?: string }) {
  const Icon = ICONS[name];
  return <Icon className={className} aria-hidden="true" />;
}
