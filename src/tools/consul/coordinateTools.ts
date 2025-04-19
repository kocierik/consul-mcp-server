import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import Consul from "consul";
import { ToolRegistrationFunction, Coordinate } from "./types.js";

export const registerCoordinateTools: ToolRegistrationFunction = (server, consul) => {
  server.tool(
    "get-node-coordinates",
    "Get coordinates for a specific node",
    {
      node: z.string().describe("Name of the node"),
    },
    async ({ node }) => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const coordinates = await consul.coordinate.node(node) as Coordinate[];
        if (!coordinates || coordinates.length === 0) {
          return { content: [{ type: "text", text: `No coordinates found for node: ${node}` }] };
        }
        const coordText = coordinates.map((coord: Coordinate) => 
          `Node: ${coord.Node}, Segment: ${coord.Segment}, Coord: ${JSON.stringify(coord.Coord)}`
        ).join("\n");
        return { content: [{ type: "text", text: `Coordinates for ${node}:\n\n${coordText}` }] };
      } catch (error) {
        console.error("Error getting node coordinates:", error);
        return { content: [{ type: "text", text: `Error getting coordinates for node: ${node}` }] };
      }
    }
  );
}; 