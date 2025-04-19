import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import Consul from "consul";
import { ToolRegistrationFunction } from "./types.js";

export const registerStatusTools: ToolRegistrationFunction = (server, consul) => {
  server.tool(
    "get-leader",
    "Get the current leader",
    {},
    async () => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const leader = await consul.status.leader();
        return { content: [{ type: "text", text: `Current leader: ${leader}` }] };
      } catch (error) {
        console.error("Error getting leader:", error);
        return { content: [{ type: "text", text: "Error getting leader" }] };
      }
    }
  );

  server.tool(
    "get-peers",
    "Get the current peers",
    {},
    async () => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const peers = await consul.status.peers();
        return { content: [{ type: "text", text: `Current peers:\n\n${peers.join("\n")}` }] };
      } catch (error) {
        console.error("Error getting peers:", error);
        return { content: [{ type: "text", text: "Error getting peers" }] };
      }
    }
  );
}; 