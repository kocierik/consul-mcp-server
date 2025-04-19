# Consul MCP Server

## Overview
This project is a Consul MCP (Model Context Protocol) server that integrates with Consul to provide various functionalities such as service registration, health checks, and key-value store management. It is built using TypeScript and leverages the `@modelcontextprotocol/sdk` and `consul` packages.

## Prerequisites
- Node.js (version 14 or later)
- npm (Node Package Manager)

## Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

## Environment Variables
- `CONSUL_HOST`: The host address for Consul (default is `localhost`).
- `CONSUL_PORT`: The port for Consul (default is `8500`).

## Supported MCP Function Tools

### Health Checks
- **Register a Health Check**
  - Command: `register-health-check`
  - Description: Registers a new health check with Consul.
  - Parameters: `name`, `id`, `serviceId`, `notes`, `ttl`, `http`, `interval`, `timeout`.

- **Deregister a Health Check**
  - Command: `deregister-health-check`
  - Description: Deregisters an existing health check from Consul.
  - Parameters: `id`.

- **Get Health Checks for a Service**
  - Command: `get-health-checks`
  - Description: Retrieves health checks for a specified service.
  - Parameters: `service`.

### Catalog Services
- **List Catalog Services**
  - Command: `list-catalog-services`
  - Description: Lists all services in the Consul catalog.

- **Get Catalog Service Information**
  - Command: `get-catalog-service`
  - Description: Retrieves information about a specific service from the catalog.
  - Parameters: `service`.

### Catalog Nodes
- **Get Catalog Nodes**
  - Command: `get-catalog-nodes`
  - Description: Retrieves nodes from the Consul catalog.

### Service Management
- **Register a Service**
  - Command: `register-service`
  - Description: Registers a new service with Consul.
  - Parameters: `name`, `id`, `port`, `address`, `tags`.

- **Deregister a Service**
  - Command: `deregister-service`
  - Description: Deregisters an existing service from Consul.
  - Parameters: `id`.

- **Get Running Services**
  - Command: `get-services`
  - Description: Retrieves a list of running services.

### Key-Value Store
- **Get KV Pair**
  - Command: `get-kv`
  - Description: Retrieves a value from the KV store.
  - Parameters: `key`.

- **List KV Keys**
  - Command: `list-kv`
  - Description: Lists keys in the KV store.
  - Parameters: `prefix`.

- **Put KV Pair**
  - Command: `put-kv`
  - Description: Puts a value in the KV store.
  - Parameters: `key`, `value`.

- **Delete KV Pair**
  - Command: `delete-kv`
  - Description: Deletes a key from the KV store.
  - Parameters: `key`.

### Session Management
- **List Sessions**
  - Command: `list-sessions`
  - Description: Lists all sessions in Consul.

- **Destroy a Session**
  - Command: `destroy-session`
  - Description: Destroys a session in Consul.
  - Parameters: `id`.

## License
This project is licensed under the ISC License.
