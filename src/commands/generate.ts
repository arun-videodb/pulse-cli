import { Command } from "commander";
import { input, select, checkbox } from "@inquirer/prompts";
import fs from "node:fs";
import { generateAllPosts } from "../lib/ai/generate-posts.js";
import { DEFAULT_MASTER_PROMPT } from "../lib/ai/prompts.js";
import { getIntegrations } from "../lib/postiz/client.js";
import { listDocs, listPages, getPageContent } from "../lib/coda/client.js";
import { getConfig } from "../lib/env.js";
import * as ui from "../lib/ui.js";
import type { GeneratedPostResult } from "../lib/ai/generate-posts.js";

/** Default platform prompts when no Coda system prompt is provided */
const DEFAULT_PLATFORM_PROMPTS: Record<string, string> = {
  x: `Write a compelling X (Twitter) thread. The first tweet should be a strong hook (under 280 chars). Follow with 2-3 supporting tweets. Use a conversational, authentic tone. End with a clear CTA.`,
  linkedin: `Write a professional LinkedIn post. Start with a hook line, use short paragraphs and line breaks for readability. Be insightful but not corporate. Include relevant hashtags at the end.`,
  "linkedin-page": `Write a professional LinkedIn post for a company page. Start with a hook line, use short paragraphs and line breaks for readability. Be insightful but not corporate. Include relevant hashtags at the end.`,
  reddit: `Write an authentic Reddit post. Reddit users value genuine, non-promotional content. Write in first person, be helpful and community-focused. Avoid marketing language. The post should provide real value.`,
};

export interface GenerateResult {
  platforms: string[];
  results: Record<string, GeneratedPostResult>;
  brief: string;
  masterPrompt: string;
  platformPrompts: Record<string, string>;
}

