import { generateText } from "ai";
import { getModel } from "./provider.js";
import { buildPrompt } from "./prompts.js";
import type { PostValueItem, StructuredPostOutput } from "./types.js";
import { isMultiPartPlatform } from "./types.js";
import {
  textToHtml,
  generatePostizId,
  plainTextToValueItems,
  valueItemsToPlainText,
} from "./content-helpers.js";

export interface GeneratePostInput {
  platform: string;
  brief: string;
  keyPoints: string | null;
  demoVideoUrl: string | null;
  masterPrompt: string;
  modifications: string | null;
  modelId?: string;
  platformPrompt: string;
  previousContent?: string | null;
  previousStructuredContent?: PostValueItem[] | null;
}

export interface GeneratedPostResult {
  plainContent: string;
  structuredContent: PostValueItem[];
  title?: string;
  subreddit?: string;
  flair?: string;
}

export async function generatePostContent(
  input: GeneratePostInput
): Promise<GeneratedPostResult> {
  const { system, user } = buildPrompt(
    input.platform,
    input.brief,
    input.keyPoints,
    input.demoVideoUrl,
    input.masterPrompt,
    input.modifications,
    input.platformPrompt,
    input.previousContent,
    input.previousStructuredContent
  );

  const { text } = await generateText({
    model: getModel(input.modelId),
    system,
    prompt: user,
  });

  return parseGeneratedContent(text, input.platform);
}

function parseGeneratedContent(
  rawText: string,
  platform: string
): GeneratedPostResult {
  if (isMultiPartPlatform(platform)) {
    try {
      const cleaned = rawText
        .replace(/^```(?:json)?\n?/m, "")
        .replace(/\n?```$/m, "")
        .trim();
      const parsed: StructuredPostOutput = JSON.parse(cleaned);

      if (
        parsed.parts &&
        Array.isArray(parsed.parts) &&
        parsed.parts.length > 0
      ) {
        const isLinkedin =
          platform === "linkedin" || platform === "linkedin-page";
        const valueItems: PostValueItem[] = parsed.parts.map((part, index) => ({
          id: generatePostizId(),
          content: textToHtml(part.content),
          delay: index > 0 && isLinkedin ? 1 : 0,
          image: [],
        }));

        const plainContent = valueItemsToPlainText(valueItems);

        return {
          plainContent: parsed.title
            ? `${parsed.title}\n\n${plainContent}`
            : plainContent,
          structuredContent: valueItems,
          title: parsed.title,
          subreddit: parsed.subreddit,
          flair: parsed.flair,
        };
      }
    } catch {
      // JSON parsing failed, fall through to plain text wrapping
    }
  }

  return {
    plainContent: rawText,
    structuredContent: plainTextToValueItems(rawText),
  };
}

export async function generateAllPosts(
  platforms: string[],
  campaignData: Omit<
    GeneratePostInput,
    | "platform"
    | "platformPrompt"
    | "previousContent"
    | "previousStructuredContent"
  >,
  platformPrompts: Record<string, string>,
  previousContentByPlatform?: Record<string, string>,
  previousStructuredByPlatform?: Record<string, PostValueItem[]>
): Promise<Record<string, GeneratedPostResult>> {
  const results: Record<string, GeneratedPostResult> = {};

  const promises = platforms.map(async (platform) => {
    const result = await generatePostContent({
      ...campaignData,
      platform,
      platformPrompt: platformPrompts[platform],
      previousContent: previousContentByPlatform?.[platform] ?? null,
      previousStructuredContent:
        previousStructuredByPlatform?.[platform] ?? null,
    });
    results[platform] = result;
  });

  await Promise.all(promises);
  return results;
}
