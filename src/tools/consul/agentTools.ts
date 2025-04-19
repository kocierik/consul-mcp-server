import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import Consul from "consul";
import { ToolRegistrationFunction, AgentMember } from "./types.js";

export const registerAgentTools: ToolRegistrationFunction = (server, consul) => {
  server.tool(
    "get-agent-members",
    "Get agent members",
    {},
    async () => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const members = await consul.agent.members() as AgentMember[];
        if (!members || members.length === 0) {
          return { content: [{ type: "text", text: "No agent members found" }] };
        }
        const membersText = members.map(member => 
          `Name: ${member.Name}, Address: ${member.Address}, Status: ${member.Status}`
        ).join("\n");
        return { content: [{ type: "text", text: `Agent Members:\n\n${membersText}` }] };
      } catch (error) {
        console.error("Error getting agent members:", error);
        return { content: [{ type: "text", text: "Error getting agent members" }] };
      }
    }
  );

  server.tool(
    "reload-agent",
    "Reload agent configuration",
    {},
    async () => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        await consul.agent.reload();
        return { content: [{ type: "text", text: "Agent configuration reloaded successfully" }] };
      } catch (error) {
        console.error("Error reloading agent:", error);
        return { content: [{ type: "text", text: "Error reloading agent configuration" }] };
      }
    }
  );
};

export const registerAdditionalAgentTools: ToolRegistrationFunction = (server, consul) => {
  server.tool(
    "get-agent-config",
    "Get agent configuration",
    {},
    async () => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const config = await consul.agent.config();
        return { content: [{ type: "text", text: `Agent Configuration:\n\n${JSON.stringify(config, null, 2)}` }] };
      } catch (error) {
        console.error("Error getting agent configuration:", error);
        return { content: [{ type: "text", text: "Error getting agent configuration" }] };
      }
    }
  );

  server.tool(
    "get-agent-self",
    "Get agent self information",
    {},
    async () => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const self = await consul.agent.self();
        return { content: [{ type: "text", text: `Agent Self:\n\n${JSON.stringify(self, null, 2)}` }] };
      } catch (error) {
        console.error("Error getting agent self:", error);
        return { content: [{ type: "text", text: "Error getting agent self" }] };
      }
    }
  );
}; 