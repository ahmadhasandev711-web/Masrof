import { cn } from "@/lib/utils/cn";

const variants = {
  primary: "bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-[#10B981] dark:text-[#04231A] dark:hover:bg-[#34D399]",
  secondary: "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-[#26302C] dark:bg-[#1E2824] dark:text-[#ECEAE4] dark:hover:bg-[#26302C]",
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
