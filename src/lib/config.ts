import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const CONFIG_DIR = path.join(os.homedir(), ".pulse-cli");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export function readConfig(): Record<string, string> {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function writeConfig(config: Record<string, string>): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function updateConfig(updates: Record<string, string>): void {
  const config = readConfig();
  Object.assign(config, updates);
  writeConfig(config);
}
