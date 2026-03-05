import { useState, useRef, useEffect } from "react";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import type { Collection, Document } from "../../../shared/types";
import { StatefulPopover } from "baseui/popover";
import { DocumentListItem } from "./DocumentListItem";
import {
	buildDocumentTree,
	getRootDocuments,
	getChildDocuments,
	getDescendantIds,
} from "./documentTree";

type CollectionSectionProps = {
	collection: Collection;
	documents: Document[];
	selectedId: number | null;
	onSelect: (id: number) => void;
	onCreateDocument: (collectionId: number, parentId?: number | null) => void;
	onRenameCollection?: (id: number, name: string) => void;
	onIconChange?: (documentId: number, icon: Document["icon"]) => void;
	onReparentDocument?: (documentId: number, collectionId: number, parentId: number | null) => void;
};

type DropData = { key: string; collectionId: number; parentId: number | null; indent: number; edge: "top" | "bottom" };

const DEPTH_PADDING = 12;

function SidebarDropStrip({
	dropKey,
	collectionId,
	parentId,
	indent,
	edge,
	showLine,
	activeDrop,
	setActiveDrop,
	canDrop,
	onDrop,
	children,
}: {
	dropKey: string;
	collectionId: number;
	parentId: number | null;
	indent: number;
	edge: "top" | "bottom";
	/** When false, no line is shown (used for "drop onto" child zone; highlight is on the row instead). */
	showLine?: boolean;
	activeDrop: DropData | null;
	setActiveDrop: (d: DropData | null) => void;
	canDrop: (args: { source: { data: Record<string, unknown> } }) => boolean;
	onDrop: (documentId: number) => void;
	children?: React.ReactNode;
}) {
	const showLineIndicator = showLine !== false;
	const ref = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		return dropTargetForElements({
			element: el,
			getData: () => ({ type: "sidebar-drop" as const, dropKey, collectionId, parentId, indent }),
			canDrop,
			getIsSticky: () => true,
			onDragEnter: () => setActiveDrop({ key: dropKey, collectionId, parentId, indent, edge }),
			onDragLeave: () => setActiveDrop(null),
			onDrop: ({ source }) => {
				const data = source.data as { type?: string; documentId?: number };
				if (data.type === "sidebar-doc" && typeof data.documentId === "number") {
					onDrop(data.documentId);
				}
				setActiveDrop(null);
			},
		});
	}, [dropKey, collectionId, parentId, indent, edge, canDrop, onDrop, setActiveDrop]);

	const isActive = activeDrop?.key === dropKey;
	return (
		<div ref={ref} className="relative min-h-px shrink-0">
			{showLineIndicator && isActive && (
				<div
					className="absolute left-0 right-0 z-10 h-0.5 bg-[var(--color-accent)]"
					style={{
						...(edge === "bottom" ? { bottom: 0, top: "auto" } : { top: 0 }),
						...(indent > 0 ? { left: indent * DEPTH_PADDING } : {}),
					}}
					aria-hidden
				/>
			)}
			{children}
		</div>
	);
}

