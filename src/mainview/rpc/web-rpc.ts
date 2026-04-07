/**
 * Web-based RPC implementation using XRPC calls to Nitro API routes.
 * XRPC convention: queries = GET /xrpc/<nsid>?params, procedures = POST /xrpc/<nsid> with JSON body.
 * Namespace: ink.notation.*
 */

import type { RpcMethods } from "../../shared/rpc-types";

type XrpcMethod = "query" | "procedure";

type XrpcRoute = {
  nsid: string;
  type: XrpcMethod;
};

const routes: Record<keyof RpcMethods, XrpcRoute> = {
  getCollections: { nsid: "ink.notation.getCollections", type: "query" },
  getCollection: { nsid: "ink.notation.getCollection", type: "query" },
  createCollection: { nsid: "ink.notation.createCollection", type: "procedure" },
  updateCollection: { nsid: "ink.notation.updateCollection", type: "procedure" },
  deleteCollection: { nsid: "ink.notation.deleteCollection", type: "procedure" },
  getDocuments: { nsid: "ink.notation.getDocuments", type: "query" },
  getDocument: { nsid: "ink.notation.getDocument", type: "query" },
  createDocument: { nsid: "ink.notation.createDocument", type: "procedure" },
  updateDocument: { nsid: "ink.notation.updateDocument", type: "procedure" },
  deleteDocument: { nsid: "ink.notation.deleteDocument", type: "procedure" },
  getPropertyDefinitions: { nsid: "ink.notation.getPropertyDefinitions", type: "query" },
  createPropertyDefinition: { nsid: "ink.notation.createPropertyDefinition", type: "procedure" },
  updatePropertyDefinition: { nsid: "ink.notation.updatePropertyDefinition", type: "procedure" },
  deletePropertyDefinition: { nsid: "ink.notation.deletePropertyDefinition", type: "procedure" },
  reorderPropertyDefinitions: {
    nsid: "ink.notation.reorderPropertyDefinitions",
    type: "procedure",
  },
  reorderChildDocuments: { nsid: "ink.notation.reorderChildDocuments", type: "procedure" },
  getSettings: { nsid: "ink.notation.getSettings", type: "query" },
  setDatabaseMetadata: { nsid: "ink.notation.setDatabaseMetadata", type: "procedure" },
  setSidebarWidth: { nsid: "ink.notation.setSidebarWidth", type: "procedure" },
  blueskyLogin: { nsid: "ink.notation.blueskyLogin", type: "procedure" },
  blueskyLogout: { nsid: "ink.notation.blueskyLogout", type: "procedure" },
  blueskyGetSession: { nsid: "ink.notation.blueskyGetSession", type: "query" },
  publishDocument: { nsid: "ink.notation.publishDocument", type: "procedure" },
  unpublishDocument: { nsid: "ink.notation.unpublishDocument", type: "procedure" },
  getPublishStatus: { nsid: "ink.notation.getPublishStatus", type: "query" },
  openExternal: { nsid: "ink.notation.openExternal", type: "procedure" },
  // Desktop-only (won't be called on web, but needed for type completeness)
  chooseDatabaseDirectory: { nsid: "ink.notation.chooseDatabaseDirectory", type: "query" },
  setDatabaseLocation: { nsid: "ink.notation.setDatabaseLocation", type: "procedure" },
  reloadDatabase: { nsid: "ink.notation.reloadDatabase", type: "procedure" },
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
