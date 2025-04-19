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
  
  // Deregister a service
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
}

export function registerKVStore(server: McpServer, consul: Consul) {
  // Get KV
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
  
  // List KV
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
  
  // Put KV
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
  
  // Delete KV
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
      id: z.string().describe("ID of the session to destroy"),
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

export function registerACLTools(server: McpServer, consul: Consul) {
  // Create ACL token
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

  // List ACL tokens
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
}

export function registerEventTools(server: McpServer, consul: Consul) {
  // Fire an event
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

  // List events
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
}

export function registerCoordinateTools(server: McpServer, consul: Consul) {
  // Get node coordinates
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
}

export function registerOperatorTools(server: McpServer, consul: Consul) {
  // Get raft configuration
  server.tool(
    "get-raft-configuration",
    "Get the Raft configuration",
    {},
    async () => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const config = await consul.operator.raft.configuration() as RaftConfiguration;
        if (!config || !config.Servers) {
          return { content: [{ type: "text", text: "No Raft configuration found" }] };
        }
        const configText = config.Servers.map((server: RaftServer) => 
          `ID: ${server.ID}, Address: ${server.Address}, Leader: ${server.Leader}, Voter: ${server.Voter}`
        ).join("\n");
        return { content: [{ type: "text", text: `Raft Configuration:\n\n${configText}` }] };
      } catch (error) {
        console.error("Error getting Raft configuration:", error);
        return { content: [{ type: "text", text: "Error getting Raft configuration" }] };
      }
    }
  );

  // Get autopilot configuration
  server.tool(
    "get-autopilot-configuration",
    "Get the Autopilot configuration",
    {},
    async () => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const config = await consul.operator.autopilot.configuration();
        return { content: [{ type: "text", text: `Autopilot Configuration:\n\n${JSON.stringify(config, null, 2)}` }] };
      } catch (error) {
        console.error("Error getting Autopilot configuration:", error);
        return { content: [{ type: "text", text: "Error getting Autopilot configuration" }] };
      }
    }
  );
}

export function registerNetworkAreaTools(server: McpServer, consul: Consul) {
  // Join a network area
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

  // List network areas
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
}

export function registerPreparedQueryTools(server: McpServer, consul: Consul) {
  // Create a prepared query
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

  // Execute a prepared query
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

export function registerSnapshotTools(server: McpServer, consul: Consul) {
  // Save snapshot
  server.tool(
    "save-snapshot",
    "Save a snapshot of the Consul state",
    {
      path: z.string().describe("Path to save the snapshot"),
    },
    async ({ path }) => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        await consul.snapshot.save(path);
        return { content: [{ type: "text", text: `Snapshot saved to: ${path}` }] };
      } catch (error) {
        console.error("Error saving snapshot:", error);
        return { content: [{ type: "text", text: `Error saving snapshot to: ${path}` }] };
      }
    }
  );

  // Restore snapshot
  server.tool(
    "restore-snapshot",
    "Restore a snapshot of the Consul state",
    {
      path: z.string().describe("Path to the snapshot file"),
    },
    async ({ path }) => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        await consul.snapshot.restore(path);
        return { content: [{ type: "text", text: `Snapshot restored from: ${path}` }] };
      } catch (error) {
        console.error("Error restoring snapshot:", error);
        return { content: [{ type: "text", text: `Error restoring snapshot from: ${path}` }] };
      }
    }
  );
}

export function registerIntentionTools(server: McpServer, consul: Consul) {
  // Create intention
  server.tool(
    "create-intention",
    "Create a new intention",
    {
      sourceName: z.string().describe("Source service name"),
      destinationName: z.string().describe("Destination service name"),
      sourceType: z.enum(["consul", "external"]).describe("Source type"),
      action: z.enum(["allow", "deny"]).describe("Action to take"),
      description: z.string().optional().describe("Description of the intention"),
    },
    async ({ sourceName, destinationName, sourceType, action, description }) => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const intention = await consul.intention.create({
          SourceName: sourceName,
          DestinationName: destinationName,
          SourceType: sourceType,
          Action: action,
          Description: description,
        }) as Intention;
        return { content: [{ type: "text", text: `Created intention: ${intention.ID}` }] };
      } catch (error) {
        console.error("Error creating intention:", error);
        return { content: [{ type: "text", text: `Error creating intention` }] };
      }
    }
  );

  // List intentions
  server.tool(
    "list-intentions",
    "List all intentions",
    {},
    async () => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const intentions = await consul.intention.list() as Intention[];
        if (!intentions || intentions.length === 0) {
          return { content: [{ type: "text", text: "No intentions found" }] };
        }
        const intentionsText = intentions.map(intention => 
          `ID: ${intention.ID}, Source: ${intention.SourceName}, Destination: ${intention.DestinationName}, Action: ${intention.Action}`
        ).join("\n");
        return { content: [{ type: "text", text: `Intentions:\n\n${intentionsText}` }] };
      } catch (error) {
        console.error("Error listing intentions:", error);
        return { content: [{ type: "text", text: "Error listing intentions" }] };
      }
    }
  );
}

