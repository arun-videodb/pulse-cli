import { Command } from "commander";
import { input, select } from "@inquirer/prompts";
import fs from "node:fs";
import {
  getIntegrations,
  createPost,
  generateGroupId,
  type PostizIntegration,
  type PostizPostItem,
  type PostizCreatePostRequest,
} from "../lib/postiz/client.js";
import {
  PLATFORM_REQUIRED_FIELDS,
  buildPlatformSettings,
} from "../lib/postiz/platform-settings.js";
import type { PostValueItem } from "../lib/ai/types.js";
import type { GeneratedPostResult } from "../lib/ai/generate-posts.js";
import { generatePostizId } from "../lib/ai/content-helpers.js";
import { textToHtml } from "../lib/ai/content-helpers.js";
import * as ui from "../lib/ui.js";

export interface ScheduleInput {
  platforms: string[];
  results: Record<string, GeneratedPostResult>;
}

/**
 * Collect platform-specific settings interactively.
 */
async function collectPlatformSettings(
  platform: string,
  generatedResult: GeneratedPostResult
): Promise<Record<string, string>> {
  const fields = PLATFORM_REQUIRED_FIELDS[platform];
  if (!fields || fields.length === 0) return {};

  const settings: Record<string, string> = {};

  for (const field of fields) {
    // Pre-fill from AI-generated data for Reddit
    let defaultVal = field.defaultValue || "";
    if (platform === "reddit") {
      if (field.key === "subreddit_name" && generatedResult.subreddit) {
        defaultVal = generatedResult.subreddit;
      }
      if (field.key === "subreddit_title" && generatedResult.title) {
        defaultVal = generatedResult.title;
      }
    }

    if (field.type === "select" && field.options) {
      settings[field.key] = await select({
        message: `[${platform}] ${field.label}:`,
        choices: field.options.map((o) => ({
          name: o.label,
          value: o.value,
        })),
        default: defaultVal,
      });
    } else {
      settings[field.key] = await input({
        message: `[${platform}] ${field.label}:`,
        default: defaultVal,
        ...(field.required
          ? {
              validate: (v: string) =>
                v.trim() ? true : `${field.label} is required`,
            }
          : {}),
      });
    }
  }

  return settings;
}

/**
 * Find the integration for a given platform identifier.
 */
function findIntegration(
  integrations: PostizIntegration[],
  platform: string
): PostizIntegration | undefined {
  return integrations.find(
    (i) => i.identifier === platform && !i.disabled
  );
}

export async function runSchedule(
  scheduleInput: ScheduleInput,
  options: {
    date?: string;
    type?: "schedule" | "now" | "draft";
    interactive?: boolean;
  } = {}
): Promise<boolean> {
  // --- Fetch integrations ---
  const spin = ui.spinner("Fetching integrations...");
  let integrations: PostizIntegration[];
  try {
    integrations = await getIntegrations();
    spin.stop();
  } catch (err) {
    spin.fail("Failed to fetch integrations");
    ui.error((err as Error).message);
    return false;
  }

  // --- Resolve schedule type ---
  let scheduleType = options.type || "schedule";
  if (!options.type && options.interactive !== false) {
    scheduleType = await select({
      message: "Schedule type:",
      choices: [
        { name: "Schedule for later", value: "schedule" },
        { name: "Post now", value: "now" },
        { name: "Save as draft", value: "draft" },
      ],
    });
  }

  // --- Resolve date ---
  let scheduleDate = options.date || new Date().toISOString();
  if (scheduleType === "schedule" && !options.date) {
    if (options.interactive !== false) {
      scheduleDate = await input({
        message: "Schedule date/time (ISO 8601, e.g. 2026-03-05T10:00:00Z):",
        validate: (v) => {
          const d = new Date(v);
          if (isNaN(d.getTime())) return "Invalid date format";
          if (d <= new Date()) return "Date must be in the future";
          return true;
        },
      });
    }
  }

  // --- Collect platform settings and build posts ---
  ui.header("Platform Settings");

  const groupId = generateGroupId();
  const posts: PostizPostItem[] = [];

  for (const platform of scheduleInput.platforms) {
    const result = scheduleInput.results[platform];
    if (!result) continue;

    const integration = findIntegration(integrations, platform);
    if (!integration) {
      ui.warn(
        `No active integration found for "${platform}" — skipping.`
      );
      continue;
    }

    // Collect platform-specific settings
    const userSettings = await collectPlatformSettings(platform, result);
    const settings = buildPlatformSettings(platform, userSettings);

    // Build the post value items
    const value = result.structuredContent.map((item) => ({
      id: item.id || generatePostizId(),
      content: item.content,
      delay: item.delay,
      image: item.image || [],
    }));

    posts.push({
      integration: { id: integration.id },
      group: groupId,
      value,
      settings,
    });

    ui.dim(
      `${platform} → ${integration.name || integration.profile} (${integration.id})`
    );
  }

  if (posts.length === 0) {
    ui.error("No posts to schedule — no matching integrations found.");
    return false;
  }

  // --- Schedule ---
  const request: PostizCreatePostRequest = {
    type: scheduleType as "schedule" | "now" | "draft",
    date: scheduleDate,
    shortLink: false,
    tags: [],
    posts,
  };

  const schedSpin = ui.spinner(
    `Scheduling ${posts.length} post(s)...`
  );
  try {
    const responses = await createPost(request);
    schedSpin.succeed(`Scheduled ${responses.length} post(s)`);

    for (const resp of responses) {
      ui.success(`Post ${resp.postId} → integration ${resp.integration}`);
    }

    return true;
  } catch (err) {
    schedSpin.fail("Scheduling failed");
    ui.error((err as Error).message);
    return false;
  }
}

export const scheduleCommand = new Command("schedule")
  .description("Schedule posts from a JSON file via Postiz")
  .option("-i, --input <path>", "JSON file with generated posts")
  .option("-d, --date <iso>", "Schedule date (ISO 8601)")
  .option(
    "-t, --type <type>",
    "Post type: schedule, now, or draft",
    "schedule"
  )
  .action(async (options) => {
    if (!options.input) {
      ui.error(
        "Provide --input with a JSON file from `pulse-cli generate --output`."
      );
      process.exit(1);
    }

    try {
      const data = JSON.parse(fs.readFileSync(options.input, "utf-8"));
      await runSchedule(
        { platforms: data.platforms, results: data.results },
        { date: options.date, type: options.type, interactive: true }
      );
    } catch (err) {
      ui.error((err as Error).message);
      process.exit(1);
    }
  });
