import { cn } from "@/lib/utils/cn";

const variants = {
  primary: "bg-emerald-700 text-white hover:bg-emerald-800",
  secondary: "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
} as const;

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
}) {
  return (
    <button
      className={cn(
        "rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
