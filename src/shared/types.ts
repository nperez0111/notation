import type { RPCSchema } from "electrobun/bun";

/**
 * Metadata for a stored document (createdAt, updatedAt, createdBy, updatedBy).
 */
export type DocumentMetadata = {
	createdAt: string;
	updatedAt: string;
	createdBy: string;
	updatedBy: string;
};

/** Supported property types. Values stored as strings and parsed by type. */
export type PropertyType =
	| "string"
	| "number"
	| "date"
	| "time"
	| "checkbox";

/** A property definition for a single collection (label + type). */
export type Property = {
	id: number;
	collectionId: number;
	label: string;
	type: PropertyType;
};

/** Document property values: map of property id → string value (parsed by property type). */
export type DocumentPropertyValues = Record<number, string>;

/** A collection that groups documents. */
export type Collection = {
	id: number;
	name: string;
	createdAt: string;
	updatedAt: string;
};

/**
 * Document icon: either a key from the fixed DOCUMENT_ICON set (e.g. "file", "star")
 * or a single emoji character. Stored as a single string; if it matches a fixed key we
 * render that icon, otherwise we render it as emoji.
 */
export type DocumentIcon = string | null;

/** Fixed set of icon keys for documents. Values not in this set are treated as emoji. */
export const DOCUMENT_ICON_KEYS = [
	"file",
	"folder",
	"star",
	"heart",
	"pin",
	"lightbulb",
	"document",
	"note",
] as const;
export type DocumentIconKey = (typeof DOCUMENT_ICON_KEYS)[number];

/**
 * A document stored in the database: id, title, metadata, content, and property values.
 * - content: BlockNote JSON (stringified Block[]).
 * - properties: JSON string of DocumentPropertyValues (Record<propertyId, string>).
 * - collectionId: which collection this document belongs to.
 * - parentId: optional parent document for nesting; null means top-level in the collection.
 * - icon: optional DocumentIcon (fixed key or emoji string).
 */
export type Document = {
	id: number;
	title: string;
	createdAt: string;
	updatedAt: string;
	createdBy: string;
	updatedBy: string;
	content: string;
	properties: string; // JSON: Record<Property['id'], string>
	collectionId: number;
	parentId: number | null;
	/** Optional icon: fixed icon key or emoji string. */
	icon?: DocumentIcon;
};

/** Settings info returned to the UI (database path and document count for prompts). */
export type SettingsInfo = {
	dbPath: string;
	dbDirectory: string;
	documentCount: number;
	/** Display name for the current database (defaults to folder name). */
	databaseName?: string;
	/** Optional database icon as data URL (e.g. uploaded image). */
	databaseIcon?: string | null;
	/** Recently opened database directories for switcher. */
	recentDatabases?: { directory: string; name: string }[];
	/** Sidebar width in pixels (persisted in settings). */
	sidebarWidth?: number;
};

/**
 * RPC schema for document CRUD between the mainview and the Bun process.
 */
export type DocumentRPC = {
	bun: RPCSchema<{
		requests: {
			getCollections: { params: {}; response: Collection[] };
			getCollection: { params: { id: number }; response: Collection | null };
			createCollection: {
				params: { name: string };
				response: Collection;
			};
			updateCollection: {
				params: { id: number; name: string };
				response: Collection | null;
			};
			deleteCollection: { params: { id: number }; response: { success: boolean } };
			getDocuments: { params: {}; response: Document[] };
			getDocument: { params: { id: number }; response: Document | null };
			createDocument: {
				params: {
					title: string;
					content: string;
					createdBy: string;
					updatedBy: string;
					properties?: string;
					collectionId: number;
					parentId?: number | null;
					icon?: DocumentIcon;
				};
				response: Document;
			};
			updateDocument: {
				params: {
					id: number;
					title?: string;
					content?: string;
					updatedBy: string;
					properties?: string;
					collectionId?: number;
					parentId?: number | null;
					icon?: DocumentIcon;
				};
				response: Document | null;
			};
			deleteDocument: { params: { id: number }; response: { success: boolean } };
			getPropertyDefinitions: {
				params: { collectionId: number };
				response: Property[];
			};
			createPropertyDefinition: {
				params: { collectionId: number; label: string; type: PropertyType };
				response: Property;
			};
			updatePropertyDefinition: {
				params: { id: number; label?: string; type?: PropertyType };
				response: Property | null;
			};
			deletePropertyDefinition: {
				params: { id: number };
				response: { success: boolean };
			};
			reorderPropertyDefinitions: {
				params: { orderedIds: number[] };
				response: void;
			};
			getSettings: { params: {}; response: SettingsInfo };
			chooseDatabaseDirectory: { params: {}; response: string | null };
			setDatabaseLocation: {
				params: { directory: string; mode: "new" | "move" };
				response: { success: boolean };
			};
			setDatabaseMetadata: {
				params: { name?: string; icon?: string | null };
				response: { success: boolean };
			};
			setSidebarWidth: {
				params: { width: number };
				response: { success: boolean };
			};
			reloadDatabase: { params: {}; response: { success: boolean } };
		};
		messages: {};
	}>;
	webview: RPCSchema<{
		requests: {
			/** Called from main process when user chooses Preferences from the app menu. */
			openSettings: { params: {}; response: void };
		};
		messages: {};
	}>;
};