function DocumentTreeItem({
	doc,
	depth,
	collectionId,
	byParent,
	selectedId,
	onSelect,
	onCreateDocument,
	onIconChange,
	onReparentDocument,
	activeDrop,
	setActiveDrop,
	showAsDropTargetChild,
}: {
	doc: Document;
	depth: number;
	collectionId: number;
	byParent: Map<number | null, Document[]>;
	selectedId: number | null;
	onSelect: (id: number) => void;
	onCreateDocument: (collectionId: number, parentId?: number | null) => void;
	onIconChange?: (documentId: number, icon: Document["icon"]) => void;
	onReparentDocument?: (documentId: number, collectionId: number, parentId: number | null) => void;
	activeDrop: DropData | null;
	setActiveDrop: (d: DropData | null) => void;
	/** When true, this row is a child of the current "drop onto" target and shows lighter highlight. */
	showAsDropTargetChild?: boolean;
}) {
	const children = getChildDocuments(byParent, doc.id);
	const [expanded, setExpanded] = useState(true);
	const rowRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = rowRef.current;
		if (!el || !onReparentDocument) return;
		return draggable({
			element: el,
			getInitialData: () => ({ type: "sidebar-doc" as const, documentId: doc.id, collectionId }),
		});
	}, [doc.id, collectionId, onReparentDocument]);

	const handleReparent = (documentId: number, targetCollectionId: number, targetParentId: number | null) => {
		onReparentDocument?.(documentId, targetCollectionId, targetParentId);
	};

	/** Forbid dropping if the move would make the document its own ancestor (parent into itself or into a descendant). */
	const wouldCreateCycle = (sourceId: number, newParentId: number | null) => {
		if (newParentId === null) return false;
		if (newParentId === sourceId) return true; // would be own parent
		const descendantsOfSource = getDescendantIds(byParent, sourceId);
		return descendantsOfSource.has(newParentId);
	};

	const canDropSibling = ({ source }: { source: { data: Record<string, unknown> } }) => {
		if (source.data.type !== "sidebar-doc") return false;
		const documentId = source.data.documentId as number;
		if (documentId === doc.id) return false;
		if (wouldCreateCycle(documentId, doc.parentId)) return false;
		return true;
	};

	const canDropChild = ({ source }: { source: { data: Record<string, unknown> } }) => {
		if (source.data.type !== "sidebar-doc") return false;
		const documentId = source.data.documentId as number;
		if (documentId === doc.id) return false; // drop onto self
		if (wouldCreateCycle(documentId, doc.id)) return false; // drop onto a descendant of self
		return true;
	};

	return (
		<>
			<SidebarDropStrip
				dropKey={`before-${doc.id}`}
				collectionId={collectionId}
				parentId={doc.parentId}
				indent={depth}
				edge="top"
				activeDrop={activeDrop}
				setActiveDrop={setActiveDrop}
				canDrop={canDropSibling}
				onDrop={(id) => handleReparent(id, collectionId, doc.parentId)}
			/>
			<div
				ref={rowRef}
				className="list-row cursor-grab active:cursor-grabbing"
				role="listitem"
			>
				<DocumentListItem
					document={doc}
					isSelected={selectedId === doc.id}
					onSelect={() => onSelect(doc.id)}
					depth={depth}
					onCreateChild={
						collectionId != null
							? () => onCreateDocument(collectionId, doc.id)
							: undefined
					}
					hasChildren={children.length > 0}
					expanded={expanded}
					onToggleExpand={children.length > 0 ? () => setExpanded((e) => !e) : undefined}
					onIconChange={onIconChange}
					dropTargetHighlight={
						activeDrop?.key === `child-${doc.id}` ? "parent" : showAsDropTargetChild ? "child" : undefined
					}
				/>
			</div>
			<SidebarDropStrip
				dropKey={`child-${doc.id}`}
				collectionId={collectionId}
				parentId={doc.id}
				indent={depth + 1}
				edge="top"
				showLine={false}
				activeDrop={activeDrop}
				setActiveDrop={setActiveDrop}
				canDrop={canDropChild}
				onDrop={(id) => handleReparent(id, collectionId, doc.id)}
			/>
			{expanded &&
				children.map((child) => (
					<DocumentTreeItem
						key={child.id}
						doc={child}
						depth={depth + 1}
						collectionId={collectionId}
						byParent={byParent}
						selectedId={selectedId}
						onSelect={onSelect}
						onCreateDocument={onCreateDocument}
						onIconChange={onIconChange}
						onReparentDocument={onReparentDocument}
						activeDrop={activeDrop}
						setActiveDrop={setActiveDrop}
						showAsDropTargetChild={activeDrop?.key === `child-${doc.id}`}
					/>
				))}
			<SidebarDropStrip
				dropKey={`after-${doc.id}`}
				collectionId={collectionId}
				parentId={doc.parentId}
				indent={depth}
				edge="bottom"
				activeDrop={activeDrop}
				setActiveDrop={setActiveDrop}
				canDrop={canDropSibling}
				onDrop={(id) => handleReparent(id, collectionId, doc.parentId)}
			/>
		</>
	);
}

