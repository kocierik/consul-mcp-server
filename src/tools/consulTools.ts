import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { formatHealthCheck, formatCatalogNode, formatKVPair, formatService, formatSession } from "../utils/formatter.js";
import Consul from "consul";

// Add type definitions for Consul responses
interface ACLToken {
  ID: string;
  Name: string;
  Type: string;
}

interface Coordinate {
  Node: string;
  Segment: string;
  Coord: {
    Vec: number[];
    Error: number;
    Adjustment: number;
    Height: number;
  };
}

interface RaftServer {
  ID: string;
  Address: string;
  Leader: boolean;
  Voter: boolean;
}

interface RaftConfiguration {
  Servers: RaftServer[];
}

// Add new type definitions
interface NetworkArea {
  ID: string;
  PeerDatacenter: string;
  RetryJoin: string[];
}

interface PreparedQuery {
  ID: string;
  Name: string;
  Service: {
    Service: string;
    Failover: {
      NearestN: number;
      Datacenters: string[];
    };
  };
}

interface AgentMember {
  Name: string;
  Address: string;
  Port: number;
  Tags: Record<string, string>;
  Status: number;
  ProtocolMin: number;
  ProtocolMax: number;
  ProtocolCur: number;
  DelegateMin: number;
  DelegateMax: number;
  DelegateCur: number;
}

interface Intention {
  ID: string;
  SourceName: string;
  DestinationName: string;
  SourceType: string;
  Action: string;
  Description: string;
}

interface ConnectCAConfig {
  Provider: string;
  Config: Record<string, any>;
}

interface License {
  LicenseID: string;
  CustomerID: string;
  InstallationID: string;
  IssueDate: string;
  ExpirationDate: string;
  Product: string;
  Flags: Record<string, any>;
}

interface Namespace {
  Name: string;
  Description: string;
  ACLs: {
    PolicyDefaults: any[];
    RoleDefaults: any[];
  };
}

interface Partition {
  Name: string;
  Description: string;
}

