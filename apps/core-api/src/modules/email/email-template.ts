// Shared branded HTML shell for every transactional email core-api sends.
// Table-based layout with inline styles throughout -- not stylistic
// preference, it's what actually renders consistently across real email
// clients (Outlook's Word rendering engine in particular ignores flexbox/
// grid/most CSS, but respects inline styles on tables). Colors match
// packages/ui/src/tokens.css's Store palette (--color-primary/--color-accent)
// so the email reads as the same product as the site, not a generic template.

const PRIMARY = "#0d9488"; // teal
const ACCENT = "#ea580c"; // orange
const FOREGROUND = "#134e4a";
const MUTED = "#5f7d7a";
const BORDER = "#d9ece9";
const BACKGROUND = "#f0fdfa";

export interface EmailTemplateOptions {
  preheader?: string; // hidden preview text shown in inbox lists, before the subject-line snippet
  heading: string;
  bodyHtml: string; // one or more already-escaped <p> paragraphs
  ctaText?: string;
  ctaUrl?: string;
  footerNote?: string;
}

export function renderEmailHtml(options: EmailTemplateOptions): string {
  const { preheader, heading, bodyHtml, ctaText, ctaUrl, footerNote } = options;

  const cta =
    ctaText && ctaUrl
      ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0;">
          <tr>
            <td style="border-radius: 8px; background-color: ${ACCENT};">
              <a href="${ctaUrl}" target="_blank"
                 style="display: inline-block; padding: 12px 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                ${ctaText}
              </a>
            </td>
          </tr>
        </table>
        <p style="margin: 0 0 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: ${MUTED}; word-break: break-all;">
          Or paste this link into your browser: <a href="${ctaUrl}" style="color: ${PRIMARY};">${ctaUrl}</a>
        </p>`
      : "";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${heading}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: ${BACKGROUND}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${preheader}</div>` : ""}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${BACKGROUND};">
      <tr>
        <td align="center" style="padding: 40px 16px;">
          <table role="presentation" width="480" cellspacing="0" cellpadding="0" border="0" style="max-width: 480px; width: 100%;">
            <tr>
              <td style="padding-bottom: 24px;">
                <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 700; color: ${PRIMARY};">
                  UnstuckLabs
                </span>
              </td>
            </tr>
            <tr>
              <td style="background-color: #ffffff; border: 1px solid ${BORDER}; border-radius: 12px; padding: 32px;">
                <h1 style="margin: 0 0 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 700; color: ${FOREGROUND};">
                  ${heading}
                </h1>
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: ${FOREGROUND};">
                  ${bodyHtml}
                </div>
                ${cta}
              </td>
            </tr>
            <tr>
              <td style="padding-top: 24px;">
                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: ${MUTED};">
                  ${footerNote ?? "Small, focused tools for getting unstuck."}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
