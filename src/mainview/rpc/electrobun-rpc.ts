/**
 * Electrobun-specific RPC implementation.
 * Wraps Electroview.defineRPC and adapts it to the platform-agnostic RpcMethods interface.
 */

import { Electroview } from "electrobun/view";
import type { DocumentRPC } from "../../shared/types";
import type { RpcMethods } from "../../shared/rpc-types";

const rpc = Electroview.defineRPC<DocumentRPC>({
  maxRequestTime: 5000,
  handlers: {
    requests: {
      openSettings: () => {
        window.dispatchEvent(new CustomEvent("open-settings"));
      },
    },
    messages: {},
  },
});

const electroview = new Electroview({ rpc });

/**
 * Create an RpcMethods implementation backed by Electrobun IPC.
 */
export function createElectrobunRpc(): RpcMethods {
  const request = electroview.rpc!.request;

  // The Electrobun request function matches our RpcMethods shape directly.
  // Each method name maps to the same-named RPC call.
  return {
    getCollections: (params) => request("getCollections", params),
    getCollection: (params) => request("getCollection", params),
    createCollection: (params) => request("createCollection", params),
    updateCollection: (params) => request("updateCollection", params),
    deleteCollection: (params) => request("deleteCollection", params),
    getDocuments: (params) => request("getDocuments", params),
    getDocument: (params) => request("getDocument", params),
    createDocument: (params) => request("createDocument", params),
    updateDocument: (params) => request("updateDocument", params),
    deleteDocument: (params) => request("deleteDocument", params),
    getPropertyDefinitions: (params) => request("getPropertyDefinitions", params),
    createPropertyDefinition: (params) => request("createPropertyDefinition", params),
    updatePropertyDefinition: (params) => request("updatePropertyDefinition", params),
    deletePropertyDefinition: (params) => request("deletePropertyDefinition", params),
    reorderPropertyDefinitions: (params) => request("reorderPropertyDefinitions", params),
    reorderChildDocuments: (params) => request("reorderChildDocuments", params),
    getSettings: (params) => request("getSettings", params),
    setDatabaseMetadata: (params) => request("setDatabaseMetadata", params),
    setSidebarWidth: (params) => request("setSidebarWidth", params),
    blueskyLogin: (params) => request("blueskyLogin", params),
    blueskyLogout: (params) => request("blueskyLogout", params),
    blueskyGetSession: (params) => request("blueskyGetSession", params),
    publishDocument: (params) => request("publishDocument", params),
    unpublishDocument: (params) => request("unpublishDocument", params),
    getPublishStatus: (params) => request("getPublishStatus", params),
    openExternal: (params) => request("openExternal", params),
    // Desktop-only methods
    chooseDatabaseDirectory: (params) => request("chooseDatabaseDirectory", params),
    setDatabaseLocation: (params) => request("setDatabaseLocation", params),
    reloadDatabase: (params) => request("reloadDatabase", params),
  };
}
