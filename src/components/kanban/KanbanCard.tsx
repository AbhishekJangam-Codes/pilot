import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/types/kanban";
import { useKanbanStore } from "@/store/kanbanStore";
import { PriorityBadge } from "./PriorityBadge";
import {
  cn,
  formatDueDate,
  isOverdue,
  subtaskProgress,
} from "@/lib/utils";

interface KanbanCardProps {
  task: Task;
  isOverlay?: boolean;
  isFocused?: boolean;
  onFocusTask?: (taskId: string) => void;
}

export function KanbanCard({
  task,
  isOverlay = false,
  isFocused,
  onFocusTask,
}: KanbanCardProps) {
  const board = useKanbanStore((s) => s.board);
  const openTaskPanel = useKanbanStore((s) => s.openTaskPanel);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", columnId: task.columnId, task },
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const tags = task.tagIds
    .map((id) => board.tags.find((t) => t.id === id))
    .filter(Boolean);

  const assignees = task.assigneeIds
    .map((id) => board.assignees.find((a) => a.id === id))
    .filter(Boolean);

  const progress = subtaskProgress(task.subtasks);
  const overdue = isOverdue(task.dueDate);

  return (
    <article
      ref={isOverlay ? undefined : setNodeRef}
      style={isOverlay ? undefined : style}
      className={cn(
        "group relative rounded-xl border border-border bg-card-bg p-3 shadow-[var(--shadow-card)]",
        "transition-[box-shadow,transform,opacity,border-color] duration-150",
        !isOverlay && "cursor-grab active:cursor-grabbing",
        isDragging && !isOverlay && "opacity-40",
        isOverlay && "scale-[1.02] shadow-[var(--shadow-drag)] ring-2 ring-accent/40",
        isFocused && "ring-2 ring-accent",
        "hover:shadow-[var(--shadow-card-hover)]",
      )}
      {...(!isOverlay ? attributes : {})}
      {...(!isOverlay ? listeners : {})}
      onClick={() => !isDragging && openTaskPanel(task.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openTaskPanel(task.id);
        }
      }}
      tabIndex={0}
      onFocus={() => onFocusTask?.(task.id)}
      role="button"
      aria-label={`Task: ${task.title}. Priority ${task.priority}.`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug text-foreground">
          {task.title}
        </h3>
        <PriorityBadge priority={task.priority} />
      </div>

      {tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag!.id}
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
              style={{ backgroundColor: tag!.color }}
            >
              {tag!.name}
            </span>
          ))}
        </div>
      )}

      {task.subtasks.length > 0 && (
        <div className="mb-2">
          <div className="mb-1 flex items-center justify-between text-[11px] text-foreground-muted">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-surface-muted"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-accent transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        {task.dueDate ? (
          <time
            dateTime={task.dueDate}
            className={cn(
              "text-xs font-medium",
              overdue ? "text-danger" : "text-foreground-muted",
            )}
          >
            {overdue ? "Overdue · " : ""}
            {formatDueDate(task.dueDate)}
          </time>
        ) : (
          <span className="text-xs text-foreground-muted">No due date</span>
        )}

        {assignees.length > 0 && (
          <div className="flex -space-x-1" aria-label="Assignees">
            {assignees.slice(0, 3).map((assignee) => (
              <span
                key={assignee!.id}
                title={assignee!.name}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-accent-muted text-[10px] font-bold text-accent"
              >
                {assignee!.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </span>
            ))}
            {assignees.length > 3 && (
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface-muted text-[10px] font-medium">
                +{assignees.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {task.attachments.length > 0 && (
        <p className="mt-2 text-[11px] text-foreground-muted">
          📎 {task.attachments.length} attachment
          {task.attachments.length === 1 ? "" : "s"}
        </p>
      )}
    </article>
  );
}
