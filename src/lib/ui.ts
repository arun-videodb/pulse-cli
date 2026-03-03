import chalk from "chalk";
import ora, { type Ora } from "ora";

export function success(msg: string): void {
  console.log(chalk.green("  ✔ ") + msg);
}

export function error(msg: string): void {
  console.error(chalk.red("  ✖ ") + msg);
}

export function warn(msg: string): void {
  console.log(chalk.yellow("  ⚠ ") + msg);
}

export function info(msg: string): void {
  console.log(chalk.blue("  ℹ ") + msg);
}

export function header(msg: string): void {
  console.log("\n" + chalk.bold.underline(msg) + "\n");
}

export function dim(msg: string): void {
  console.log(chalk.dim("    " + msg));
}

export function table(
  rows: Record<string, string>[],
  columns: { key: string; label: string; width?: number }[]
): void {
  // Header row
  const headerLine = columns
    .map((col) => chalk.bold(col.label.padEnd(col.width || 20)))
    .join("  ");
  console.log("  " + headerLine);
  console.log("  " + chalk.dim("─".repeat(headerLine.length)));

  // Data rows
  for (const row of rows) {
    const line = columns
      .map((col) => (row[col.key] || "").padEnd(col.width || 20))
      .join("  ");
    console.log("  " + line);
  }
}

export function spinner(msg: string): Ora {
  return ora({ text: msg, indent: 2 }).start();
}

export function divider(): void {
  console.log(chalk.dim("\n  " + "─".repeat(60) + "\n"));
}

export function postPreview(platform: string, content: string): void {
  console.log(chalk.bold.cyan(`\n  --- ${platform} ---`));
  const lines = content.split("\n");
  for (const line of lines) {
    console.log("  " + line);
  }
}
