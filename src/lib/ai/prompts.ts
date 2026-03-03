/**
 * Output format instructions auto-appended for multi-part platforms.
 */
const OUTPUT_FORMAT_INSTRUCTIONS: Record<string, string> = {
  x: `
OUTPUT FORMAT: Return a JSON object with this exact structure:
{
  "parts": [
    { "content": "First tweet text (the hook)", "role": "main" },
    { "content": "Second tweet continuing the story", "role": "reply" },
    { "content": "Third tweet with CTA and hashtags", "role": "reply" }
  ]
}
Return ONLY the JSON object, no markdown code fences.`,

  linkedin: `
OUTPUT FORMAT: Return a JSON object with this exact structure:
{
  "parts": [
    { "content": "Main post text here...", "role": "main" },
    { "content": "Optional self-comment text...", "role": "comment" }
  ]
}
If no self-comment is appropriate, include only one part with role "main".
Return ONLY the JSON object, no markdown code fences.`,

  "linkedin-page": `
OUTPUT FORMAT: Return a JSON object with this exact structure:
{
  "parts": [
    { "content": "Main post text here...", "role": "main" },
    { "content": "Optional self-comment text...", "role": "comment" }
  ]
}
If no self-comment is appropriate, include only one part with role "main".
Return ONLY the JSON object, no markdown code fences.`,

  reddit: `
OUTPUT FORMAT: Return a JSON object with this exact structure:
{
  "title": "Your compelling Reddit post title",
  "subreddit": "subreddit_name",
  "flair": "Best matching flair category",
  "parts": [
    { "content": "Body text of the Reddit post...", "role": "main" },
    { "content": "Optional self-comment text...", "role": "comment" }
  ]
}
The "subreddit" field should be the name of the most relevant subreddit for this content (without the r/ prefix).
The "flair" field should be a short category label that best describes this post.
If no self-comment is appropriate, include only one part with role "main".
Return ONLY the JSON object, no markdown code fences.`,
};

import type { PostValueItem } from "./types.js";
import { isMultiPartPlatform } from "./types.js";
import { htmlToText } from "./content-helpers.js";

export const DEFAULT_MASTER_PROMPT = `You are a social media content expert. You create engaging, platform-native posts that resonate with each platform's audience and culture. Write in a natural, authentic tone — not corporate or overly promotional.`;

/**
 * Validate that required prompts exist before generation.
 */
export function validatePrompts(
  masterPrompt: string | null,
  platformPromptOverrides: Record<string, string>,
  platforms: string[]
): string | null {
  if (!masterPrompt) {
    return "No master prompt configured.";
  }

  const missing = platforms.filter((p) => !platformPromptOverrides[p]);
  if (missing.length > 0) {
    const list = missing.map((p) => `"${p}"`).join(", ");
    return `No platform prompt configured for ${list}.`;
  }

  return null;
}

export function buildPrompt(
  platform: string,
  brief: string,
  keyPoints: string | null,
  demoVideoUrl: string | null,
  masterPrompt: string,
  modifications: string | null,
  platformPrompt: string,
  previousContent?: string | null,
  previousStructuredContent?: PostValueItem[] | null
): { system: string; user: string } {
  const system = masterPrompt;

  const outputFormat = OUTPUT_FORMAT_INSTRUCTIONS[platform] ?? "";

  let user = `${platformPrompt}${outputFormat}

Product Brief:
${brief}`;

  if (keyPoints) {
    user += `\n\nKey Points / Value Propositions:\n${keyPoints}`;
  }
  if (demoVideoUrl) {
    user += `\n\nDemo Video URL: ${demoVideoUrl}`;
  }

  if (isMultiPartPlatform(platform) && previousStructuredContent?.length) {
    const prevParts = previousStructuredContent.map((item) => ({
      content: htmlToText(item.content),
    }));
    const prevJson = JSON.stringify({ parts: prevParts }, null, 2);
    if (modifications) {
      user += `\n\nPreviously Generated Content:\n${prevJson}`;
      user += `\n\nModification Instructions (refine the above content based on these instructions — maintain the JSON structure, do NOT rewrite from scratch):\n${modifications}`;
    } else {
      user += `\n\nPreviously Generated Content (generate a fresh alternative that is different, maintain the JSON structure):\n${prevJson}`;
    }
  } else if (previousContent && modifications) {
    user += `\n\nPreviously Generated Post:\n${previousContent}`;
    user += `\n\nModification Instructions (refine the above post based on these instructions — do NOT rewrite from scratch, only apply the requested changes):\n${modifications}`;
  } else if (previousContent) {
    user += `\n\nPreviously Generated Post (generate a fresh alternative that is different from this):\n${previousContent}`;
  } else if (modifications) {
    user += `\n\nAdditional Instructions:\n${modifications}`;
  }

  return { system, user };
}
