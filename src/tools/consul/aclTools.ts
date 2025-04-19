import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import Consul from "consul";
import { ToolRegistrationFunction, ACLToken } from "./types.js";

export const registerACLTools: ToolRegistrationFunction = (server, consul) => {
  server.tool(
    "create-acl-token",
    "Create a new ACL token",
    {
      name: z.string().describe("Name of the ACL token"),
      type: z.enum(["client", "management"]).describe("Type of ACL token"),
      rules: z.string().optional().describe("ACL rules in HCL format"),
    },
    async ({ name, type, rules }) => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const token = await consul.acl.create({
          Name: name,
          Type: type,
          Rules: rules,
        });
        return { content: [{ type: "text", text: `Created ACL token: ${token.ID}` }] };
      } catch (error) {
        console.error("Error creating ACL token:", error);
        return { content: [{ type: "text", text: `Error creating ACL token: ${name}` }] };
      }
    }
  );

  server.tool(
    "list-acl-tokens",
    "List all ACL tokens",
    {},
    async () => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const tokens = await consul.acl.list() as ACLToken[];
        if (!tokens || tokens.length === 0) {
          return { content: [{ type: "text", text: "No ACL tokens found" }] };
        }
        const tokensText = tokens.map((token: ACLToken) => 
          `ID: ${token.ID}, Name: ${token.Name}, Type: ${token.Type}`
        ).join("\n");
        return { content: [{ type: "text", text: `ACL Tokens:\n\n${tokensText}` }] };
      } catch (error) {
        console.error("Error listing ACL tokens:", error);
        return { content: [{ type: "text", text: "Error listing ACL tokens" }] };
      }
    }
  );
}; 