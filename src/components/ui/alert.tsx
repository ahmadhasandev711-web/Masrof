import { cn } from "@/lib/utils/cn";

export function Alert({
  variant = "error",
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & {
  variant?: "error" | "success" | "info";
}) {
  const styles = {
    error: "text-red-600",
    success: "text-emerald-700",
    info: "text-neutral-600",
  };

  return (
    <p role="alert" className={cn("text-sm", styles[variant], className)} {...props} />
  );
}
