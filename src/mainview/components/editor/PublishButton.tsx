import { useState } from "react";
import { StatefulPopover } from "baseui/popover";
import type { PublishStatus } from "../../../shared/types";

type PublishButtonProps = {
  publishStatus: PublishStatus | null;
  blueskyConnected: boolean;
  onPublish: () => Promise<void>;
  onUnpublish: () => Promise<void>;
};

const popoverOverrides = {
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

function DropdownMenu({ onUnpublish, close }: { onUnpublish: () => void; close: () => void }) {
  return (
    <div className="min-w-[140px] py-1" role="menu">
      <button
        type="button"
        role="menuitem"
        className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-surface-hover"
        onClick={() => {
          close();
          onUnpublish();
        }}
      >
        Unpublish
      </button>
    </div>
  );
}

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

  // Published but modified — split button: Update action + dropdown chevron
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
          <StatefulPopover
            placement="bottomRight"
            content={({ close }) => (
              <DropdownMenu onUnpublish={() => void handleUnpublish()} close={close} />
            )}
            overrides={popoverOverrides}
          >
            <button
              type="button"
              disabled={loading}
              className="rounded-r-md border border-amber-700/60 bg-amber-600 px-1.5 py-1 text-xs text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
              aria-label="More publish options"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                className="translate-y-px"
              >
                <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </StatefulPopover>
        </div>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    );
  }

  // Published and up to date — split button: Published badge + dropdown chevron
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-stretch">
        <span className="flex items-center gap-1.5 rounded-l-md border border-r-0 border-green-700/50 bg-green-900/30 px-3 py-1 text-xs font-medium text-green-400">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
          Published
        </span>
        <StatefulPopover
          placement="bottomRight"
          content={({ close }) => (
            <DropdownMenu onUnpublish={() => void handleUnpublish()} close={close} />
          )}
          overrides={popoverOverrides}
        >
          <button
            type="button"
            disabled={loading}
            className="rounded-r-md border border-green-700/50 bg-green-900/30 px-1.5 py-1 text-xs text-green-400 transition-colors hover:bg-green-900/50 disabled:opacity-50"
            aria-label="More publish options"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="translate-y-px">
              <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </StatefulPopover>
      </div>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
