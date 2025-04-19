import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  registerHealthChecks, 
  registerCatalogNodes, 
  registerCatalogServices, 
  registerAgentServices, 
  registerKVStore,
  registerServiceList,
  registerSessionTools,
  // registerACLTools,
  registerEventTools,
  registerPreparedQueryTools,
  registerStatusTools,
  registerAgentTools,
  registerAdditionalAgentTools,
} from "./tools/consulTools.js";
import Consul from "consul";

export async function startServer() {
  const server = new McpServer({
    name: "consul-mcp",
    version: "1.0.0",
  });

  // Consul config
  const consulHost = process.env.CONSUL_HOST || "localhost";
  const consulPort = parseInt(process.env.CONSUL_PORT || "8500", 10);

  const consul = new Consul({
    host: consulHost,
    port: consulPort,
  });

  // Consul tools
  registerServiceList(server, consul);
  registerHealthChecks(server, consul);
  registerCatalogNodes(server, consul);
  registerCatalogServices(server, consul);
  registerAgentServices(server, consul);
  registerKVStore(server, consul);
  registerSessionTools(server, consul);
//  registerACLTools(server, consul);
  registerEventTools(server, consul);
  registerPreparedQueryTools(server, consul);
  registerStatusTools(server, consul);
  registerAgentTools(server, consul);
  registerAdditionalAgentTools(server, consul);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`Consul MCP Server running: @ ${consulHost}:${consulPort}`);
}
