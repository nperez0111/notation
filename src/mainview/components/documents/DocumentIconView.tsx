import type { ComponentType } from "react";
import type { DocumentIconKey } from "../../../shared/types";
import { DOCUMENT_ICON_KEYS } from "../../../shared/types";
import {
	MdArticle,
	MdDescription,
	MdFavorite,
	MdFolder,
	MdLightbulb,
	MdNote,
	MdPushPin,
	MdStar,
} from "react-icons/md";

const ICON_MAP: Record<DocumentIconKey, ComponentType<{ size?: number; className?: string }>> = {
	file: MdDescription,
	folder: MdFolder,
	star: MdStar,
	heart: MdFavorite,
	pin: MdPushPin,
	lightbulb: MdLightbulb,
	document: MdArticle,
	note: MdNote,
};

function isFixedIconKey(value: string | null | undefined): value is DocumentIconKey {
	return value != null && DOCUMENT_ICON_KEYS.includes(value as DocumentIconKey);
}

type DocumentIconViewProps = {
	icon: string | null | undefined;
	size?: number;
	className?: string;
};

/** Renders document icon: fixed icon from set or emoji character. */
export function DocumentIconView({
	icon,
	size = 18,
	className = "",
}: DocumentIconViewProps) {
	if (icon == null || icon === "") {
		return null;
	}
	if (isFixedIconKey(icon)) {
		const IconComponent = ICON_MAP[icon];
		return <IconComponent size={size} className={className} />;
	}
	return (
		<span
			className={className}
			style={{ fontSize: size, lineHeight: 1 }}
			role="img"
			aria-label="Document icon"
		>
			{icon}
		</span>
	);
}