export function registerHealthChecks(server: McpServer, consul: Consul) {
  // Register a health check
  server.tool(
    "register-health-check",
    "Register a health check with Consul",
    {
      name: z.string().default("").describe("Name of the health check"),
      id: z.string().default("").default("").optional().describe("ID of the health check (defaults to name if not provided)"),
      serviceId: z.string().default("").optional().describe("ID of the service to associate the check with"),
      notes: z.string().default("").optional().describe("Notes about the health check"),
      ttl: z.string().default("").optional().describe("Time to live for the check (e.g., '10s', '1m')"),
      http: z.string().default("").optional().describe("HTTP endpoint to check"),
      interval: z.string().default("").optional().describe("Interval for the check (e.g., '10s', '1m')"),
      timeout: z.string().default("").optional().describe("Timeout for the check (e.g., '5s', '30s')"),
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
          // HTTP checks require an interval
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
  
  // Deregister a health check
  server.tool(
    "deregister-health-check",
    "Deregister a health check from Consul",
    {
      id: z.string().default("").describe("ID of the health check to deregister"),
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
      service: z.string().default("").describe("Name of the service to get health checks for"),
    },
    async ({ service }) => {
      try {
        const data = await consul.health.service({ service });
        if (!data || data.length === 0) {
          return { content: [{ type: "text", text: `No health checks found for service: ${service}` }] };
        }
        
        // Extract health checks from the response
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
}

export function registerCatalogServices(server: McpServer, consul: Consul) {
  // List all services in the catalog
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
        
        // Format the services data
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
      service: z.string().default("").describe("Name of the service to get information for"),
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
}

export function registerCatalogNodes(server: McpServer, consul: Consul) {
  server.tool(
    "get-catalog-nodes",
    "Get nodes from the catalog",
    {},
    async () => {
      try {
        const data = await consul.catalog.node.list();
        if (!data || data.length === 0) {
          return { content: [{ type: "text", text: "No nodes found in the catalog" }] };
        }
        
        const nodesText = `Catalog nodes:\n\n${data.map(formatCatalogNode).join("\n")}`;
        return { content: [{ type: "text", text: nodesText }] };
      } catch (error) {
        console.error("Error getting catalog nodes:", error);
        return { content: [{ type: "text", text: "Error getting catalog nodes" }] };
      }
    }
  );
}

export function registerServiceList(server: McpServer, consul: Consul) {
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
}

export function registerAgentServices(server: McpServer, consul: Consul) {
  // Register a service
  server.tool(
    "register-service",
    "Register a service with Consul",
    {
      name: z.string().default("").describe("Name of the service to register"),
      id: z.string().default("").optional().describe("ID of the service (defaults to name if not provided)"),
      port: z.number().optional().describe("Port the service is running on"),
      address: z.string().default("").optional().describe("Address the service is running on"),
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
        
        await consul.agent.service.register(serviceDefinition);
        //if (!success) {
        //  return { content: [{ type: "text", text: `Failed to register service: ${name}` }] };
        //}
        
        return { content: [{ type: "text", text: `Successfully registered service: ${name} with ID: ${serviceId}` }] };
      } catch (error) {
        console.error("Error registering service:", error);
        return { content: [{ type: "text", text: `Error registering service: ${name}` }] };
      }
    }
  );
  
  // Deregister a service
  server.tool(
    "deregister-service",
    "Deregister a service from Consul",
    {
      id: z.string().default("").describe("ID of the service to deregister"),
    },
    async ({ id }) => {
      try {
        await consul.agent.service.deregister(id);
        //if (!success) {
        //  return { content: [{ type: "text", text: `Failed to deregister service with ID: ${id}` }] };
        //}
        
        return { content: [{ type: "text", text: `Successfully deregistered service with ID: ${id}` }] };
      } catch (error) {
        console.error("Error deregistering service:", error);
        return { content: [{ type: "text", text: `Error deregistering service with ID: ${id}` }] };
      }
    }
  );
}

export function registerKVStore(server: McpServer, consul: Consul) {
  // Get KV
  server.tool(
    "get-kv",
    "Get a value from the KV store",
    {
      key: z.string().default("").describe("Key to get from the KV store"),
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
  
  // List KV
  server.tool(
    "list-kv",
    "List keys in the KV store",
    {
      prefix: z.string().default("").optional().describe("Prefix to filter keys by"),
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
  
  // Put KV
  server.tool(
    "put-kv",
    "Put a value in the KV store",
    {
      key: z.string().default("").describe("Key to put in the KV store"),
      value: z.string().default("").describe("Value to put in the KV store"),
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
  
  // Delete KV
  server.tool(
    "delete-kv",
    "Delete a key from the KV store",
    {
      key: z.string().default("").describe("Key to delete from the KV store"),
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
}

export function registerSessionTools(server: McpServer, consul: Consul) {
  // List sessions
  server.tool(
    "list-sessions",
    "List all sessions in Consul",
    {},
    async () => {
      try {
        const sessions = await consul.session.list();
        if (!sessions || sessions.length === 0) {
          return { content: [{ type: "text", text: "No sessions found" }] };
        }

        const sessionsText = `Sessions:\n\n${Object(sessions).map(formatSession).join("\n")}`;
        return { content: [{ type: "text", text: sessionsText }] };
      } catch (error) {
        console.error("Error listing sessions:", error);
        return { content: [{ type: "text", text: "Error listing sessions" }] };
      }
    }
  );

  // Destroy a session
  server.tool(
    "destroy-session",
    "Destroy a session in Consul",
    {
      id: z.string().default("").describe("ID of the session to destroy"),
    },
    async ({ id }) => {
      try {
        const success = await consul.session.destroy(id);
        if (!success) {
          return { content: [{ type: "text", text: `Failed to destroy session with ID: ${id}` }] };
        }

        return { content: [{ type: "text", text: `Successfully destroyed session with ID: ${id}` }] };
      } catch (error) {
        console.error("Error destroying session:", error);
        return { content: [{ type: "text", text: `Error destroying session with ID: ${id}` }] };
      }
    }
  );
}

// export function registerACLTools(server: McpServer, consul: Consul) {
//   // Create ACL token
//   server.tool(
//     "create-acl-token",
//     "Create a new ACL token",
//     {
//       name: z.string().default("").describe("Name of the ACL token"),
//       type: z.enum(["client", "management"]).describe("Type of ACL token"),
//       rules: z.string().default("").optional().describe("ACL rules in HCL format"),
//     },
//     async ({ name, type, rules }) => {
//       try {
//         // @ts-ignore - The Consul type definitions are incomplete
//         const token = await consul.acl.legacy.create({
//           name: name,
//           type: type,
//           rules: rules,
//         });
//         return { content: [{ type: "text", text: `Created ACL token: ${token.ID}` }] };
//       } catch (error) {
//         console.error("Error creating ACL token:", error);
//         return { content: [{ type: "text", text: `Error creating ACL token: ${name}` }] };
//       }
//     }
//   );
// 
//   // List ACL tokens
//   server.tool(
//     "list-acl-tokens",
//     "List all ACL tokens",
//     {},
//     async () => {
//       try {
//         // @ts-ignore - The Consul type definitions are incomplete
//         const tokens = await consul.acl.legacy.list() as ACLToken[];
//         if (!tokens || tokens.length === 0) {
//           return { content: [{ type: "text", text: "No ACL tokens found" }] };
//         }
//         const tokensText = tokens.map((token: ACLToken) => 
//           `ID: ${token.ID}, Name: ${token.Name}, Type: ${token.Type}`
//         ).join("\n");
//         return { content: [{ type: "text", text: `ACL Tokens:\n\n${tokensText}` }] };
//       } catch (error) {
//         console.error("Error listing ACL tokens:", error);
//         return { content: [{ type: "text", text: "Error listing ACL tokens" }] };
//       }
//     }
//   );
// }

export function registerEventTools(server: McpServer, consul: Consul) {
  // Fire an event
  server.tool(
    "fire-event",
    "Fire a new event",
    {
      name: z.string().default("").describe("Name of the event"),
      payload: z.string().default("").optional().describe("Event payload"),
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

  // List events
  server.tool(
    "list-events",
    "List all events",
    {
      name: z.string().default("").optional().describe("Filter events by name"),
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
}



export function registerPreparedQueryTools(server: McpServer, consul: Consul) {
  // Create a prepared query
  server.tool(
    "create-prepared-query",
    "Create a new prepared query",
    {
      name: z.string().default("").describe("Name of the prepared query"),
      service: z.string().default("").describe("Service to query"),
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

  // Execute a prepared query
  server.tool(
    "execute-prepared-query",
    "Execute a prepared query",
    {
      id: z.string().default("").describe("ID of the prepared query"),
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
}

export function registerStatusTools(server: McpServer, consul: Consul) {
  // Get leader status
  server.tool(
    "get-leader",
    "Get the current leader",
    {},
    async () => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const leader = await consul.status.leader();
        return { content: [{ type: "text", text: `Current leader: ${leader}` }] };
      } catch (error) {
        console.error("Error getting leader:", error);
        return { content: [{ type: "text", text: "Error getting leader" }] };
      }
    }
  );

  // Get peers
  server.tool(
    "get-peers",
    "Get the current peers",
    {},
    async () => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const peers = await consul.status.peers();
        return { content: [{ type: "text", text: `Current peers:\n\n${peers.join("\n")}` }] };
      } catch (error) {
        console.error("Error getting peers:", error);
        return { content: [{ type: "text", text: "Error getting peers" }] };
      }
    }
  );
}

export function registerAgentTools(server: McpServer, consul: Consul) {
  // Get agent members
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

  // Reload agent configuration
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
}


export function registerSystemTools(server: McpServer, consul: Consul) {

  // Get system health OK
  server.tool(
    "get-health-service",
    "Get system health service",
    {
      name: z.string().default("").describe("Name of the partition").default(""),
      tag: z.string().default("").optional().describe("filter by tag").default(""),
      passing: z.boolean().optional().describe("restrict to passing checks").default(false),
    },
    async ({ name, tag, passing }) => {
      try {

        // @ts-ignore - The Consul type definitions are incomplete
        const health = await consul.health.service({service: name, tag: tag, passing: passing});
        

        return { content: [{ type: "text", text: `System Health service ${name}:\n\n${JSON.stringify(health, null,2)}` }] };
      } catch (error) {
        console.error(`Error getting system health service ${name}:`, error);
        return { content: [{ type: "text", text: `Error getting system health service ${name}` }] };
      }
    }
  );
}

export function registerAdditionalAgentTools(server: McpServer, consul: Consul) {

  // Get agent self
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
}
