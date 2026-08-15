import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useKanbanStore } from "@/store/kanbanStore";
import type { Task } from "@/types/kanban";
import { BoardToolbar } from "./BoardToolbar";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { AddColumnButton } from "./AddColumnButton";
import { TaskDrawer } from "./TaskDrawer";

export function KanbanBoard() {
  const board = useKanbanStore((s) => s.board);
  const moveTask = useKanbanStore((s) => s.moveTask);
  const reorderColumns = useKanbanStore((s) => s.reorderColumns);
  const reorderTasksInColumn = useKanbanStore((s) => s.reorderTasksInColumn);
  const getColumnTasks = useKanbanStore((s) => s.getColumnTasks);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overTaskId, setOverTaskId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);

  const sortedColumns = useMemo(
    () => [...board.columns].sort((a, b) => a.order - b.order),
    [board.columns],
  );

  const columnIds = useMemo(
    () => sortedColumns.map((column) => column.id),
    [sortedColumns],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const findTask = useCallback(
    (taskId: string) => board.tasks.find((t) => t.id === taskId),
    [board.tasks],
  );

  const resolveColumnIdFromOver = (overId: string): string | null => {
    if (overId.startsWith("column-drop-")) {
      return overId.replace("column-drop-", "");
    }
    const task = findTask(overId);
    if (task) return task.columnId;
    if (board.columns.some((c) => c.id === overId)) return overId;
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type;

    if (type === "task") {
      setActiveTask(active.data.current?.task as Task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setOverTaskId(null);
      setOverColumnId(null);
      return;
    }

    const activeType = active.data.current?.type;
    if (activeType !== "task") return;

    const overId = String(over.id);
    const overType = over.data.current?.type;

    if (overType === "task" || findTask(overId)) {
      setOverTaskId(overId);
      setOverColumnId(findTask(overId)?.columnId ?? null);
      return;
    }

    setOverTaskId(null);
    setOverColumnId(resolveColumnIdFromOver(overId));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveTask(null);
    setOverTaskId(null);
    setOverColumnId(null);

    if (!over) return;

    const activeType = active.data.current?.type;
    const overId = String(over.id);

    if (activeType === "column") {
      if (active.id !== over.id && board.columns.some((c) => c.id === overId)) {
        reorderColumns(String(active.id), overId);
      }
      return;
    }

    if (activeType === "task") {
      const taskId = String(active.id);
      const task = findTask(taskId);
      if (!task) return;

      const targetColumnId = resolveColumnIdFromOver(overId);
      if (!targetColumnId) return;

      const targetTasks = getColumnTasks(targetColumnId).filter(
        (t) => t.id !== taskId,
      );

      let targetIndex = targetTasks.length;

      if (findTask(overId)) {
        const overIndex = targetTasks.findIndex((t) => t.id === overId);
        targetIndex = overIndex >= 0 ? overIndex : targetTasks.length;
      }

      if (task.columnId === targetColumnId) {
        const overTask = findTask(overId);
        if (overTask && overTask.id !== taskId) {
          reorderTasksInColumn(targetColumnId, taskId, overTask.id);
        }
        return;
      }

      moveTask(taskId, targetColumnId, targetIndex);
    }
  };

  const moveTaskByKeyboard = useCallback(
    (taskId: string, direction: "left" | "right" | "up" | "down") => {
      const task = findTask(taskId);
      if (!task) return;

      const columnIndex = sortedColumns.findIndex(
        (c) => c.id === task.columnId,
      );
      if (columnIndex < 0) return;

      const columnTasks = getColumnTasks(task.columnId);
      const taskIndex = columnTasks.findIndex((t) => t.id === taskId);

      if (direction === "left" && columnIndex > 0) {
        const targetColumn = sortedColumns[columnIndex - 1];
        moveTask(taskId, targetColumn.id, getColumnTasks(targetColumn.id).length);
        setFocusedTaskId(taskId);
        return;
      }

      if (direction === "right" && columnIndex < sortedColumns.length - 1) {
        const targetColumn = sortedColumns[columnIndex + 1];
        moveTask(taskId, targetColumn.id, getColumnTasks(targetColumn.id).length);
        setFocusedTaskId(taskId);
        return;
      }

      if (direction === "up" && taskIndex > 0) {
        reorderTasksInColumn(
          task.columnId,
          taskId,
          columnTasks[taskIndex - 1].id,
        );
        setFocusedTaskId(taskId);
        return;
      }

      if (direction === "down" && taskIndex < columnTasks.length - 1) {
        reorderTasksInColumn(
          task.columnId,
          taskId,
          columnTasks[taskIndex + 1].id,
        );
        setFocusedTaskId(taskId);
      }
    },
    [
      findTask,
      getColumnTasks,
      moveTask,
      reorderTasksInColumn,
      sortedColumns,
    ],
  );

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <BoardToolbar />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <main
          className="flex-1 overflow-x-auto px-4 py-5 lg:px-6"
          onKeyDown={(e) => {
            if (!focusedTaskId) return;
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              moveTaskByKeyboard(focusedTaskId, "left");
            }
            if (e.key === "ArrowRight") {
              e.preventDefault();
              moveTaskByKeyboard(focusedTaskId, "right");
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              moveTaskByKeyboard(focusedTaskId, "up");
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              moveTaskByKeyboard(focusedTaskId, "down");
            }
          }}
        >
          <div className="mx-auto flex max-w-[1800px] gap-4 pb-6">
            <SortableContext
              items={columnIds}
              strategy={horizontalListSortingStrategy}
            >
              {sortedColumns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  activeTaskId={activeTask?.id}
                  overTaskId={overTaskId}
                  overColumnId={overColumnId}
                  focusedTaskId={focusedTaskId}
                  onFocusTask={setFocusedTaskId}
                />
              ))}
            </SortableContext>
            <AddColumnButton />
          </div>

          <p className="mx-auto max-w-[1800px] text-xs text-foreground-muted">
            Keyboard: focus a card, then use arrow keys to move it across columns
            or reorder within a column.
          </p>
        </main>

        <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
          {activeTask ? <KanbanCard task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      <TaskDrawer />
    </div>
  );
}
