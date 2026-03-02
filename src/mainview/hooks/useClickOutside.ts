import { useEffect, useRef, type RefObject } from "react";

/**
 * Call onClose when the user clicks outside any of the given elements.
 * Only active when isActive is true.
 */
export function useClickOutside(
	refs: RefObject<HTMLElement | null>[],
	isActive: boolean,
	onClose: () => void,
): void {
	const refsRef = useRef(refs);
	refsRef.current = refs;
	useEffect(() => {
		if (!isActive) return;
		const handleMouseDown = (e: MouseEvent) => {
			const target = e.target as Node;
			const currentRefs = refsRef.current;
			const inside = currentRefs.some(
				(ref) => ref.current && ref.current.contains(target),
			);
			if (!inside) onClose();
		};
		document.addEventListener("mousedown", handleMouseDown);
		return () => document.removeEventListener("mousedown", handleMouseDown);
	}, [isActive, onClose]);
}
