#!/usr/bin/env node

import { Command } from "commander";
import { loadEnv } from "./lib/env.js";
import { configCommand } from "./commands/config.js";
import { codaCommand } from "./commands/coda.js";
import { integrationsCommand } from "./commands/integrations.js";
import { generateCommand } from "./commands/generate.js";
import { scheduleCommand } from "./commands/schedule.js";
import { runCommand } from "./commands/run.js";

// Load environment before anything else
loadEnv();

const program = new Command();

program
  .name("pulse-cli")
  .description("Generate and schedule social media posts via Postiz")
  .version("0.1.0");

program.addCommand(configCommand);
program.addCommand(codaCommand);
program.addCommand(integrationsCommand);
program.addCommand(generateCommand);
program.addCommand(scheduleCommand);
program.addCommand(runCommand);

program.parse();
