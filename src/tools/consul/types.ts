import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import Consul from "consul";

// Base Consul response types
export interface ACLToken {
  ID: string;
  Name: string;
  Type: string;
}

export interface Coordinate {
  Node: string;
  Segment: string;
  Coord: {
    Vec: number[];
    Error: number;
    Adjustment: number;
    Height: number;
  };
}

export interface RaftServer {
  ID: string;
  Address: string;
  Leader: boolean;
  Voter: boolean;
}

export interface RaftConfiguration {
  Servers: RaftServer[];
}

export interface NetworkArea {
  ID: string;
  PeerDatacenter: string;
  RetryJoin: string[];
}

export interface PreparedQuery {
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

export interface AgentMember {
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

export interface Intention {
  ID: string;
  SourceName: string;
  DestinationName: string;
  SourceType: string;
  Action: string;
  Description: string;
}

export interface ConnectCAConfig {
  Provider: string;
  Config: Record<string, any>;
}

export interface License {
  LicenseID: string;
  CustomerID: string;
  InstallationID: string;
  IssueDate: string;
  ExpirationDate: string;
  Product: string;
  Flags: Record<string, any>;
}

export interface Namespace {
  Name: string;
  Description: string;
  ACLs: {
    PolicyDefaults: any[];
    RoleDefaults: any[];
  };
}

export interface Partition {
  Name: string;
  Description: string;
}

// Base tool registration function type
export type ToolRegistrationFunction = (server: McpServer, consul: Consul) => void; 