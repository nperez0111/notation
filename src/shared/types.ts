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

/**
 * A document stored in the database: id, metadata, and BlockNote JSON content.
 * Content is the serialized BlockNote document (array of Block objects).
 */
export type Document = {
	id: number;
	createdAt: string;
	updatedAt: string;
	createdBy: string;
	updatedBy: string;
	content: string; // BlockNote JSON (stringified Block[])
};

/**
 * RPC schema for document CRUD between the mainview and the Bun process.
 */
export type DocumentRPC = {
	bun: RPCSchema<{
		requests: {
			getDocuments: { params: {}; response: Document[] };
			getDocument: { params: { id: number }; response: Document | null };
			createDocument: {
				params: { content: string; createdBy: string; updatedBy: string };
				response: Document;
			};
			updateDocument: {
				params: {
					id: number;
					content: string;
					updatedBy: string;
				};
				response: Document | null;
			};
			deleteDocument: { params: { id: number }; response: { success: boolean } };
		};
		messages: {};
	}>;
	webview: RPCSchema<{
		requests: {};
		messages: {};
	}>;
};
