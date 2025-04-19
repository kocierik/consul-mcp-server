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
