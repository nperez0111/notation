import { useEffect, useState } from "react";
import data from "@emoji-mart/data";
import { init } from "emoji-mart";
import Picker from "@emoji-mart/react";

// Init runs async; Picker must only mount after init completes or it may render nothing.
let initPromise: Promise<void> | null = null;
function getInitPromise(): Promise<void> {
  if (!initPromise) initPromise = init({ data });
  return initPromise;
}

type EmojiMartPickerPanelProps = {
  onEmojiSelect: (emoji: { native: string }) => void;
  /** "light" | "dark" | "auto" - passed to emoji-mart theme */
  theme?: string;
};

/** Full emoji-mart Picker panel (same library/UI as BlockNote). Uses static imports so data is bundled and no CDN fetch happens in packaged webview. */
export function EmojiMartPickerPanel({
  onEmojiSelect,
  theme = "light",
}: EmojiMartPickerPanelProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void getInitPromise().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div
        className="flex h-[320px] min-w-0 w-full items-center justify-center text-muted-foreground"
        role="presentation"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        Loading emojis…
      </div>
    );
  }

  return (
    <div
      className="h-[320px] min-w-0 w-full overflow-hidden"
      role="presentation"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      style={{ position: "relative" }}
    >
      <Picker
        data={data}
        onEmojiSelect={(emoji: { native: string }) => onEmojiSelect(emoji)}
        theme={theme}
        perLine={7}
      />
    </div>
  );
}
