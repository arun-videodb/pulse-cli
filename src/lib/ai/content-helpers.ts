import type { PostValueItem } from "./types.js";

/** Generate a random alphanumeric ID matching Postiz format */
export function generatePostizId(length = 10): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

/** Convert plain text to basic HTML for Postiz */
export function textToHtml(text: string): string {
  if (!text) return "<p></p>";
  if (text.trim().startsWith("<")) return text;

  const paragraphs = text.split(/\n\n+/);
  return paragraphs
    .map((p) => {
      const withBreaks = p.replace(/\n/g, "<br>");
      const withBold = withBreaks.replace(
        /\*\*(.+?)\*\*/g,
        "<strong>$1</strong>"
      );
      return `<p>${withBold}</p>`;
    })
    .join("\n");
}

/** Convert HTML back to plain text for display/editing */
export function htmlToText(html: string): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<[^>]+>/g, "")
    .trim();
}

/** Wrap plain text as a single PostValueItem array */
export function plainTextToValueItems(text: string): PostValueItem[] {
  return [
    {
      id: generatePostizId(),
      content: textToHtml(text),
      delay: 0,
      image: [],
    },
  ];
}

/** Extract displayable plain text from PostValueItem array */
export function valueItemsToPlainText(items: PostValueItem[]): string {
  return items.map((item) => htmlToText(item.content)).join("\n\n---\n\n");
}
