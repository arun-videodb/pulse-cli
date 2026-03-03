import { Command } from "commander";
import { select, input, editor } from "@inquirer/prompts";
import { generatePostContent } from "../lib/ai/generate-posts.js";
import { DEFAULT_MASTER_PROMPT } from "../lib/ai/prompts.js";
import { getConfig } from "../lib/env.js";
import * as ui from "../lib/ui.js";
import type { GeneratedPostResult } from "../lib/ai/generate-posts.js";
import type { PostValueItem } from "../lib/ai/types.js";
import { runGenerate } from "./generate.js";
import { runSchedule } from "./schedule.js";

export const runCommand = new Command("run")
  .description("Full pipeline: Fetch → Generate → Review → Schedule")
  .option("-b, --brief <text>", "Brief text inline")
  .option("-f, --brief-file <path>", "Brief from a file")
  .option("--coda-doc <docId>", "Fetch brief from Coda document")
  .option("--coda-page <pageId>", "Coda page ID for the brief")
  .option("-p, --platforms <list>", "Comma-separated platforms")
  .option("-m, --model <id>", "AI model override")
  .option("--key-points <text>", "Additional key points")
  .option("--demo-url <url>", "Demo video URL")
  .option("--system-prompt <text>", "Custom system prompt")
  .option("-d, --date <iso>", "Schedule date (ISO 8601)")
  .option("-t, --type <type>", "Post type: schedule, now, or draft")
  .action(async (options) => {
    ui.header("PULSE CLI — Social Media Post Pipeline");

    // Step 1-3: Generate posts (handles brief fetch, platform selection, AI generation)
    const generateResult = await runGenerate({
      ...options,
      interactive: true,
    });

    if (!generateResult) {
      ui.error("Generation step failed or was cancelled.");
      process.exit(1);
    }

    // Step 4: Review loop
    ui.header("Review Posts");

    const config = getConfig();
    const finalPlatforms: string[] = [];
    const finalResults: Record<string, GeneratedPostResult> = {};

    for (const platform of generateResult.platforms) {
      let result = generateResult.results[platform];
      if (!result) continue;

      let done = false;
      while (!done) {
        ui.postPreview(platform, result.plainContent);
        console.log();

        const action = await select({
          message: `Action for ${platform}:`,
          choices: [
            { name: "Accept", value: "accept" },
            { name: "Edit", value: "edit" },
            { name: "Regenerate", value: "regenerate" },
            { name: "Skip", value: "skip" },
          ],
        });

        switch (action) {
          case "accept":
            finalPlatforms.push(platform);
            finalResults[platform] = result;
            done = true;
            break;

          case "edit": {
            const edited = await editor({
              message: `Edit ${platform} post:`,
              default: result.plainContent,
            });
            // Update the result with edited content
            result = {
              ...result,
              plainContent: edited,
              structuredContent: [
                {
                  id: result.structuredContent[0]?.id || "edited",
                  content: edited
                    .split("\n")
                    .map((l) => `<p>${l}</p>`)
                    .join("\n"),
                  delay: 0,
                  image: [],
                },
              ],
            };
            // Show updated content and loop back for accept/edit/regen/skip
            break;
          }

          case "regenerate": {
            const modifications = await input({
              message: "Modification instructions (or blank for fresh):",
            });

            const spin = ui.spinner(`Regenerating ${platform}...`);
            try {
              const platformPrompt =
                generateResult.platformPrompts[platform] || "";
              result = await generatePostContent({
                platform,
                brief: generateResult.brief,
                keyPoints: null,
                demoVideoUrl: null,
                masterPrompt: generateResult.masterPrompt,
                modifications: modifications || null,
                modelId: config.aiModel,
                platformPrompt,
                previousContent: result.plainContent,
                previousStructuredContent: result.structuredContent,
              });
              spin.succeed("Regenerated");
            } catch (err) {
              spin.fail("Regeneration failed");
              ui.error((err as Error).message);
            }
            // Loop back to show new content
            break;
          }

          case "skip":
            ui.dim(`Skipped ${platform}`);
            done = true;
            break;
        }
      }
    }

    if (finalPlatforms.length === 0) {
      ui.warn("All posts were skipped. Nothing to schedule.");
      return;
    }

    // Step 5-6: Schedule
    ui.header("Schedule Posts");

    await runSchedule(
      { platforms: finalPlatforms, results: finalResults },
      { date: options.date, type: options.type, interactive: true }
    );
  });
