import { useState, useRef, useEffect } from "react";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import type { Document } from "../../../shared/types";
import { DocumentIconView } from "../documents/DocumentIconView";

type ChildDocumentsSectionProps = {
  /** Child documents in display order (already sorted by childOrder). */
  docs: Document[];
  onNavigate: (id: number) => void;
  onReorder: (orderedIds: number[]) => void;
};

type DropEdge = "top" | "bottom";

function ChildDocRow({
  doc,
  index,
  onNavigate,
  onReorder,
}: {
  doc: Document;
  index: number;
  onNavigate: (id: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const [dropIndicatorEdge, setDropIndicatorEdge] = useState<DropEdge | null>(null);

  useEffect(() => {
    const rowEl = rowRef.current;
    const handleEl = handleRef.current;
    if (!rowEl || !handleEl) return;
    return combine(
      draggable({
        element: rowEl,
        dragHandle: handleEl,
        getInitialData: () => ({ type: "child-doc" as const, documentId: doc.id, index }),
      }),
      dropTargetForElements({
        element: rowEl,
        getData: ({ input, element }) => {
          const rect = element.getBoundingClientRect();
          const mid = rect.top + rect.height / 2;
          const edge: DropEdge = input.clientY < mid ? "top" : "bottom";
          return { type: "child-doc" as const, index, edge };
        },
        canDrop: ({ source }) => source.data.type === "child-doc" && source.data.index !== index,
        getIsSticky: () => true,
        onDragEnter: ({ self }) => {
          const edge = (self.data.edge as DropEdge) ?? null;
          setDropIndicatorEdge(edge);
        },
        onDrag: ({ self }) => {
          const edge = (self.data.edge as DropEdge) ?? null;
          setDropIndicatorEdge(edge);
        },
        onDragLeave: () => setDropIndicatorEdge(null),
        onDrop: ({ source, self }) => {
          setDropIndicatorEdge(null);
          const from = source.data.index as number;
          const edge = (self.data.edge as DropEdge) ?? "bottom";
          const toIndex = edge === "top" ? index : index + 1;
          if (from !== toIndex) onReorder(from, toIndex);
        },
      }),
    );
  }, [doc.id, index, onReorder]);

  const title = doc.title?.trim() || "Untitled";

  return (
    <div
      ref={rowRef}
      className="group relative flex items-center gap-2 rounded-md py-1"
      data-child-doc-row
    >
      {dropIndicatorEdge === "top" && (
        <div
          className="absolute left-0 right-0 top-0 z-10 h-0.5 bg-[var(--color-accent)]"
          aria-hidden
        />
      )}
      {dropIndicatorEdge === "bottom" && (
        <div
          className="absolute bottom-0 left-0 right-0 z-10 h-0.5 bg-[var(--color-accent)]"
          aria-hidden
        />
      )}
      <div
        ref={handleRef}
        className="flex shrink-0 cursor-grab touch-none items-center py-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M8 6h2v2H8V6zm0 5h2v2H8v-2zm0 5h2v2H8v-2zm5-10h2v2h-2V6zm0 5h2v2h-2v-2zm0 5h2v2h-2v-2z" />
        </svg>
      </div>
      <button
        type="button"
        onClick={() => onNavigate(doc.id)}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
      >
        <DocumentIconView icon={doc.icon} size={16} className="shrink-0" />
        <span className="min-w-0 truncate">{title}</span>
      </button>
    </div>
  );
}

export function ChildDocumentsSection({ docs, onNavigate, onReorder }: ChildDocumentsSectionProps) {
  const handleReorder = (fromIndex: number, toIndex: number) => {
    const ids = docs.map((d) => d.id);
    const reordered = ids.filter((_, i) => i !== fromIndex);
    reordered.splice(toIndex > fromIndex ? toIndex - 1 : toIndex, 0, ids[fromIndex]);
    onReorder(reordered);
  };

  if (docs.length === 0) return null;

  return (
    <div className="border-b border-[var(--color-border)]/60 pb-3">
      <div className="mb-1.5 px-6 text-xs font-medium text-[var(--color-text-muted)]">
        Child documents
      </div>
      <ul className="list-none px-6" role="list">
        {docs.map((doc, index) => (
          <li key={doc.id}>
            <ChildDocRow
              doc={doc}
              index={index}
              onNavigate={onNavigate}
              onReorder={handleReorder}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
