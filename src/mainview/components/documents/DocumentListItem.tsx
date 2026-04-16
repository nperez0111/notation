import { useState } from "react";
import type { Document } from "../../../shared/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { DocumentIconView } from "./DocumentIconView";
import { DocumentIconPicker } from "./DocumentIconPicker";

type DocumentListItemProps = {
  document: Document;
  isSelected: boolean;
  onSelect: () => void;
  depth?: number;
  onCreateChild?: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  descendantCount?: number;
  hasChildren?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
  onIconChange?: (documentId: number, icon: Document["icon"]) => void | Promise<void>;
  dropTargetHighlight?: "parent" | "child";
  blueskyConnected?: boolean;
  onPublish?: () => void | Promise<void>;
  onUnpublish?: () => void | Promise<void>;
};

const DEPTH_PADDING = 12;

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
            ? "bg-primary/20"
            : dropTargetHighlight === "child"
              ? "bg-primary/10"
              : isSelected
                ? "bg-primary/20 text-primary-foreground font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
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
                  <span className="flex h-[18px] w-[18px] items-center justify-center text-xs text-muted-foreground">
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
              className="absolute inset-[-2px] flex items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent hover:text-foreground"
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
      {(onCreateChild ||
        onDelete ||
        (blueskyConnected && (onPublish || (doc.publishedUri && onUnpublish)))) && (
        <div className="pointer-events-none absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          {onCreateChild && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void onCreateChild();
              }}
              className="pointer-events-auto rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Add sub-note"
              aria-label="Add sub-note"
            >
              +
            </button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="pointer-events-auto rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="More options"
                />
              }
            >
              ⋯
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onCreateChild && (
                <DropdownMenuItem onClick={() => void onCreateChild()}>
                  Add sub-note
                </DropdownMenuItem>
              )}
              {blueskyConnected && onPublish && (
                <DropdownMenuItem onClick={() => void onPublish()}>
                  {doc.publishedUri ? "Update on Bluesky" : "Publish to Bluesky"}
                </DropdownMenuItem>
              )}
              {blueskyConnected && doc.publishedUri && onUnpublish && (
                <DropdownMenuItem onClick={() => void onUnpublish()}>Unpublish</DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem className="text-destructive" onClick={() => setConfirmOpen(true)}>
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      {onDelete && (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {totalDeleted > 1 ? `${totalDeleted} notes` : "note"}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {totalDeleted > 1
                  ? `This will permanently delete "${title}" and its ${descendantCount} sub-note${descendantCount === 1 ? "" : "s"}. This action cannot be undone.`
                  : `This will permanently delete "${title}". This action cannot be undone.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  setConfirmOpen(false);
                  void onDelete();
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