export async function runGenerate(options: {
  brief?: string;
  briefFile?: string;
  codaDoc?: string;
  codaPage?: string;
  platforms?: string;
  model?: string;
  keyPoints?: string;
  demoUrl?: string;
  output?: string;
  systemPrompt?: string;
  interactive?: boolean;
}): Promise<GenerateResult | null> {
  const config = getConfig();

  // --- Resolve brief ---
  let brief = "";

  if (options.brief) {
    brief = options.brief;
  } else if (options.briefFile) {
    brief = fs.readFileSync(options.briefFile, "utf-8");
  } else if (options.codaDoc) {
    const spin = ui.spinner("Fetching brief from Coda...");
    let pageId = options.codaPage;
    if (!pageId) {
      spin.stop();
      const pages = await listPages(options.codaDoc);
      pageId = await select({
        message: "Select the brief page:",
        choices: pages.map((p) => ({
          name: p.name + (p.subtitle ? ` — ${p.subtitle}` : ""),
          value: p.id,
        })),
      });
      spin.start();
    }
    brief = await getPageContent(options.codaDoc, pageId);
    spin.succeed(`Fetched brief (${brief.length} chars)`);
  } else if (options.interactive !== false) {
    // Interactive: ask for brief source
    const source = await select({
      message: "Where is your brief?",
      choices: [
        { name: "Fetch from Coda document", value: "coda" },
        { name: "Enter text inline", value: "inline" },
        { name: "Load from file", value: "file" },
      ],
    });

    if (source === "coda") {
      const query = await input({
        message: "Search Coda docs (optional):",
      });
      const spin = ui.spinner("Searching...");
      const docs = await listDocs(query || undefined);
      spin.stop();

      if (docs.length === 0) {
        ui.error("No documents found.");
        return null;
      }

      const docId = await select({
        message: "Select a document:",
        choices: docs.map((d) => ({
          name: `${d.name} (updated: ${new Date(d.updatedAt).toLocaleDateString()})`,
          value: d.id,
        })),
      });

      const pages = await listPages(docId);
      const pageId = await select({
        message: "Select the brief page:",
        choices: pages.map((p) => ({
          name: p.name + (p.subtitle ? ` — ${p.subtitle}` : ""),
          value: p.id,
        })),
      });

      const spin2 = ui.spinner("Fetching page content...");
      brief = await getPageContent(docId, pageId);
      spin2.succeed(`Fetched brief (${brief.length} chars)`);
    } else if (source === "inline") {
      brief = await input({ message: "Enter your brief:" });
    } else {
      const filePath = await input({ message: "File path:" });
      brief = fs.readFileSync(filePath, "utf-8");
    }
  } else {
    ui.error("No brief provided. Use --brief, --brief-file, or --coda-doc.");
    return null;
  }

  if (!brief.trim()) {
    ui.error("Brief is empty.");
    return null;
  }

  // --- Resolve system prompt ---
  let masterPrompt = options.systemPrompt || DEFAULT_MASTER_PROMPT;

  if (!options.systemPrompt && options.interactive !== false) {
    const useCustom = await select({
      message: "Use a custom system prompt from Coda?",
      choices: [
        { name: "No, use default", value: "default" },
        { name: "Yes, fetch from Coda", value: "coda" },
      ],
    });

    if (useCustom === "coda") {
      const query = await input({
        message: "Search Coda docs (optional):",
      });
      const docs = await listDocs(query || undefined);
      if (docs.length > 0) {
        const docId = await select({
          message: "Select a document:",
          choices: docs.map((d) => ({
            name: d.name,
            value: d.id,
          })),
        });
        const pages = await listPages(docId);
        const pageId = await select({
          message: "Select the system prompt page:",
          choices: pages.map((p) => ({
            name: p.name,
            value: p.id,
          })),
        });
        const spin = ui.spinner("Fetching system prompt...");
        masterPrompt = await getPageContent(docId, pageId);
        spin.succeed("System prompt fetched");
      }
    }
  }

  // --- Resolve platforms ---
  let platforms: string[] = [];

  if (options.platforms) {
    platforms = options.platforms.split(",").map((p) => p.trim());
  } else if (options.interactive !== false) {
    // Fetch integrations for platform selection
    const spin = ui.spinner("Fetching integrations...");
    try {
      const integrations = await getIntegrations();
      spin.stop();

      const active = integrations.filter((i) => !i.disabled);
      if (active.length === 0) {
        ui.error("No active integrations. Connect social accounts in Postiz.");
        return null;
      }

      const selected = await checkbox({
        message: "Select platforms to generate for:",
        choices: active.map((i) => ({
          name: `${i.identifier} — ${i.name || i.profile}`,
          value: i.identifier,
          checked: ["x", "linkedin", "linkedin-page", "reddit"].includes(
            i.identifier
          ),
        })),
      });

      platforms = selected;
    } catch {
      spin.stop();
      ui.warn(
        "Could not fetch integrations. Enter platforms manually."
      );
      const manual = await input({
        message: "Platforms (comma-separated: x,linkedin,reddit):",
      });
      platforms = manual.split(",").map((p) => p.trim());
    }
  } else {
    ui.error("No platforms specified. Use --platforms x,linkedin,reddit.");
    return null;
  }

  if (platforms.length === 0) {
    ui.error("No platforms selected.");
    return null;
  }

  // --- Build platform prompts ---
  const platformPrompts: Record<string, string> = {};
  for (const p of platforms) {
    platformPrompts[p] = DEFAULT_PLATFORM_PROMPTS[p] || DEFAULT_PLATFORM_PROMPTS.linkedin;
  }

  // --- Generate ---
  ui.header("Generating Posts");

  const spin = ui.spinner(`Generating for ${platforms.join(", ")}...`);
  try {
    const results = await generateAllPosts(
      platforms,
      {
        brief,
        keyPoints: options.keyPoints || null,
        demoVideoUrl: options.demoUrl || null,
        masterPrompt,
        modifications: null,
        modelId: options.model || config.aiModel,
      },
      platformPrompts
    );
    spin.succeed("Generation complete");

    // Display results
    for (const [platform, result] of Object.entries(results)) {
      ui.postPreview(platform, result.plainContent);
    }

    // Optionally save to file
    if (options.output) {
      const outputData = { platforms, results, brief, masterPrompt, platformPrompts };
      fs.writeFileSync(options.output, JSON.stringify(outputData, null, 2));
      ui.success(`Saved to ${options.output}`);
    }

    return { platforms, results, brief, masterPrompt, platformPrompts };
  } catch (err) {
    spin.fail("Generation failed");
    ui.error((err as Error).message);
    return null;
  }
}

export const generateCommand = new Command("generate")
  .description("Generate social media posts from a brief")
  .option("-b, --brief <text>", "Brief text inline")
  .option("-f, --brief-file <path>", "Brief from a file")
  .option("--coda-doc <docId>", "Fetch brief from Coda document")
  .option("--coda-page <pageId>", "Coda page ID for the brief")
  .option("-p, --platforms <list>", "Comma-separated platforms (x,linkedin,reddit)")
  .option("-m, --model <id>", "AI model override (provider:model)")
  .option("--key-points <text>", "Additional key points")
  .option("--demo-url <url>", "Demo video URL")
  .option("--system-prompt <text>", "Custom system prompt")
  .option("-o, --output <path>", "Save results to JSON file")
  .action(async (options) => {
    await runGenerate({ ...options, interactive: true });
  });
