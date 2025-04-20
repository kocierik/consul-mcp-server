# Consul MCP Server 🚀 

A Model Context Protocol (MCP) server that provides access to Consul's functionality through a standardized interface.
<p align="center">
<a  href="https://glama.ai/mcp/servers/@kocierik/consul-mcp-server">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@kocierik/consul-mcp-server/badge" alt="Consul Server MCP server" />
</a>
<center>
<video src="https://github.com/user-attachments/assets/81bf7d70-e837-4c99-8312-2c85ccace1f4"></video>
</center>
</p>

## Features
The server provides access to the following Consul functionality:

### Service Management
- List running services
- Register and deregister services
- Get service information
- List catalog services
- Get catalog service information

### Health Checks
- Register health checks
- Deregister health checks
- Get health checks for services

### Key-Value Store
- Get values from KV store
- List keys in KV store
- Put values in KV store
- Delete keys from KV store

### Sessions
- List sessions
- Destroy sessions

### Events
- Fire events
- List events

### Prepared Queries
- Create prepared queries
- Execute prepared queries

### Status
- Get current leader
- Get current peers

### Agent
- Get agent members
- Get agent self information

### System
- Get system health service information

## Configuration

The server can be configured using environment variables:

- `CONSUL_HOST`: Consul server host (default: localhost)
- `CONSUL_PORT`: Consul server port (default: 8500)

## Usage

1. Start the server:
```bash
node build/index.js
```

2. The server will connect to Consul and make all functionality available through the MCP interface.

## Development

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Run inspector:
```bash
 npm run build && npx @modelcontextprotocol/inspector node build/index.js
```

## Claude config

```json
{
    "mcpServers": {
        "consul-mcp": {
            "command": "node",
            "args": [
                "/ABSOLUTE/PATH/TO/PARENT/FOLDER/consul-mcp-server/build/index.js"
            ]
        }
    }
}
```

## License

MIT
