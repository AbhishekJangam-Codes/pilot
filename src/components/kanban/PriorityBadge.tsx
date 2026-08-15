import type { Priority } from "@/types/kanban";
import { PRIORITY_COLORS } from "@/lib/constants";
import { PRIORITY_LABELS } from "@/types/kanban";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const colors = PRIORITY_COLORS[priority];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        colors.bg,
        colors.text,
        colors.border,
        className,
      )}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
