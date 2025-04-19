# Consul MCP Server

A Model Context Protocol (MCP) server that provides access to Consul's functionality through a standardized interface.

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
- Perform KV transactions (atomic operations)

### Sessions
- List sessions
- Destroy sessions

### ACL (Access Control List)
- Create ACL tokens
- List ACL tokens

### Events
- Fire events
- List events

### Coordinates
- Get node coordinates

### Operator
- Get Raft configuration
- Get Autopilot configuration

### Network Areas
- Join network areas
- List network areas

### Prepared Queries
- Create prepared queries
- Execute prepared queries

### Status
- Get current leader
- Get current peers

### Agent
- Get agent members
- Reload agent configuration
- Get agent configuration
- Get agent self information

### Snapshots
- Save Consul state snapshot
- Restore Consul state from snapshot

### Intentions (Service Mesh)
- Create intentions
- List intentions

### Connect (Service Mesh)
- Get Connect CA configuration
- Update Connect CA configuration

### License
- Get current license
- Update license

### Namespaces
- Create namespaces
- List namespaces

### Partitions
- Create partitions
- List partitions

### System
- Get system metrics
- Get system health

## Configuration

The server can be configured using environment variables:

- `CONSUL_HOST`: Consul server host (default: localhost)
- `CONSUL_PORT`: Consul server port (default: 8500)

## Usage

1. Start the server:
```bash
node dist/index.js
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

3. Run tests:
```bash
npm test
```

## License

MIT
