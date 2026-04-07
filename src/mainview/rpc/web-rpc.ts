/**
 * Web-based RPC implementation using XRPC calls to Nitro API routes.
 * XRPC convention: queries = GET /xrpc/<nsid>?params, procedures = POST /xrpc/<nsid> with JSON body.
 * Namespace: app.phoenix.*
 */

import type { RpcMethods } from "../../shared/rpc-types";

type XrpcMethod = "query" | "procedure";

type XrpcRoute = {
  nsid: string;
  type: XrpcMethod;
};

const routes: Record<keyof RpcMethods, XrpcRoute> = {
  getCollections: { nsid: "app.phoenix.getCollections", type: "query" },
  getCollection: { nsid: "app.phoenix.getCollection", type: "query" },
  createCollection: { nsid: "app.phoenix.createCollection", type: "procedure" },
  updateCollection: { nsid: "app.phoenix.updateCollection", type: "procedure" },
  deleteCollection: { nsid: "app.phoenix.deleteCollection", type: "procedure" },
  getDocuments: { nsid: "app.phoenix.getDocuments", type: "query" },
  getDocument: { nsid: "app.phoenix.getDocument", type: "query" },
  createDocument: { nsid: "app.phoenix.createDocument", type: "procedure" },
  updateDocument: { nsid: "app.phoenix.updateDocument", type: "procedure" },
  deleteDocument: { nsid: "app.phoenix.deleteDocument", type: "procedure" },
  getPropertyDefinitions: { nsid: "app.phoenix.getPropertyDefinitions", type: "query" },
  createPropertyDefinition: { nsid: "app.phoenix.createPropertyDefinition", type: "procedure" },
  updatePropertyDefinition: { nsid: "app.phoenix.updatePropertyDefinition", type: "procedure" },
  deletePropertyDefinition: { nsid: "app.phoenix.deletePropertyDefinition", type: "procedure" },
  reorderPropertyDefinitions: { nsid: "app.phoenix.reorderPropertyDefinitions", type: "procedure" },
  reorderChildDocuments: { nsid: "app.phoenix.reorderChildDocuments", type: "procedure" },
  getSettings: { nsid: "app.phoenix.getSettings", type: "query" },
  setDatabaseMetadata: { nsid: "app.phoenix.setDatabaseMetadata", type: "procedure" },
  setSidebarWidth: { nsid: "app.phoenix.setSidebarWidth", type: "procedure" },
  blueskyLogin: { nsid: "app.phoenix.blueskyLogin", type: "procedure" },
  blueskyLogout: { nsid: "app.phoenix.blueskyLogout", type: "procedure" },
  blueskyGetSession: { nsid: "app.phoenix.blueskyGetSession", type: "query" },
  publishDocument: { nsid: "app.phoenix.publishDocument", type: "procedure" },
  unpublishDocument: { nsid: "app.phoenix.unpublishDocument", type: "procedure" },
  getPublishStatus: { nsid: "app.phoenix.getPublishStatus", type: "query" },
  openExternal: { nsid: "app.phoenix.openExternal", type: "procedure" },
  // Desktop-only (won't be called on web, but needed for type completeness)
  chooseDatabaseDirectory: { nsid: "app.phoenix.chooseDatabaseDirectory", type: "query" },
  setDatabaseLocation: { nsid: "app.phoenix.setDatabaseLocation", type: "procedure" },
  reloadDatabase: { nsid: "app.phoenix.reloadDatabase", type: "procedure" },
};

async function xrpcCall(route: XrpcRoute, params: Record<string, unknown>): Promise<unknown> {
  const url = `/xrpc/${route.nsid}`;

  if (route.type === "query") {
    // GET with query params (skip empty/undefined values)
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.set(key, JSON.stringify(value));
      }
    }
    const queryString = searchParams.toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    const response = await fetch(fullUrl);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error((error as { message?: string }).message ?? `XRPC error: ${response.status}`);
    }
    return response.json();
  }

  // POST with JSON body
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error((error as { message?: string }).message ?? `XRPC error: ${response.status}`);
  }
  // Some procedures return void (204)
  if (response.status === 204) return undefined;
  return response.json();
}

/**
 * Create an RpcMethods implementation backed by XRPC HTTP calls.
 */
export function createWebRpc(): RpcMethods {
  const handler = {} as Record<string, (params: Record<string, unknown>) => Promise<unknown>>;

  for (const [method, route] of Object.entries(routes)) {
    // Special case: openExternal uses window.open on web
    if (method === "openExternal") {
      handler[method] = async (params: Record<string, unknown>) => {
        window.open(params.url as string, "_blank");
        return { success: true };
      };
      continue;
    }
    handler[method] = (params: Record<string, unknown>) => xrpcCall(route, params);
  }

  return handler as unknown as RpcMethods;
}
