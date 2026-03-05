import type { Document } from "../../../shared/types";

/**
 * Sort key: manual childOrder first (asc), then updatedAt desc as tiebreaker.
 */
function sortSiblings(a: Document, b: Document) {
	const orderA = a.childOrder ?? 0;
	const orderB = b.childOrder ?? 0;
	if (orderA !== orderB) return orderA - orderB;
	return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

/**
 * Build a tree of documents for a collection: roots have parentId null,
 * children grouped by parentId. Sorts roots and each group by childOrder asc, then updatedAt desc.
 */
export function buildDocumentTree(documents: Document[], collectionId: number) {
	const byCollection = documents.filter((d) => d.collectionId === collectionId);
	const byParent = new Map<number | null, Document[]>();
	for (const doc of byCollection) {
		const key = doc.parentId;
		if (!byParent.has(key)) byParent.set(key, []);
		byParent.get(key)!.push(doc);
	}
	for (const arr of byParent.values()) arr.sort(sortSiblings);
	return byParent;
}

export function getRootDocuments(byParent: Map<number | null, Document[]>) {
	return byParent.get(null) ?? [];
}

export function getChildDocuments(
	byParent: Map<number | null, Document[]>,
	parentId: number | null,
) {
	return byParent.get(parentId) ?? [];
}

/** Collect all descendant document ids under a given document (for drag-drop cycle prevention). */
export function getDescendantIds(
	byParent: Map<number | null, Document[]>,
	parentId: number,
): Set<number> {
	const out = new Set<number>();
	const stack = [parentId];
	while (stack.length > 0) {
		const id = stack.pop()!;
		const children = byParent.get(id) ?? [];
		for (const c of children) {
			out.add(c.id);
			stack.push(c.id);
		}
	}
	return out;
}
