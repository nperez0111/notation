import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_WIDTH = 256;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

type SidebarProps = {
	children: React.ReactNode;
	className?: string;
	/** Sidebar width in pixels. When provided, sidebar is resizable. */
	width?: number;
	/** Called during resize with new width (live). */
	onWidthChange?: (width: number) => void;
	/** Called when resize ends; use to persist width. */
	onWidthChangeEnd?: (width: number) => void;
};

export function Sidebar({
	children,
	className = "",
	width = DEFAULT_WIDTH,
	onWidthChange,
	onWidthChangeEnd,
}: SidebarProps) {
	const [isResizing, setIsResizing] = useState(false);
	const startXRef = useRef(0);
	const startWidthRef = useRef(DEFAULT_WIDTH);

	const handleRef = useRef<HTMLButtonElement>(null);

	const handlePointerDown = useCallback(
		(e: React.PointerEvent) => {
			if (e.button !== 0) return;
			e.preventDefault();
			handleRef.current?.setPointerCapture?.(e.pointerId);
			setIsResizing(true);
			startXRef.current = e.clientX;
			startWidthRef.current = width;
		},
		[width],
	);

	const handlePointerMove = useCallback(
		(e: PointerEvent) => {
			if (!isResizing) return;
			const delta = e.clientX - startXRef.current;
			const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidthRef.current + delta));
			onWidthChange?.(next);
		},
		[isResizing, onWidthChange],
	);

	const handlePointerUp = useCallback(
		(e: PointerEvent) => {
			if (e.button !== 0) return;
			if (!isResizing) return;
			handleRef.current?.releasePointerCapture?.(e.pointerId);
			setIsResizing(false);
			const delta = e.clientX - startXRef.current;
			const finalWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidthRef.current + delta));
			onWidthChange?.(finalWidth);
			onWidthChangeEnd?.(finalWidth);
		},
		[isResizing, onWidthChange, onWidthChangeEnd],
	);

	// Global pointer move/up so we keep receiving events if pointer leaves the handle
	const containerRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (!isResizing) return;
		const win = containerRef.current?.ownerDocument?.defaultView ?? window;
		win.addEventListener("pointermove", handlePointerMove, { capture: true });
		win.addEventListener("pointerup", handlePointerUp, { capture: true });
		return () => {
			win.removeEventListener("pointermove", handlePointerMove, { capture: true });
			win.removeEventListener("pointerup", handlePointerUp, { capture: true });
		};
	}, [isResizing, handlePointerMove, handlePointerUp]);

	const effectiveWidth = width ?? DEFAULT_WIDTH;
	const isResizable = onWidthChange != null;

	return (
		<div
			ref={containerRef}
			className="relative flex shrink-0 flex-col"
			style={{ width: effectiveWidth }}
			aria-label="Document sidebar"
		>
			<aside
				className={`flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-surface)] ${className}`}
			>
				{children}
			</aside>
			{isResizable && (
				<button
					ref={handleRef}
					type="button"
					aria-label="Resize sidebar"
					className="absolute right-0 top-0 z-10 flex h-full w-1.5 cursor-col-resize items-center justify-center border-0 bg-transparent py-0 outline-none hover:bg-[var(--color-surface-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
					onPointerDown={handlePointerDown}
				>
					<span
						className="h-full w-px shrink-0 bg-[var(--color-border)]"
						aria-hidden
					/>
				</button>
			)}
		</div>
	);
}