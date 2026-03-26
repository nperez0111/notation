type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
  children: React.ReactNode;
};

export function Button({ variant = "primary", className = "", children, ...rest }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[var(--color-bg)] disabled:opacity-50";
  const variants = {
    primary: "bg-accent text-accent-text hover:bg-accent-hover active:bg-accent-hover",
    ghost: "bg-transparent text-text-muted hover:bg-surface-hover hover:text-[var(--color-text)]",
    danger: "bg-[var(--color-danger)] text-white hover:opacity-90 active:opacity-80",
  };
  return (
    <button type="button" className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