export function CollectionSection({
	collection,
	documents,
	selectedId,
	onSelect,
	onCreateDocument,
	onRenameCollection,
	onIconChange,
	onReparentDocument,
}: CollectionSectionProps) {
	const [expanded, setExpanded] = useState(true);
	const [editingName, setEditingName] = useState(false);
	const [editValue, setEditValue] = useState(collection.name);
	const [activeDrop, setActiveDrop] = useState<DropData | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const sidebarPopoverOverrides = {
		Body: {
			style: {
				borderRadius: "8px",
				boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
				backgroundColor: "var(--color-surface)",
				border: "1px solid var(--color-border)",
				minWidth: "120px",
			},
		},
		Inner: { style: {} },
	};

	const byParent = buildDocumentTree(documents, collection.id);
	const roots = getRootDocuments(byParent);

	const startEditingName = () => {
		setEditValue(collection.name);
		setEditingName(true);
	};

	// Focus input when entering rename mode
	useEffect(() => {
		if (editingName) {
			inputRef.current?.focus();
			inputRef.current?.select();
		}
	}, [editingName]);

	const submitRename = () => {
		const trimmed = editValue.trim();
		if (trimmed && trimmed !== collection.name && onRenameCollection) {
			onRenameCollection(collection.id, trimmed);
		}
		setEditingName(false);
	};

	return (
		<section className="border-b border-border/60 last:border-b-0">
			<div className="flex w-full items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold tracking-wide text-text-subtle">
				<button
					type="button"
					onClick={() => setExpanded((e) => !e)}
					className="group flex min-w-0 flex-1 items-center gap-1.5 rounded px-1.5 py-0.5 text-left hover:bg-surface-hover"
					aria-expanded={expanded}
				>
					{editingName ? (
						<input
							ref={inputRef}
							type="text"
							value={editValue}
							onChange={(e) => setEditValue(e.target.value)}
							onBlur={submitRename}
							onKeyDown={(e) => {
								if (e.key === "Enter") submitRename();
								if (e.key === "Escape") {
									setEditValue(collection.name);
									setEditingName(false);
								}
							}}
							className="min-w-0 flex-1 rounded bg-[var(--color-bg)] px-1.5 py-0.5 text-inherit outline-none ring-1 ring-border focus:ring-accent"
							aria-label="Rename collection"
						/>
					) : (
						<span className="min-w-0 flex-1 truncate uppercase">
							{collection.name}
						</span>
					)}
					<span
						className={`ml-1 inline-block shrink-0 text-[0.65rem] text-text-subtle transition-transform ${
							expanded ? "rotate-90" : ""
						}`}
						aria-hidden
					>
						▸
					</span>
				</button>
				{onRenameCollection && !editingName && (
					<StatefulPopover
						placement="bottomRight"
						content={({ close }) => (
							<div className="py-1" role="menu">
								<button
									type="button"
									role="menuitem"
									className="w-full px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-surface-hover"
									onClick={() => {
										startEditingName();
										close();
									}}
								>
									Rename
								</button>
							</div>
						)}
						overrides={sidebarPopoverOverrides}
					>
						<button
							type="button"
							className="shrink-0 rounded p-1 text-text-muted hover:bg-surface-hover hover:text-[var(--color-text)]"
							aria-label="Collection menu"
							aria-haspopup="true"
						>
							⋯
						</button>
					</StatefulPopover>
				)}
			</div>
			{expanded && (
				<div className="pb-1">
					<div className="mt-0 flex flex-col gap-0 px-2" role="list">
						{onReparentDocument && (
							<SidebarDropStrip
								dropKey="before-first"
								collectionId={collection.id}
								parentId={null}
								indent={0}
								edge="top"
								activeDrop={activeDrop}
								setActiveDrop={setActiveDrop}
								canDrop={({ source }) => source.data.type === "sidebar-doc"}
								onDrop={(id) => onReparentDocument(id, collection.id, null)}
							/>
						)}
						{roots.map((doc) => (
							<DocumentTreeItem
								key={doc.id}
								doc={doc}
								depth={0}
								collectionId={collection.id}
								byParent={byParent}
								selectedId={selectedId}
								onSelect={onSelect}
								onCreateDocument={onCreateDocument}
								onIconChange={onIconChange}
								onReparentDocument={onReparentDocument}
								activeDrop={activeDrop}
								setActiveDrop={setActiveDrop}
							/>
						))}
					</div>
				</div>
			)}
		</section>
	);
}
