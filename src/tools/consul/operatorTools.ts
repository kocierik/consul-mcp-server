import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import Consul from "consul";
import { ToolRegistrationFunction, RaftConfiguration, RaftServer } from "./types.js";

export const registerOperatorTools: ToolRegistrationFunction = (server, consul) => {
  server.tool(
    "get-raft-configuration",
    "Get the Raft configuration",
    {},
    async () => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const config = await consul.operator.raft.configuration() as RaftConfiguration;
        if (!config || !config.Servers) {
          return { content: [{ type: "text", text: "No Raft configuration found" }] };
        }
        const configText = config.Servers.map((server: RaftServer) => 
          `ID: ${server.ID}, Address: ${server.Address}, Leader: ${server.Leader}, Voter: ${server.Voter}`
        ).join("\n");
        return { content: [{ type: "text", text: `Raft Configuration:\n\n${configText}` }] };
      } catch (error) {
        console.error("Error getting Raft configuration:", error);
        return { content: [{ type: "text", text: "Error getting Raft configuration" }] };
      }
    }
  );

  server.tool(
    "get-autopilot-configuration",
    "Get the Autopilot configuration",
    {},
    async () => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const config = await consul.operator.autopilot.configuration();
        return { content: [{ type: "text", text: `Autopilot Configuration:\n\n${JSON.stringify(config, null, 2)}` }] };
      } catch (error) {
        console.error("Error getting Autopilot configuration:", error);
        return { content: [{ type: "text", text: "Error getting Autopilot configuration" }] };
      }
    }
  );
}; 