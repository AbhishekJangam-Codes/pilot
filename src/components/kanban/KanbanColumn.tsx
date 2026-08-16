import { useMemo } from "react";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import type { Column } from "@/types/kanban";
import { useKanbanStore } from "@/store/kanbanStore";
import { ColumnHeader } from "./ColumnHeader";
import { KanbanCard } from "./KanbanCard";
import { DropIndicator } from "./DropIndicator";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  column: Column;
  activeTaskId?: string | null;
  overTaskId?: string | null;
  overColumnId?: string | null;
  focusedTaskId?: string | null;
  onFocusTask?: (taskId: string) => void;
}

export function KanbanColumn({
  column,
  activeTaskId,
  overTaskId,
  overColumnId,
  focusedTaskId,
  onFocusTask,
}: KanbanColumnProps) {
  const getColumnTasks = useKanbanStore((s) => s.getColumnTasks);
  const isWipExceeded = useKanbanStore((s) => s.isWipExceeded);
  const openCreateTaskPanel = useKanbanStore((s) => s.openCreateTaskPanel);

  const tasks = getColumnTasks(column.id);
  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);
  const wipExceeded = isWipExceeded(column.id);

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: "column", column },
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `column-drop-${column.id}`,
    data: { type: "column-drop", columnId: column.id },
  });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
  };

  const showColumnDropIndicator =
    isOver && overColumnId === column.id && !overTaskId;

  return (
    <section
      ref={setSortableRef}
      style={style}
      className={cn(
        "flex w-[min(100%,320px)] shrink-0 flex-col rounded-2xl border border-border bg-column-bg p-3",
        "transition-shadow duration-150",
        isDragging && "opacity-70 shadow-[var(--shadow-drag)]",
        wipExceeded && "border-danger/50 ring-1 ring-danger/20",
      )}
      aria-label={`${column.title} column`}
    >
      <ColumnHeader
        column={column}
        taskCount={tasks.length}
        wipExceeded={wipExceeded}
        dragHandleProps={{ ...attributes, ...listeners }}
      />

      <div
        ref={setDroppableRef}
        className={cn(
          "flex min-h-[120px] flex-1 flex-col gap-2 overflow-y-auto scrollbar-thin",
          "rounded-xl border border-dashed border-transparent p-1 transition-colors",
          showColumnDropIndicator && "border-accent bg-accent-muted/30",
        )}
      >
        {showColumnDropIndicator && <DropIndicator />}

        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <div key={task.id}>
              {overTaskId === task.id &&
                activeTaskId &&
                activeTaskId !== task.id && <DropIndicator />}
              <KanbanCard
                task={task}
                isFocused={focusedTaskId === task.id}
                onFocusTask={onFocusTask}
              />
            </div>
          ))}
        </SortableContext>

        {tasks.length === 0 && !showColumnDropIndicator && (
          <p className="py-8 text-center text-xs text-foreground-muted">
            Drop tasks here or add a new one.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => openCreateTaskPanel(column.id)}
        className={cn(
          "mt-3 w-full rounded-lg border border-dashed border-border px-3 py-2 text-sm font-medium",
          "text-foreground-muted transition-colors hover:border-accent hover:bg-accent-muted/40 hover:text-accent",
        )}
      >
        + Add task
      </button>
    </section>
  );
}
