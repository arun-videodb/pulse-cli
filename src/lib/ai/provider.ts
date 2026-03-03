import { createProviderRegistry } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";

export const registry = createProviderRegistry({
  openai,
  anthropic,
  google,
});

/**
 * Get an AI model by ID, or fall back to the AI_MODEL env var.
 * Model ID format: "provider:model-name", e.g.:
 *   "openai:gpt-4o"
 *   "anthropic:claude-sonnet-4-20250514"
 *   "google:gemini-2.0-flash"
 */
export function getModel(modelId?: string) {
  const id = modelId || process.env.AI_MODEL || "openai:gpt-4o";
  return registry.languageModel(
    id as `openai:${string}` | `anthropic:${string}` | `google:${string}`
  );
}
