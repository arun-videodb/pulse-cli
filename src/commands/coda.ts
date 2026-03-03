import { Command } from "commander";
import { select, input } from "@inquirer/prompts";
import { listDocs, listPages, getPageContent } from "../lib/coda/client.js";
import * as ui from "../lib/ui.js";

export const codaCommand = new Command("coda").description(
  "Interact with Coda documents"
);

codaCommand
  .command("list")
  .description("List available Coda documents")
  .option("-q, --query <search>", "Search query to filter docs")
  .action(async (options) => {
    const spin = ui.spinner("Fetching Coda docs...");
    try {
      const docs = await listDocs(options.query);
      spin.succeed(`Found ${docs.length} document(s)`);

      if (docs.length === 0) {
        ui.info("No documents found.");
        return;
      }

      ui.table(
        docs.map((d) => ({
          id: d.id,
          name: d.name,
          updated: new Date(d.updatedAt).toLocaleDateString(),
          folder: d.folder?.name || "-",
        })),
        [
          { key: "id", label: "ID", width: 16 },
          { key: "name", label: "Name", width: 40 },
          { key: "updated", label: "Updated", width: 14 },
          { key: "folder", label: "Folder", width: 20 },
        ]
      );
    } catch (err) {
      spin.fail("Failed to fetch docs");
      ui.error((err as Error).message);
      process.exit(1);
    }
  });

codaCommand
  .command("fetch")
  .description("Fetch content from a Coda document page")
  .argument("[docId]", "Coda document ID")
  .option("-p, --page <pageId>", "Page ID or name to fetch")
  .option("-o, --output <path>", "Save content to file")
  .action(async (docId, options) => {
    try {
      // If no docId, let user search and select
      if (!docId) {
        const query = await input({
          message: "Search Coda docs (optional):",
        });
        const spin = ui.spinner("Searching...");
        const docs = await listDocs(query || undefined);
        spin.stop();

        if (docs.length === 0) {
          ui.error("No documents found.");
          process.exit(1);
        }

        docId = await select({
          message: "Select a document:",
          choices: docs.map((d) => ({
            name: `${d.name} (updated: ${new Date(d.updatedAt).toLocaleDateString()})`,
            value: d.id,
          })),
        });
      }

      let pageId = options.page;

      // If no page specified, list pages and let user select
      if (!pageId) {
        const spin = ui.spinner("Fetching pages...");
        const pages = await listPages(docId);
        spin.stop();

        if (pages.length === 0) {
          ui.error("No pages found in this document.");
          process.exit(1);
        }

        pageId = await select({
          message: "Select a page:",
          choices: pages.map((p) => ({
            name: p.name + (p.subtitle ? ` — ${p.subtitle}` : ""),
            value: p.id,
          })),
        });
      }

      const spin = ui.spinner("Fetching page content...");
      const content = await getPageContent(docId, pageId);
      spin.succeed("Page content fetched");

      if (options.output) {
        const fs = await import("node:fs");
        fs.writeFileSync(options.output, content, "utf-8");
        ui.success(`Saved to ${options.output}`);
      } else {
        ui.divider();
        console.log(content);
        ui.divider();
      }
    } catch (err) {
      ui.error((err as Error).message);
      process.exit(1);
    }
  });
