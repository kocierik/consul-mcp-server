import { ServiceList, HealthCheck, CatalogNode, KVPair, Session } from "../types/consul.js";

export function formatService(feature: ServiceList): string {
  const props = feature;
  return [
    `ID: ${props.ID || "Unknown"}`,
    `Port: ${props.Port || "Unknown"}`,
    `Service: ${props.Service || "Unknown"}`,
    `Tags: ${props.Tags || "Unknown"}`,
    "---",
  ].join("\n");
}

export function formatHealthCheck(check: HealthCheck): string {
  return [
    `Node: ${check.Node || "Unknown"}`,
    `CheckID: ${check.CheckID || "Unknown"}`,
    `Name: ${check.Name || "Unknown"}`,
    `Status: ${check.Status || "Unknown"}`,
    `ServiceName: ${check.ServiceName || "Unknown"}`,
    `Output: ${check.Output || "No output"}`,
    "---",
  ].join("\n");
}

export function formatCatalogNode(node: CatalogNode): string {
  return [
    `Node: ${node.Node || "Unknown"}`,
    `Address: ${node.Address || "Unknown"}`,
    `ServiceID: ${node.ServiceID || "Unknown"}`,
    `ServiceName: ${node.ServiceName || "Unknown"}`,
    `ServicePort: ${node.ServicePort || "Unknown"}`,
    `ServiceTags: ${node.ServiceTags?.join(", ") || "None"}`,
    "---",
  ].join("\n");
}

export function formatKVPair(pair: KVPair): string {
  // Decode base64 value if it exists
  let value = "No value";
  if (pair.Value !== null && pair.Value !== undefined) {
    try {
      // Consul stores values as base64 encoded strings
      value = atob(pair.Value);
    } catch (e) {
      value = pair.Value;
    }
  }
  
  return [
    `Key: ${pair.Key || "Unknown"}`,
    `Value: ${value}`,
    `Flags: ${pair.Flags || 0}`,
    `Last Modified Index: ${pair.ModifyIndex || "Unknown"}`,
    "---",
  ].join("\n");
}

export function formatSession(session: Session): string {
  return [
    `ID: ${session.ID || "Unknown"}`,
    `Name: ${session.Name || "Unknown"}`,
    `Node: ${session.Node || "Unknown"}`,
    `Checks: ${session.Checks?.join(", ") || "None"}`,
    `LockDelay: ${session.LockDelay || "Unknown"}`,
    `Behavior: ${session.Behavior || "Unknown"}`,
    `TTL: ${session.TTL || "Unknown"}`,
    "---",
  ].join("\n");
}