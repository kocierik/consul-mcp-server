import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { formatKVPair } from "../../utils/formatter.js";
import Consul from "consul";
import { ToolRegistrationFunction } from "./types.js";

export const registerKVStore: ToolRegistrationFunction = (server, consul) => {
  server.tool(
    "get-kv",
    "Get a value from the KV store",
    {
      key: z.string().describe("Key to get from the KV store"),
    },
    async ({ key }) => {
      try {
        const data = await consul.kv.get(key);
        if (!data) {
          return { content: [{ type: "text", text: `No value found for key: ${key}` }] };
        }
        
        const kvText = formatKVPair(data);
        return { content: [{ type: "text", text: kvText }] };
      } catch (error) {
        console.error("Error getting KV:", error);
        return { content: [{ type: "text", text: `Error getting value for key: ${key}` }] };
      }
    }
  );
  
  server.tool(
    "list-kv",
    "List keys in the KV store",
    {
      prefix: z.string().optional().describe("Prefix to filter keys by"),
    },
    async ({ prefix = "" }) => {
      try {
        const data = await consul.kv.keys(prefix);
        if (!data || data.length === 0) {
          return { content: [{ type: "text", text: `No keys found${prefix ? ` with prefix: ${prefix}` : ""}` }] };
        }
        
        const keysText = `Keys in KV store${prefix ? ` with prefix: ${prefix}` : ""}:\n\n${data.join("\n")}`;
        return { content: [{ type: "text", text: keysText }] };
      } catch (error) {
        console.error("Error listing KV keys:", error);
        return { content: [{ type: "text", text: `Error listing keys${prefix ? ` with prefix: ${prefix}` : ""}` }] };
      }
    }
  );
  
  server.tool(
    "put-kv",
    "Put a value in the KV store",
    {
      key: z.string().describe("Key to put in the KV store"),
      value: z.string().describe("Value to put in the KV store"),
    },
    async ({ key, value }) => {
      try {
        const success = await consul.kv.set(key, value);
        if (!success) {
          return { content: [{ type: "text", text: `Failed to put value for key: ${key}` }] };
        }
        
        return { content: [{ type: "text", text: `Successfully put value for key: ${key}` }] };
      } catch (error) {
        console.error("Error putting KV:", error);
        return { content: [{ type: "text", text: `Error putting value for key: ${key}` }] };
      }
    }
  );
  
  server.tool(
    "delete-kv",
    "Delete a key from the KV store",
    {
      key: z.string().describe("Key to delete from the KV store"),
    },
    async ({ key }) => {
      try {
        const success = await consul.kv.del(key);
        if (!success) {
          return { content: [{ type: "text", text: `Failed to delete key: ${key}` }] };
        }
        
        return { content: [{ type: "text", text: `Successfully deleted key: ${key}` }] };
      } catch (error) {
        console.error("Error deleting KV:", error);
        return { content: [{ type: "text", text: `Error deleting key: ${key}` }] };
      }
    }
  );
};

export const registerAdditionalKVTools: ToolRegistrationFunction = (server, consul) => {
  server.tool(
    "kv-transaction",
    "Perform a KV transaction",
    {
      operations: z.array(z.object({
        operation: z.enum(["set", "delete", "get"]),
        key: z.string(),
        value: z.string().optional(),
      })).describe("List of operations to perform"),
    },
    async ({ operations }) => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const result = await consul.kv.transaction(operations);
        return { content: [{ type: "text", text: `Transaction Result:\n\n${JSON.stringify(result, null, 2)}` }] };
      } catch (error) {
        console.error("Error performing KV transaction:", error);
        return { content: [{ type: "text", text: "Error performing KV transaction" }] };
      }
    }
  );
}; 