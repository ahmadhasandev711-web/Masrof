import { cn } from "@/lib/utils/cn";

export function Alert({
  variant = "error",
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & {
  variant?: "error" | "success" | "info";
}) {
  const styles = {
    error: "text-red-600 dark:text-red-400",
    success: "text-emerald-700 dark:text-[#34D399]",
    info: "text-neutral-600 dark:text-[#9AA39F]",
  };

  return (
    <p role="alert" className={cn("text-sm", styles[variant], className)} {...props} />
  );
}
