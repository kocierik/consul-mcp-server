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
  registerACLTools,
  registerEventTools,
  registerCoordinateTools,
  registerOperatorTools,
  registerNetworkAreaTools,
  registerPreparedQueryTools,
  registerStatusTools,
  registerAgentTools,
  registerSnapshotTools,
  registerIntentionTools,
  registerConnectTools,
  registerLicenseTools,
  registerNamespaceTools,
  registerPartitionTools,
  registerSystemTools,
  registerAdditionalAgentTools,
  registerAdditionalKVTools
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
  registerACLTools(server, consul);
  registerEventTools(server, consul);
  registerCoordinateTools(server, consul);
  registerOperatorTools(server, consul);
  registerNetworkAreaTools(server, consul);
  registerPreparedQueryTools(server, consul);
  registerStatusTools(server, consul);
  registerAgentTools(server, consul);
  registerSnapshotTools(server, consul);
  registerIntentionTools(server, consul);
  registerConnectTools(server, consul);
  registerLicenseTools(server, consul);
  registerNamespaceTools(server, consul);
  registerPartitionTools(server, consul);
  registerSystemTools(server, consul);
  registerAdditionalAgentTools(server, consul);
  registerAdditionalKVTools(server, consul);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`Consul MCP Server running: @ ${consulHost}:${consulPort}`);
}
