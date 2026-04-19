import { cn } from "../../lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "ml";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "border-transparent bg-zinc-900 text-zinc-50 hover:bg-zinc-900/80",
    secondary: "border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80",
    outline: "text-zinc-950 border-zinc-200",
    success: "border-transparent bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    warning: "border-transparent bg-amber-50 text-amber-700 hover:bg-amber-100",
    ml: "border-transparent bg-indigo-50 text-indigo-700 hover:bg-indigo-100 ring-1 ring-indigo-100", // Special ML variant
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
