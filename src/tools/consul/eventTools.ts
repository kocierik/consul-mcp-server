import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import Consul from "consul";
import { ToolRegistrationFunction } from "./types.js";

export const registerEventTools: ToolRegistrationFunction = (server, consul) => {
  server.tool(
    "fire-event",
    "Fire a new event",
    {
      name: z.string().describe("Name of the event"),
      payload: z.string().optional().describe("Event payload"),
    },
    async ({ name, payload }) => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const event = await consul.event.fire(name, payload || "");
        return { content: [{ type: "text", text: `Fired event: ${event.ID}` }] };
      } catch (error) {
        console.error("Error firing event:", error);
        return { content: [{ type: "text", text: `Error firing event: ${name}` }] };
      }
    }
  );

  server.tool(
    "list-events",
    "List all events",
    {
      name: z.string().optional().describe("Filter events by name"),
    },
    async ({ name }) => {
      try {
        const events = await consul.event.list({ name });
        if (!events || events.length === 0) {
          return { content: [{ type: "text", text: "No events found" }] };
        }
        const eventsText = events.map(event => 
          `ID: ${event.ID}, Name: ${event.Name}, Payload: ${event.Payload || 'None'}`
        ).join("\n");
        return { content: [{ type: "text", text: `Events:\n\n${eventsText}` }] };
      } catch (error) {
        console.error("Error listing events:", error);
        return { content: [{ type: "text", text: "Error listing events" }] };
      }
    }
  );
}; 