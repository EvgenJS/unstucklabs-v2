import Link from "next/link";
import { WaitlistForm } from "./WaitlistForm";
import { SocialIcon } from "./SocialIcons";
import { getActiveSocialLinks } from "../lib/social";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/apps", label: "Apps" },
      { href: "/blog", label: "Blog" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/legal/refund-policy", label: "Refund Policy" },
      { href: "/legal/shipping-policy", label: "Shipping Policy" },
    ],
  },
];

export function Footer() {
  const social = getActiveSocialLinks();

  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-bold text-foreground">UnstuckLabs</p>
            <p className="mt-2 max-w-xs text-sm text-foreground/70">
              Small, focused tools for getting unstuck — built by someone who needed them too.
            </p>
            {social.length > 0 && (
              <div className="mt-4 flex gap-4">
                {social.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="me noopener noreferrer"
                    aria-label={link.name}
                    className="text-foreground/60 transition-colors duration-200 hover:text-primary"
                  >
                    <SocialIcon name={link.name} className="h-5 w-5" />
                  </a>
                ))}
              </div>
            )}
          </div>
          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-semibold text-foreground">{column.title}</p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground/70 transition-colors duration-200 hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="text-sm font-semibold text-foreground">Stay in the loop</p>
            <p className="mt-2 text-sm text-foreground/70">Get notified when new tools ship.</p>
            <WaitlistForm source="newsletter:footer" className="mt-3" layout="stacked" />
          </div>
        </div>
        <p className="mt-10 text-xs text-foreground/50">
          © {new Date().getFullYear()} UnstuckLabs. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
