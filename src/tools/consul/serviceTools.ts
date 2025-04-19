import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { formatService, formatCatalogNode } from "../../utils/formatter.js";
import Consul from "consul";
import { ToolRegistrationFunction } from "./types.js";

export const registerServiceList: ToolRegistrationFunction = (server, consul) => {
  server.tool(
    "get-services",
    "Get running services",
    {},
    async () => {
      const data = await consul.agent.service.list();
      if (!data) {
        return { content: [{ type: "text", text: "Failed to retrieve services list data" }] };
      }
      const dataText = `List of services:\n\n${Object.values(data).map(formatService).join("\n")}`;
      return { content: [{ type: "text", text: dataText }] };
    }
  );
};

export const registerCatalogServices: ToolRegistrationFunction = (server, consul) => {
  server.tool(
    "list-catalog-services",
    "List all services in the catalog",
    {},
    async () => {
      try {
        const data = await consul.catalog.service.list();
        if (!data) {
          return { content: [{ type: "text", text: "Failed to retrieve catalog services list" }] };
        }
        
        const servicesText = Object.entries(data)
          .map(([name, tags]) => `${name}: ${(tags as string[]).join(", ") || "No tags"}`)
          .join("\n");
        
        return { content: [{ type: "text", text: `Catalog services:\n\n${servicesText}` }] };
      } catch (error) {
        console.error("Error listing catalog services:", error);
        return { content: [{ type: "text", text: "Error listing catalog services" }] };
      }
    }
  );

  server.tool(
    "get-catalog-service",
    "Get information about a specific service from the catalog",
    {
      service: z.string().describe("Name of the service to get information for"),
    },
    async ({ service }) => {
      try {
        const data = await consul.catalog.service.nodes(service);
        if (!data || data.length === 0) {
          return { content: [{ type: "text", text: `No information found for service: ${service}` }] };
        }
        
        const serviceText = `Service information for ${service}:\n\n${data.map(formatCatalogNode).join("\n")}`;
        return { content: [{ type: "text", text: serviceText }] };
      } catch (error) {
        console.error("Error getting service information:", error);
        return { content: [{ type: "text", text: `Error getting information for service: ${service}` }] };
      }
    }
  );
};

export const registerAgentServices: ToolRegistrationFunction = (server, consul) => {
  server.tool(
    "register-service",
    "Register a service with Consul",
    {
      name: z.string().describe("Name of the service to register"),
      id: z.string().optional().describe("ID of the service (defaults to name if not provided)"),
      port: z.number().optional().describe("Port the service is running on"),
      address: z.string().optional().describe("Address the service is running on"),
      tags: z.array(z.string()).optional().describe("Tags to associate with the service"),
    },
    async ({ name, id, port, address, tags }) => {
      try {
        const serviceId = id || name;
        const serviceDefinition: any = {
          name,
          id: serviceId,
        };
        
        if (port !== undefined) serviceDefinition.port = port;
        if (address !== undefined) serviceDefinition.address = address;
        if (tags !== undefined) serviceDefinition.tags = tags;
        
        const success = await consul.agent.service.register(serviceDefinition);
        if (!success) {
          return { content: [{ type: "text", text: `Failed to register service: ${name}` }] };
        }
        
        return { content: [{ type: "text", text: `Successfully registered service: ${name} with ID: ${serviceId}` }] };
      } catch (error) {
        console.error("Error registering service:", error);
        return { content: [{ type: "text", text: `Error registering service: ${name}` }] };
      }
    }
  );
  
  server.tool(
    "deregister-service",
    "Deregister a service from Consul",
    {
      id: z.string().describe("ID of the service to deregister"),
    },
    async ({ id }) => {
      try {
        const success = await consul.agent.service.deregister(id);
        if (!success) {
          return { content: [{ type: "text", text: `Failed to deregister service with ID: ${id}` }] };
        }
        
        return { content: [{ type: "text", text: `Successfully deregistered service with ID: ${id}` }] };
      } catch (error) {
        console.error("Error deregistering service:", error);
        return { content: [{ type: "text", text: `Error deregistering service with ID: ${id}` }] };
      }
    }
  );
}; 