export function registerConnectTools(server: McpServer, consul: Consul) {
  // Get CA configuration
  server.tool(
    "get-ca-config",
    "Get Connect CA configuration",
    {},
    async () => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const config = await consul.connect.ca.get() as ConnectCAConfig;
        return { content: [{ type: "text", text: `CA Configuration:\n\n${JSON.stringify(config, null, 2)}` }] };
      } catch (error) {
        console.error("Error getting CA configuration:", error);
        return { content: [{ type: "text", text: "Error getting CA configuration" }] };
      }
    }
  );

  // Update CA configuration
  server.tool(
    "update-ca-config",
    "Update Connect CA configuration",
    {
      provider: z.string().describe("CA provider"),
      config: z.record(z.any()).describe("CA configuration"),
    },
    async ({ provider, config }) => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        await consul.connect.ca.set({
          Provider: provider,
          Config: config,
        });
        return { content: [{ type: "text", text: "CA configuration updated successfully" }] };
      } catch (error) {
        console.error("Error updating CA configuration:", error);
        return { content: [{ type: "text", text: "Error updating CA configuration" }] };
      }
    }
  );
}

export function registerLicenseTools(server: McpServer, consul: Consul) {
  // Get license
  server.tool(
    "get-license",
    "Get the current license",
    {},
    async () => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const license = await consul.license.get() as License;
        return { content: [{ type: "text", text: `License:\n\nID: ${license.LicenseID}\nCustomer: ${license.CustomerID}\nExpires: ${license.ExpirationDate}` }] };
      } catch (error) {
        console.error("Error getting license:", error);
        return { content: [{ type: "text", text: "Error getting license" }] };
      }
    }
  );

  // Update license
  server.tool(
    "update-license",
    "Update the license",
    {
      license: z.string().describe("License string"),
    },
    async ({ license }) => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        await consul.license.put(license);
        return { content: [{ type: "text", text: "License updated successfully" }] };
      } catch (error) {
        console.error("Error updating license:", error);
        return { content: [{ type: "text", text: "Error updating license" }] };
      }
    }
  );
}

export function registerNamespaceTools(server: McpServer, consul: Consul) {
  // Create namespace
  server.tool(
    "create-namespace",
    "Create a new namespace",
    {
      name: z.string().describe("Name of the namespace"),
      description: z.string().optional().describe("Description of the namespace"),
    },
    async ({ name, description }) => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const namespace = await consul.namespace.create({
          Name: name,
          Description: description,
        }) as Namespace;
        return { content: [{ type: "text", text: `Created namespace: ${namespace.Name}` }] };
      } catch (error) {
        console.error("Error creating namespace:", error);
        return { content: [{ type: "text", text: `Error creating namespace: ${name}` }] };
      }
    }
  );

  // List namespaces
  server.tool(
    "list-namespaces",
    "List all namespaces",
    {},
    async () => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const namespaces = await consul.namespace.list() as Namespace[];
        if (!namespaces || namespaces.length === 0) {
          return { content: [{ type: "text", text: "No namespaces found" }] };
        }
        const namespacesText = namespaces.map(namespace => 
          `Name: ${namespace.Name}, Description: ${namespace.Description || 'None'}`
        ).join("\n");
        return { content: [{ type: "text", text: `Namespaces:\n\n${namespacesText}` }] };
      } catch (error) {
        console.error("Error listing namespaces:", error);
        return { content: [{ type: "text", text: "Error listing namespaces" }] };
      }
    }
  );
}

export function registerPartitionTools(server: McpServer, consul: Consul) {
  // Create partition
  server.tool(
    "create-partition",
    "Create a new partition",
    {
      name: z.string().describe("Name of the partition"),
      description: z.string().optional().describe("Description of the partition"),
    },
    async ({ name, description }) => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const partition = await consul.partition.create({
          Name: name,
          Description: description,
        }) as Partition;
        return { content: [{ type: "text", text: `Created partition: ${partition.Name}` }] };
      } catch (error) {
        console.error("Error creating partition:", error);
        return { content: [{ type: "text", text: `Error creating partition: ${name}` }] };
      }
    }
  );

  // List partitions
  server.tool(
    "list-partitions",
    "List all partitions",
    {},
    async () => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const partitions = await consul.partition.list() as Partition[];
        if (!partitions || partitions.length === 0) {
          return { content: [{ type: "text", text: "No partitions found" }] };
        }
        const partitionsText = partitions.map(partition => 
          `Name: ${partition.Name}, Description: ${partition.Description || 'None'}`
        ).join("\n");
        return { content: [{ type: "text", text: `Partitions:\n\n${partitionsText}` }] };
      } catch (error) {
        console.error("Error listing partitions:", error);
        return { content: [{ type: "text", text: "Error listing partitions" }] };
      }
    }
  );
}

export function registerSystemTools(server: McpServer, consul: Consul) {
  // Get system metrics
  server.tool(
    "get-metrics",
    "Get system metrics",
    {},
    async () => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const metrics = await consul.system.metrics();
        return { content: [{ type: "text", text: `System Metrics:\n\n${JSON.stringify(metrics, null, 2)}` }] };
      } catch (error) {
        console.error("Error getting system metrics:", error);
        return { content: [{ type: "text", text: "Error getting system metrics" }] };
      }
    }
  );

  // Get system health
  server.tool(
    "get-health",
    "Get system health",
    {},
    async () => {
      try {
        // @ts-ignore - The Consul type definitions are incomplete
        const health = await consul.system.health();
        return { content: [{ type: "text", text: `System Health:\n\n${JSON.stringify(health, null, 2)}` }] };
      } catch (error) {
        console.error("Error getting system health:", error);
        return { content: [{ type: "text", text: "Error getting system health" }] };
      }
    }
  );
}

export function registerAdditionalAgentTools(server: McpServer, consul: Consul) {
  // Get agent configuration
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

export function registerAdditionalKVTools(server: McpServer, consul: Consul) {
  // KV transaction
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
}    