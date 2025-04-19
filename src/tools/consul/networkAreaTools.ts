import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import Consul from "consul";
import { ToolRegistrationFunction, NetworkArea } from "./types.js";

export const registerNetworkAreaTools: ToolRegistrationFunction = (server, consul) => {
  server.tool(
    "join-network-area",
    "Join a network area",
    {
      datacenter: z.string().describe("Datacenter to join"),
      address: z.string().describe("Address of the peer datacenter"),
    },
    async ({ datacenter, address }) => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const result = await consul.area.join(datacenter, address);
        return { content: [{ type: "text", text: `Joined network area: ${result.ID}` }] };
      } catch (error) {
        console.error("Error joining network area:", error);
        return { content: [{ type: "text", text: `Error joining network area: ${datacenter}` }] };
      }
    }
  );

  server.tool(
    "list-network-areas",
    "List all network areas",
    {},
    async () => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const areas = await consul.area.list() as NetworkArea[];
        if (!areas || areas.length === 0) {
          return { content: [{ type: "text", text: "No network areas found" }] };
        }
        const areasText = areas.map(area => 
          `ID: ${area.ID}, Peer Datacenter: ${area.PeerDatacenter}, Retry Join: ${area.RetryJoin.join(", ")}`
        ).join("\n");
        return { content: [{ type: "text", text: `Network Areas:\n\n${areasText}` }] };
      } catch (error) {
        console.error("Error listing network areas:", error);
        return { content: [{ type: "text", text: "Error listing network areas" }] };
      }
    }
  );
}; 