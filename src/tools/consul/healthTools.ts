import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { formatHealthCheck } from "../../utils/formatter.js";
import Consul from "consul";
import { ToolRegistrationFunction } from "./types.js";

export const registerHealthChecks: ToolRegistrationFunction = (server, consul) => {
  server.tool(
    "register-health-check",
    "Register a health check with Consul",
    {
      name: z.string().describe("Name of the health check"),
      id: z.string().optional().describe("ID of the health check (defaults to name if not provided)"),
      serviceId: z.string().optional().describe("ID of the service to associate the check with"),
      notes: z.string().optional().describe("Notes about the health check"),
      ttl: z.string().optional().describe("Time to live for the check (e.g., '10s', '1m')"),
      http: z.string().optional().describe("HTTP endpoint to check"),
      interval: z.string().optional().describe("Interval for the check (e.g., '10s', '1m')"),
      timeout: z.string().optional().describe("Timeout for the check (e.g., '5s', '30s')"),
    },
    async ({ name, id, serviceId, notes, ttl, http, interval, timeout }) => {
      try {
        const checkId = id || name;
        const checkDefinition: any = {
          name,
          id: checkId,
        };
        
        if (serviceId !== undefined) checkDefinition.serviceId = serviceId;
        if (notes !== undefined) checkDefinition.notes = notes;
        if (ttl !== undefined) checkDefinition.ttl = ttl;
        if (http !== undefined) {
          checkDefinition.http = http;
          if (interval !== undefined) checkDefinition.interval = interval;
        }
        if (timeout !== undefined) checkDefinition.timeout = timeout;
        
        const success = await consul.agent.check.register(checkDefinition);
        if (!success) {
          return { content: [{ type: "text", text: `Failed to register health check: ${name}` }] };
        }
        
        return { content: [{ type: "text", text: `Successfully registered health check: ${name} with ID: ${checkId}` }] };
      } catch (error) {
        console.error("Error registering health check:", error);
        return { content: [{ type: "text", text: `Error registering health check: ${name}` }] };
      }
    }
  );
  
  server.tool(
    "deregister-health-check",
    "Deregister a health check from Consul",
    {
      id: z.string().describe("ID of the health check to deregister"),
    },
    async ({ id }) => {
      try {
        const success = await consul.agent.check.deregister(id);
        if (!success) {
          return { content: [{ type: "text", text: `Failed to deregister health check with ID: ${id}` }] };
        }
        
        return { content: [{ type: "text", text: `Successfully deregistered health check with ID: ${id}` }] };
      } catch (error) {
        console.error("Error deregistering health check:", error);
        return { content: [{ type: "text", text: `Error deregistering health check with ID: ${id}` }] };
      }
    }
  );

  server.tool(
    "get-health-checks",
    "Get health checks for a service",
    {
      service: z.string().describe("Name of the service to get health checks for"),
    },
    async ({ service }) => {
      try {
        const data = await consul.health.service({ service });
        if (!data || data.length === 0) {
          return { content: [{ type: "text", text: `No health checks found for service: ${service}` }] };
        }
        
        const checks = data.flatMap(entry => entry.Checks || []);
        if (checks.length === 0) {
          return { content: [{ type: "text", text: `No health checks found for service: ${service}` }] };
        }
        
        const checksText = `Health checks for service ${service}:\n\n${checks.map(formatHealthCheck).join("\n")}`;
        return { content: [{ type: "text", text: checksText }] };
      } catch (error) {
        console.error("Error getting health checks:", error);
        return { content: [{ type: "text", text: `Error getting health checks for service: ${service}` }] };
      }
    }
  );
}; 