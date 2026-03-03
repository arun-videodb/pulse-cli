/** Matches Postiz API media/image item format */
export interface PostMediaItem {
  id: string;
  path: string;
  alt: string | null;
  thumbnail: string | null;
  thumbnailTimestamp?: number | null;
  mimeType?: string;
}

/** Matches Postiz API value item format */
export interface PostValueItem {
  id: string;
  content: string; // HTML content
  delay: number;
  image: PostMediaItem[];
}

/**
 * Structured LLM output for platforms that support threads/comments.
 */
export interface StructuredPostOutput {
  parts: Array<{
    content: string;
    role: "main" | "reply" | "comment";
  }>;
  title?: string;
  subreddit?: string;
  flair?: string;
}

export const THREAD_PLATFORMS = ["x"] as const;
export const COMMENT_PLATFORMS = [
  "reddit",
  "linkedin",
  "linkedin-page",
] as const;
export const MULTI_PART_PLATFORMS = [
  ...THREAD_PLATFORMS,
  ...COMMENT_PLATFORMS,
] as const;

export function isMultiPartPlatform(platform: string): boolean {
  return (MULTI_PART_PLATFORMS as readonly string[]).includes(platform);
}
