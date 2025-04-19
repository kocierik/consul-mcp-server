import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import Consul from "consul";
import { ToolRegistrationFunction, PreparedQuery } from "./types.js";

export const registerPreparedQueryTools: ToolRegistrationFunction = (server, consul) => {
  server.tool(
    "create-prepared-query",
    "Create a new prepared query",
    {
      name: z.string().describe("Name of the prepared query"),
      service: z.string().describe("Service to query"),
      nearestN: z.number().optional().describe("Number of nearest nodes to return"),
      datacenters: z.array(z.string()).optional().describe("Datacenters to query"),
    },
    async ({ name, service, nearestN, datacenters }) => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const query = await consul.query.create({
          Name: name,
          Service: {
            Service: service,
            Failover: {
              NearestN: nearestN || 3,
              Datacenters: datacenters || [],
            },
          },
        }) as PreparedQuery;
        return { content: [{ type: "text", text: `Created prepared query: ${query.ID}` }] };
      } catch (error) {
        console.error("Error creating prepared query:", error);
        return { content: [{ type: "text", text: `Error creating prepared query: ${name}` }] };
      }
    }
  );

  server.tool(
    "execute-prepared-query",
    "Execute a prepared query",
    {
      id: z.string().describe("ID of the prepared query"),
    },
    async ({ id }) => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const results = await consul.query.execute(id);
        return { content: [{ type: "text", text: `Query results:\n\n${JSON.stringify(results, null, 2)}` }] };
      } catch (error) {
        console.error("Error executing prepared query:", error);
        return { content: [{ type: "text", text: `Error executing prepared query: ${id}` }] };
      }
    }
  );
}; 