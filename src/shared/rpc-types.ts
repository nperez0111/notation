/**
 * Platform-agnostic RPC method signatures.
 * No Electrobun dependencies — used by both desktop (Electrobun IPC) and web (HTTP fetch) clients.
 */

import type {
  BlueskySession,
  Collection,
  Document,
  DocumentIcon,
  Property,
  PropertyType,
  PublishStatus,
  SettingsInfo,
} from "./types";

/**
 * All RPC methods available on both platforms.
 * Desktop-only methods are optional (not available on web).
 */
export type RpcMethods = {
  getCollections: (params: {}) => Promise<Collection[]>;
  getCollection: (params: { id: number }) => Promise<Collection | null>;
  createCollection: (params: { name: string }) => Promise<Collection>;
  updateCollection: (params: { id: number; name: string }) => Promise<Collection | null>;
  deleteCollection: (params: { id: number }) => Promise<{ success: boolean }>;

  getDocuments: (params: {}) => Promise<Document[]>;
  getDocument: (params: { id: number }) => Promise<Document | null>;
  createDocument: (params: {
    title: string;
    content: string;
    createdBy: string;
    updatedBy: string;
    properties?: string;
    collectionId: number;
    parentId?: number | null;
    icon?: DocumentIcon;
  }) => Promise<Document>;
  updateDocument: (params: {
    id: number;
    title?: string;
    content?: string;
    updatedBy: string;
    properties?: string;
    collectionId?: number;
    parentId?: number | null;
    icon?: DocumentIcon;
  }) => Promise<Document | null>;
  deleteDocument: (params: { id: number }) => Promise<{ success: boolean }>;

  getPropertyDefinitions: (params: { collectionId: number }) => Promise<Property[]>;
  createPropertyDefinition: (params: {
    collectionId: number;
    label: string;
    type: PropertyType;
  }) => Promise<Property>;
  updatePropertyDefinition: (params: {
    id: number;
    label?: string;
    type?: PropertyType;
  }) => Promise<Property | null>;
  deletePropertyDefinition: (params: { id: number }) => Promise<{ success: boolean }>;
  reorderPropertyDefinitions: (params: { orderedIds: number[] }) => Promise<void>;

  reorderChildDocuments: (params: {
    collectionId: number;
    parentId: number | null;
    orderedIds: number[];
  }) => Promise<void>;

  getSettings: (params: {}) => Promise<SettingsInfo>;
  setDatabaseMetadata: (params: {
    name?: string;
    icon?: string | null;
  }) => Promise<{ success: boolean }>;
  setSidebarWidth: (params: { width: number }) => Promise<{ success: boolean }>;

  blueskyLogin: (params: {
    handle: string;
    appPassword: string;
  }) => Promise<{ success: boolean; handle: string; did: string }>;
  blueskyLogout: (params: {}) => Promise<{ success: boolean }>;
  blueskyGetSession: (params: {}) => Promise<BlueskySession | null>;

  publishDocument: (params: { id: number }) => Promise<{ uri: string; cid: string }>;
  unpublishDocument: (params: { id: number }) => Promise<{ success: boolean }>;
  getPublishStatus: (params: { id: number }) => Promise<PublishStatus | null>;

  openExternal: (params: { url: string }) => Promise<{ success: boolean }>;

  // Desktop-only methods (web implementations throw UnsupportedError)
  chooseDatabaseDirectory: (params: {}) => Promise<string | null>;
  setDatabaseLocation: (params: {
    directory: string;
    mode: "new" | "move";
  }) => Promise<{ success: boolean }>;
  reloadDatabase: (params: {}) => Promise<{ success: boolean }>;
};
