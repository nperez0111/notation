type SidebarProps = {
	children: React.ReactNode;
	className?: string;
};

export function Sidebar({ children, className = "" }: SidebarProps) {
	return (
		<aside
			className={`flex w-64 shrink-0 flex-col overflow-x-hidden overflow-y-auto border-r border-border bg-surface ${className}`}
			aria-label="Document sidebar"
		>
			{children}
		</aside>
	);
}
