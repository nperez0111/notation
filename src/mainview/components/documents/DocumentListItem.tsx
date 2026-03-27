import { useRef, useState } from "react";
import type { Document } from "../../../shared/types";
import { Modal } from "baseui/modal";
import { StatefulPopover } from "baseui/popover";
import { DocumentIconView } from "./DocumentIconView";
import { DocumentIconPicker } from "./DocumentIconPicker";

type DocumentListItemProps = {
  document: Document;
  isSelected: boolean;
  onSelect: () => void;
  /** Nesting depth for indentation (0 = top-level in collection). */
  depth?: number;
  /** Called to create a child document under this one. */
  onCreateChild?: () => void | Promise<void>;
  /** Called to delete this document. */
  onDelete?: () => void | Promise<void>;
  /** Number of descendant documents (for delete confirmation warning). */
  descendantCount?: number;
  /** Whether this document has nested children (shows expand/collapse chevron). */
  hasChildren?: boolean;
  /** Whether nested children are currently expanded. */
  expanded?: boolean;
  /** Toggle expand/collapse of nested children. */
  onToggleExpand?: () => void;
  /** Called when document icon changes. */
  onIconChange?: (documentId: number, icon: Document["icon"]) => void | Promise<void>;
  /** Visual state when this row is the drop target (A will become child of this doc). */
  dropTargetHighlight?: "parent" | "child";
  /** Whether Bluesky is connected. */
  blueskyConnected?: boolean;
  /** Called to publish/update this document to Bluesky. */
  onPublish?: () => void | Promise<void>;
  /** Called to unpublish this document from Bluesky. */
  onUnpublish?: () => void | Promise<void>;
};

const DEPTH_PADDING = 12; // px per nesting level

const sidebarPopoverOverrides = {
  Body: {
    style: {
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
      backgroundColor: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      minWidth: "140px",
    },
  },
  Inner: { style: {} },
};

export function DocumentListItem({
  document: doc,
  isSelected,
  onSelect,
  depth = 0,
  onCreateChild,
  onDelete,
  descendantCount = 0,
  hasChildren = false,
  expanded = true,
  onToggleExpand,
  onIconChange,
  dropTargetHighlight,
  blueskyConnected = false,
  onPublish,
  onUnpublish,
}: DocumentListItemProps) {
  const title = doc.title?.trim() || "Untitled";
  const indent = depth * DEPTH_PADDING;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const totalDeleted = 1 + descendantCount;

  return (
    <div
      className="group relative flex min-w-0 items-center gap-1 overflow-hidden"
      style={{ paddingLeft: indent + 10 }}
    >
      <button
        type="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
        className={`flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded-md py-1.5 pr-8 pl-1.5 text-left text-sm transition-colors ${
          dropTargetHighlight === "parent"
            ? "bg-[var(--color-drop-target-parent)]"
            : dropTargetHighlight === "child"
              ? "bg-[var(--color-drop-target-child)]"
              : isSelected
                ? "bg-accent-muted text-accent-text font-medium"
                : "text-text-muted hover:bg-surface-hover hover:text-[var(--color-text)]"
        }`}
        title={title}
      >
        <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
          {onIconChange ? (
            <span
              role="presentation"
              className={`shrink-0 pt-0.5 transition-opacity ${
                hasChildren ? "group-hover:opacity-0" : ""
              }`}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <DocumentIconPicker
                value={doc.icon ?? null}
                onSelect={(icon) => {
                  void onIconChange(doc.id, icon);
                }}
                theme="dark"
              >
                {doc.icon ? (
                  <DocumentIconView icon={doc.icon} size={18} className="block" />
                ) : (
                  <span className="flex h-[18px] w-[18px] items-center justify-center text-xs text-text-subtle">
                    +
                  </span>
                )}
              </DocumentIconPicker>
            </span>
          ) : doc.icon ? (
            <span
              className={`shrink-0 pt-0.5 transition-opacity ${
                hasChildren ? "group-hover:opacity-0" : ""
              }`}
            >
              <DocumentIconView icon={doc.icon} size={18} className="block" />
            </span>
          ) : null}
          {hasChildren && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand?.();
              }}
              className="absolute inset-[-2px] flex items-center justify-center rounded text-text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:bg-surface-hover hover:text-[var(--color-text)]"
              aria-expanded={expanded}
              aria-label={expanded ? "Collapse nested documents" : "Expand nested documents"}
            >
              <span
                className={`inline-block text-xs transition-transform ${
                  expanded ? "rotate-90" : ""
                }`}
                aria-hidden
              >
                ▸
              </span>
            </button>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1">
            <span className="block truncate">{title}</span>
            {doc.publishedUri && (
              <span
                className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400"
                title="Published to Bluesky"
              />
            )}
          </span>
        </span>
      </button>
      {(onCreateChild || onDelete) && (
        <div className="pointer-events-none absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          {onCreateChild && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void onCreateChild();
              }}
              className="pointer-events-auto rounded p-1 text-text-subtle hover:bg-surface-hover hover:text-[var(--color-text)]"
              title="Add sub-note"
              aria-label="Add sub-note"
            >
              +
            </button>
          )}
          <StatefulPopover
            placement="bottomRight"
            content={({ close }) => (
              <div className="min-w-[140px] py-1" role="menu">
                {onCreateChild && (
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-surface-hover"
                    onClick={() => {
                      void onCreateChild();
                      close();
                    }}
                  >
                    Add sub-note
                  </button>
                )}
                {blueskyConnected && onPublish && (
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-surface-hover"
                    onClick={() => {
                      void onPublish();
                      close();
                    }}
                  >
                    {doc.publishedUri ? "Update on Bluesky" : "Publish to Bluesky"}
                  </button>
                )}
                {blueskyConnected && doc.publishedUri && onUnpublish && (
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-surface-hover"
                    onClick={() => {
                      void onUnpublish();
                      close();
                    }}
                  >
                    Unpublish
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-surface-hover"
                    onClick={() => {
                      close();
                      setConfirmOpen(true);
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
            overrides={sidebarPopoverOverrides}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="pointer-events-auto rounded p-1 text-text-muted hover:bg-surface-hover hover:text-[var(--color-text)]"
              aria-label="More options"
              aria-haspopup="menu"
            >
              ⋯
            </button>
          </StatefulPopover>
        </div>
      )}
      {onDelete && (
        <Modal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          closeable
          animate
          overrides={{
            Root: { style: { zIndex: 10000 } },
            DialogContainer: { style: { backgroundColor: "rgba(0, 0, 0, 0.6)" } },
            Dialog: {
              style: {
                maxWidth: "400px",
                borderRadius: "var(--radius)",
                backgroundColor: "var(--color-surface-elevated)",
                boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8)",
              },
              props: {
                onAnimationEnd: () => {
                  if (confirmOpen) confirmRef.current?.focus();
                },
              },
            },
          }}
        >
          <div className="p-6">
            <h3 className="mb-2 text-base font-semibold text-[var(--color-text)]">
              Delete {totalDeleted > 1 ? `${totalDeleted} notes` : "note"}?
            </h3>
            <p className="mb-5 text-sm text-text-muted">
              {totalDeleted > 1
                ? `This will permanently delete "${title}" and its ${descendantCount} sub-note${descendantCount === 1 ? "" : "s"}. This action cannot be undone.`
                : `This will permanently delete "${title}". This action cannot be undone.`}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-md px-3 py-1.5 text-sm text-text-muted hover:bg-surface-hover"
              >
                Cancel
              </button>
              <button
                ref={confirmRef}
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  void onDelete();
                }}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[var(--color-surface-elevated)]"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
