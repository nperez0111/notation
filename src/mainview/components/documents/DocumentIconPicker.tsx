import { useRef, useState, useEffect } from "react";
import type { DocumentIcon } from "../../../shared/types";
import { EmojiMartPickerPanel } from "./EmojiMartPickerPanel";

type DocumentIconPickerProps = {
	value: DocumentIcon;
	onSelect: (icon: DocumentIcon) => void;
	/** Anchor: clickable element that opens the picker. */
	children: React.ReactNode;
	/** "light" | "dark" for emoji-mart theme */
	theme?: string;
};

/** Picker for document icon: emoji picker as main element (no wrapper background). */
export function DocumentIconPicker({
	value,
	onSelect,
	children,
	theme = "light",
}: DocumentIconPickerProps) {
	const [open, setOpen] = useState(false);
	const anchorRef = useRef<HTMLDivElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		const close = (e: MouseEvent) => {
			if (
				anchorRef.current?.contains(e.target as Node) ||
				panelRef.current?.contains(e.target as Node)
			) {
				return;
			}
			setOpen(false);
		};
		document.addEventListener("mousedown", close);
		return () => document.removeEventListener("mousedown", close);
	}, [open]);

	const handleSelect = (icon: DocumentIcon) => {
		onSelect(icon);
		setOpen(false);
	};

	return (
		<div className="relative inline-block" ref={anchorRef}>
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className={`flex items-center justify-center rounded p-1 text-text-muted hover:bg-surface-hover hover:text-[var(--color-text)] ${open ? "relative z-[60]" : ""}`}
				aria-label="Change document icon"
				aria-expanded={open}
				aria-haspopup="true"
			>
				{children}
			</button>
			{open && (
				<div
					ref={panelRef}
					className="absolute left-0 top-full z-50 mt-1"
					role="dialog"
					aria-label="Document icon picker"
				>
					<EmojiMartPickerPanel
						theme={theme}
						onEmojiSelect={(emoji) => handleSelect(emoji.native)}
					/>
				</div>
			)}
		</div>
	);
}
