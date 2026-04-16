import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { PublishStatus } from "../../../shared/types";

type PublishButtonProps = {
  publishStatus: PublishStatus | null;
  blueskyConnected: boolean;
  onPublish: () => Promise<void>;
  onUnpublish: () => Promise<void>;
};

export function PublishButton({
  publishStatus,
  blueskyConnected,
  onPublish,
  onUnpublish,
}: PublishButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!blueskyConnected) return null;

  const handlePublish = async () => {
    setLoading(true);
    setError(null);
    try {
      await onPublish();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUnpublish = async () => {
    setLoading(true);
    setError(null);
    try {
      await onUnpublish();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unpublish failed");
    } finally {
      setLoading(false);
    }
  };

  const chevronDropdown = (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            disabled={loading}
            className="rounded-r-md border border-l-0 px-1.5 py-1 text-xs transition-colors disabled:opacity-50"
            aria-label="More publish options"
          />
        }
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="translate-y-px">
          <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="text-destructive" onClick={() => void handleUnpublish()}>
          Unpublish
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Not published
  if (!publishStatus?.published) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void handlePublish()}
          disabled={loading}
          className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Publishing…" : "Publish"}
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    );
  }

  // Published but modified
  if (publishStatus.isModified) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-stretch">
          <button
            type="button"
            onClick={() => void handlePublish()}
            disabled={loading}
            className="rounded-l-md border border-r-0 border-amber-700/60 bg-amber-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? "Updating…" : "Update"}
          </button>
          <div className="border-amber-700/60 text-white [&>div>button]:border-amber-700/60 [&>div>button]:bg-amber-600 [&>div>button]:text-white hover:[&>div>button]:bg-amber-700">
            {chevronDropdown}
          </div>
        </div>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    );
  }

  // Published and up to date
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-stretch">
        <span className="flex items-center gap-1.5 rounded-l-md border border-r-0 border-green-700/50 bg-green-900/30 px-3 py-1 text-xs font-medium text-green-400">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
          Published
        </span>
        <div className="[&>div>button]:border-green-700/50 [&>div>button]:bg-green-900/30 [&>div>button]:text-green-400 hover:[&>div>button]:bg-green-900/50">
          {chevronDropdown}
        </div>
      </div>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
