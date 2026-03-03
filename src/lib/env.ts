import dotenv from "dotenv";
import { readConfig } from "./config.js";

let loaded = false;

export function loadEnv(): void {
  if (loaded) return;
  loaded = true;

  dotenv.config();

  // Config file values act as fallback (env vars take precedence)
  const config = readConfig();
  for (const [key, value] of Object.entries(config)) {
    if (!process.env[key] && value) {
      process.env[key] = value;
    }
  }
}

export interface AppConfig {
  postizApiKey: string;
  postizApiUrl: string;
  codaApiKey: string;
  aiModel: string;
  openaiApiKey: string;
  anthropicApiKey: string;
  googleApiKey: string;
}

export function getConfig(): AppConfig {
  loadEnv();
  return {
    postizApiKey: process.env.POSTIZ_API_KEY || "",
    postizApiUrl:
      process.env.POSTIZ_API_URL || "https://api.postiz.com/public/v1",
    codaApiKey: process.env.CODA_API_KEY || "",
    aiModel: process.env.AI_MODEL || "openai:gpt-4o",
    openaiApiKey: process.env.OPENAI_API_KEY || "",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
    googleApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
  };
}
