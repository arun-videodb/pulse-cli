import { Command } from "commander";
import { getIntegrations } from "../lib/postiz/client.js";
import * as ui from "../lib/ui.js";

export const integrationsCommand = new Command("integrations")
  .description("List connected Postiz social media accounts")
  .action(async () => {
    const spin = ui.spinner("Fetching integrations...");
    try {
      const integrations = await getIntegrations();
      spin.succeed(`Found ${integrations.length} integration(s)`);

      if (integrations.length === 0) {
        ui.info(
          "No integrations found. Connect social accounts in Postiz first."
        );
        return;
      }

      ui.table(
        integrations.map((i) => ({
          id: i.id,
          platform: i.identifier,
          name: i.name || i.profile || "-",
          status: i.disabled ? "disabled" : "active",
        })),
        [
          { key: "id", label: "ID", width: 28 },
          { key: "platform", label: "Platform", width: 16 },
          { key: "name", label: "Name", width: 30 },
          { key: "status", label: "Status", width: 10 },
        ]
      );
    } catch (err) {
      spin.fail("Failed to fetch integrations");
      ui.error((err as Error).message);
      process.exit(1);
    }
  });
