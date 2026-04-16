import { useState, useEffect, useLayoutEffect, useMemo } from "react";
import type { DocumentIcon } from "../../../shared/types";
import {
  useFloating,
  useClick,
  useDismiss,
  useInteractions,
  FloatingPortal,
  autoUpdate,
  offset,
  flip,
  shift,
} from "@floating-ui/react";
import { EmojiMartPickerPanel } from "./EmojiMartPickerPanel";

const SIDEBAR_ARIA_LABEL = "Document sidebar";

type DocumentIconPickerProps = {
  value: DocumentIcon;
  onSelect: (icon: DocumentIcon) => void;
  /** Anchor: clickable element that opens the picker. */
  children: React.ReactNode;
  /** "light" | "dark" for emoji-mart theme */
  theme?: string;
};

/** Picker for document icon: emoji picker positioned with Floating UI, constrained to sidebar. */
export function DocumentIconPicker({
  onSelect,
  children,
  theme = "light",
}: DocumentIconPickerProps) {
  const [open, setOpen] = useState(false);
  const [sidebarEl, setSidebarEl] = useState<Element | null>(null);
  const [floatingWidth, setFloatingWidth] = useState<number | null>(null);

  const EMOJI_PICKER_MAX_WIDTH = 360;

  useEffect(() => {
    setSidebarEl(document.querySelector(`[aria-label="${SIDEBAR_ARIA_LABEL}"]`));
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setFloatingWidth(null);
      return;
    }
    // Fill available width (e.g. sidebar) up to max
    const available = sidebarEl?.getBoundingClientRect().width;
    setFloatingWidth(
      available != null ? Math.min(available, EMOJI_PICKER_MAX_WIDTH) : EMOJI_PICKER_MAX_WIDTH,
    );
  }, [open, sidebarEl]);

  const middleware = useMemo(
    () => [
      offset(8),
      flip({ padding: 8 }),
      shift({
        padding: 8,
        boundary: sidebarEl ?? undefined,
      }),
    ],
    [sidebarEl],
  );

  const { refs, context, floatingStyles } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "bottom-start",
    middleware,
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context, { outsidePress: true });
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);

  const handleSelect = (icon: DocumentIcon) => {
    onSelect(icon);
    setOpen(false);
  };

  return (
    <>
      <button
        ref={refs.setReference}
        type="button"
        className="flex items-center justify-center rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        aria-label="Change document icon"
        aria-expanded={open}
        aria-haspopup="true"
        {...getReferenceProps()}
      >
        {children}
      </button>
      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              ...(floatingWidth != null ? { width: `${floatingWidth}px` } : {}),
            }}
            className="z-[100] min-w-0 rounded-lg border border-border bg-card shadow-lg"
            role="dialog"
            aria-label="Document icon picker"
            {...getFloatingProps()}
          >
            <EmojiMartPickerPanel
              theme={theme}
              onEmojiSelect={(emoji) => handleSelect(emoji.native)}
            />
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
