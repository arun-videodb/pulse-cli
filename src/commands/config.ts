import { Command } from "commander";
import { input, password } from "@inquirer/prompts";
import { readConfig, updateConfig } from "../lib/config.js";
import * as ui from "../lib/ui.js";

const CONFIG_KEYS = [
  { env: "POSTIZ_API_KEY", label: "Postiz API Key", secret: true },
  {
    env: "POSTIZ_API_URL",
    label: "Postiz API URL",
    secret: false,
    defaultValue: "https://api.postiz.com/public/v1",
  },
  { env: "CODA_API_KEY", label: "Coda API Key", secret: true },
  {
    env: "AI_MODEL",
    label: "AI Model (provider:model)",
    secret: false,
    defaultValue: "openai:gpt-4o",
  },
  { env: "OPENAI_API_KEY", label: "OpenAI API Key", secret: true },
  { env: "ANTHROPIC_API_KEY", label: "Anthropic API Key", secret: true },
  {
    env: "GOOGLE_GENERATIVE_AI_API_KEY",
    label: "Google AI API Key",
    secret: true,
  },
];

function maskValue(value: string): string {
  if (!value || value.length < 8) return value ? "****" : "(not set)";
  return value.slice(0, 4) + "..." + value.slice(-4);
}

export const configCommand = new Command("config")
  .description("Configure API keys and settings")
  .option("--set <key=value>", "Set a single config value non-interactively")
  .action(async (options) => {
    if (options.set) {
      const [key, ...rest] = (options.set as string).split("=");
      const value = rest.join("=");
      if (!key || !value) {
        ui.error("Usage: pulse-cli config --set KEY=VALUE");
        process.exit(1);
      }
      updateConfig({ [key]: value });
      ui.success(`Set ${key}`);
      return;
    }

    ui.header("Pulse CLI Configuration");
    console.log(
      "  Press Enter to keep the current value. Leave blank to skip.\n"
    );

    const config = readConfig();
    const updates: Record<string, string> = {};

    for (const item of CONFIG_KEYS) {
      const current = config[item.env] || "";
      const displayCurrent = item.secret
        ? maskValue(current)
        : current || item.defaultValue || "(not set)";

      const promptFn = item.secret ? password : input;
      const value = await promptFn({
        message: `${item.label} [${displayCurrent}]`,
        ...(item.secret ? { mask: "*" } : {}),
      });

      if (value) {
        updates[item.env] = value;
      }
    }

    if (Object.keys(updates).length > 0) {
      updateConfig(updates);
      ui.success(
        `Saved ${Object.keys(updates).length} setting(s) to ~/.pulse-cli/config.json`
      );
    } else {
      ui.info("No changes made.");
    }
  });
