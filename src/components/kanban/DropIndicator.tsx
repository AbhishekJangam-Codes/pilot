import { cn } from "@/lib/utils";

interface DropIndicatorProps {
  visible?: boolean;
}

export function DropIndicator({ visible = true }: DropIndicatorProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        "pointer-events-none my-1 h-0.5 rounded-full bg-accent",
        "shadow-[0_0_0_1px_var(--color-accent)] transition-opacity duration-150",
      )}
      aria-hidden="true"
    />
  );
}
