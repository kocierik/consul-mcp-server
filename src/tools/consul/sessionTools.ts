import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { formatSession } from "../../utils/formatter.js";
import Consul from "consul";
import { ToolRegistrationFunction } from "./types.js";

export const registerSessionTools: ToolRegistrationFunction = (server, consul) => {
  server.tool(
    "list-sessions",
    "List all sessions in Consul",
    {},
    async () => {
      try {
        const sessions = await consul.session.list();
        if (!sessions || sessions.length === 0) {
          return { content: [{ type: "text", text: "No sessions found" }] };
        }

        const sessionsText = `Sessions:\n\n${Object(sessions).map(formatSession).join("\n")}`;
        return { content: [{ type: "text", text: sessionsText }] };
      } catch (error) {
        console.error("Error listing sessions:", error);
        return { content: [{ type: "text", text: "Error listing sessions" }] };
      }
    }
  );

  server.tool(
    "destroy-session",
    "Destroy a session in Consul",
    {
      id: z.string().describe("ID of the session to destroy"),
    },
    async ({ id }) => {
      try {
        const success = await consul.session.destroy(id);
        if (!success) {
          return { content: [{ type: "text", text: `Failed to destroy session with ID: ${id}` }] };
        }

        return { content: [{ type: "text", text: `Successfully destroyed session with ID: ${id}` }] };
      } catch (error) {
        console.error("Error destroying session:", error);
        return { content: [{ type: "text", text: `Error destroying session with ID: ${id}` }] };
      }
    }
  );
}; 