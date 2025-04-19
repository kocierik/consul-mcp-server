export interface ServiceList {
  ID: string;
  Service: string;
  Tags: string[];
  Port: number;
}

export interface HealthCheck {
  Node: string;
  CheckID: string;
  Name: string;
  Status: string;
  Notes: string;
  Output: string;
  ServiceID: string;
  ServiceName: string;
  ServiceTags: string[];
}

export interface CatalogNode {
  Node: string;
  Address: string;
  ServiceID: string;
  ServiceName: string;
  ServiceAddress: string;
  ServicePort: number;
  ServiceTags: string[];
}

export interface KVPair {
  Key: string;
  Value?: string | null;
  Flags: number;
  CreateIndex: number;
  ModifyIndex: number;
}

export interface Session {
  ID: string;
  Name: string;
  Node: string;
  Checks: string[];
  LockDelay: number;
  Behavior: string;
  TTL: string;
}