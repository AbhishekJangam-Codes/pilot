import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Assignee,
  Board,
  Column,
  FilterState,
  Priority,
  SortOption,
  Subtask,
  Tag,
  Task,
} from "@/types/kanban";
import { createInitialBoard, STORAGE_KEYS } from "@/lib/constants";
import { generateId } from "@/lib/utils";
import {
  isDueThisWeek,
  isDueToday,
  isOverdue,
} from "@/lib/utils";

interface KanbanState {
  board: Board;
  filters: FilterState;
  sortBy: SortOption;
  selectedTaskId: string | null;
  isTaskPanelOpen: boolean;
  isCreatingTask: boolean;
  createTaskColumnId: string | null;

  setBoardTitle: (title: string) => void;
  setSortBy: (sort: SortOption) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;

  addColumn: (title: string, wipLimit?: number) => void;
  updateColumn: (columnId: string, updates: Partial<Column>) => void;
  deleteColumn: (columnId: string) => void;
  reorderColumns: (activeId: string, overId: string) => void;

  addTask: (columnId: string, task?: Partial<Task>) => string;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (
    taskId: string,
    targetColumnId: string,
    targetIndex: number,
  ) => void;
  reorderTasksInColumn: (
    columnId: string,
    activeId: string,
    overId: string,
  ) => void;

  addTag: (tag: Omit<Tag, "id">) => void;
  addAssignee: (assignee: Omit<Assignee, "id">) => void;

  openTaskPanel: (taskId: string) => void;
  openCreateTaskPanel: (columnId: string) => void;
  closeTaskPanel: () => void;

  getColumnTasks: (columnId: string) => Task[];
  isWipExceeded: (columnId: string) => boolean;
}

const defaultFilters: FilterState = {
  search: "",
  priorities: [],
  assigneeIds: [],
  dueDateFilter: "all",
};

function normalizeOrders(tasks: Task[], columnId: string): Task[] {
  const columnTasks = tasks
    .filter((t) => t.columnId === columnId)
    .sort((a, b) => a.order - b.order);

  return columnTasks.map((task, index) =>
    task.order === index ? task : { ...task, order: index },
  );
}

function matchesFilters(task: Task, filters: FilterState, board: Board): boolean {
  const search = filters.search.trim().toLowerCase();
  if (search) {
    const assigneeNames = task.assigneeIds
      .map((id) => board.assignees.find((a) => a.id === id)?.name ?? "")
      .join(" ");
    const tagNames = task.tagIds
      .map((id) => board.tags.find((t) => t.id === id)?.name ?? "")
      .join(" ");
    const haystack = `${task.title} ${assigneeNames} ${tagNames}`.toLowerCase();
    if (!haystack.includes(search)) return false;
  }

  if (
    filters.priorities.length > 0 &&
    !filters.priorities.includes(task.priority)
  ) {
    return false;
  }

  if (
    filters.assigneeIds.length > 0 &&
    !task.assigneeIds.some((id) => filters.assigneeIds.includes(id))
  ) {
    return false;
  }

  switch (filters.dueDateFilter) {
    case "overdue":
      return isOverdue(task.dueDate);
    case "today":
      return isDueToday(task.dueDate);
    case "week":
      return isDueThisWeek(task.dueDate);
    case "none":
      return !task.dueDate;
    default:
      break;
  }

  return true;
}

function sortTasks(tasks: Task[], sortBy: SortOption): Task[] {
  const sorted = [...tasks];
  switch (sortBy) {
    case "dueDate":
      return sorted.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return a.order - b.order;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    case "priority": {
      const weight: Record<Priority, number> = {
        urgent: 4,
        high: 3,
        medium: 2,
        low: 1,
      };
      return sorted.sort((a, b) => {
        const diff = weight[b.priority] - weight[a.priority];
        return diff !== 0 ? diff : a.order - b.order;
      });
    }
    default:
      return sorted.sort((a, b) => a.order - b.order);
  }
}

export const useKanbanStore = create<KanbanState>()(
  persist(
    (set, get) => ({
      board: createInitialBoard(),
      filters: defaultFilters,
      sortBy: "manual",
      selectedTaskId: null,
      isTaskPanelOpen: false,
      isCreatingTask: false,
      createTaskColumnId: null,

      setBoardTitle: (title) =>
        set((state) => ({ board: { ...state.board, title } })),

      setSortBy: (sort) => set({ sortBy: sort }),

      setFilters: (partial) =>
        set((state) => ({ filters: { ...state.filters, ...partial } })),

      resetFilters: () => set({ filters: defaultFilters }),

      addColumn: (title, wipLimit) =>
        set((state) => {
          const order = state.board.columns.length;
          const column: Column = {
            id: generateId(),
            title,
            order,
            wipLimit,
          };
          return {
            board: {
              ...state.board,
              columns: [...state.board.columns, column],
            },
          };
        }),

      updateColumn: (columnId, updates) =>
        set((state) => ({
          board: {
            ...state.board,
            columns: state.board.columns.map((col) =>
              col.id === columnId ? { ...col, ...updates } : col,
            ),
          },
        })),

      deleteColumn: (columnId) =>
        set((state) => {
          const remaining = state.board.columns.filter(
            (col) => col.id !== columnId,
          );
          const fallbackColumnId = remaining[0]?.id;
          if (!fallbackColumnId) return state;

          const tasks = state.board.tasks.map((task) =>
            task.columnId === columnId
              ? { ...task, columnId: fallbackColumnId }
              : task,
          );

          return {
            board: {
              ...state.board,
              columns: remaining
                .sort((a, b) => a.order - b.order)
                .map((col, index) => ({ ...col, order: index })),
              tasks,
            },
          };
        }),

      reorderColumns: (activeId, overId) =>
        set((state) => {
          const columns = [...state.board.columns].sort(
            (a, b) => a.order - b.order,
          );
          const oldIndex = columns.findIndex((c) => c.id === activeId);
          const newIndex = columns.findIndex((c) => c.id === overId);
          if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
            return state;
          }

          const [removed] = columns.splice(oldIndex, 1);
          columns.splice(newIndex, 0, removed);

          return {
            board: {
              ...state.board,
              columns: columns.map((col, index) => ({ ...col, order: index })),
            },
          };
        }),

      addTask: (columnId, partial = {}) => {
        const id = generateId();
        const now = new Date().toISOString();
        const columnTasks = get().board.tasks.filter(
          (t) => t.columnId === columnId,
        );
        const order = columnTasks.length;

        const task: Task = {
          id,
          columnId,
          title: partial.title ?? "Untitled task",
          description: partial.description ?? "",
          priority: partial.priority ?? "medium",
          tagIds: partial.tagIds ?? [],
          dueDate: partial.dueDate,
          subtasks: partial.subtasks ?? [],
          assigneeIds: partial.assigneeIds ?? [],
          attachments: partial.attachments ?? [],
          order,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          board: {
            ...state.board,
            tasks: [...state.board.tasks, task],
          },
        }));

        return id;
      },

      updateTask: (taskId, updates) =>
        set((state) => ({
          board: {
            ...state.board,
            tasks: state.board.tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    ...updates,
                    updatedAt: new Date().toISOString(),
                  }
                : task,
            ),
          },
        })),

      deleteTask: (taskId) =>
        set((state) => {
          const task = state.board.tasks.find((t) => t.id === taskId);
          if (!task) return state;

          const remaining = state.board.tasks.filter((t) => t.id !== taskId);
          const normalized = normalizeOrders(remaining, task.columnId);
          const normalizedIds = new Set(normalized.map((t) => t.id));

          return {
            board: {
              ...state.board,
              tasks: remaining.map((t) =>
                normalizedIds.has(t.id)
                  ? (normalized.find((n) => n.id === t.id) ?? t)
                  : t,
              ),
            },
            selectedTaskId:
              state.selectedTaskId === taskId ? null : state.selectedTaskId,
            isTaskPanelOpen:
              state.selectedTaskId === taskId ? false : state.isTaskPanelOpen,
          };
        }),

      moveTask: (taskId, targetColumnId, targetIndex) =>
        set((state) => {
          const task = state.board.tasks.find((t) => t.id === taskId);
          if (!task) return state;

          const sourceColumnId = task.columnId;
          const tasksWithout = state.board.tasks.filter((t) => t.id !== taskId);

          const targetTasks = tasksWithout
            .filter((t) => t.columnId === targetColumnId)
            .sort((a, b) => a.order - b.order);

          targetTasks.splice(targetIndex, 0, {
            ...task,
            columnId: targetColumnId,
          });

          const reindexedTarget = targetTasks.map((t, index) => ({
            ...t,
            order: index,
            updatedAt:
              t.id === taskId ? new Date().toISOString() : t.updatedAt,
          }));

          let nextTasks = tasksWithout.filter(
            (t) => t.columnId !== targetColumnId,
          );
          nextTasks = [...nextTasks, ...reindexedTarget];

          if (sourceColumnId !== targetColumnId) {
            const sourceNormalized = normalizeOrders(nextTasks, sourceColumnId);
            const sourceIds = new Set(sourceNormalized.map((t) => t.id));
            nextTasks = nextTasks.map((t) =>
              sourceIds.has(t.id)
                ? (sourceNormalized.find((s) => s.id === t.id) ?? t)
                : t,
            );
          }

          return { board: { ...state.board, tasks: nextTasks } };
        }),

      reorderTasksInColumn: (columnId, activeId, overId) => {
        const { board } = get();
        const columnTasks = board.tasks
          .filter((t) => t.columnId === columnId)
          .sort((a, b) => a.order - b.order);

        const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
        const newIndex = columnTasks.findIndex((t) => t.id === overId);
        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

        const reordered = [...columnTasks];
        const [removed] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, removed);

        reordered.forEach((task, index) => {
          get().updateTask(task.id, { order: index });
        });
      },

      addTag: (tag) =>
        set((state) => ({
          board: {
            ...state.board,
            tags: [...state.board.tags, { ...tag, id: generateId() }],
          },
        })),

      addAssignee: (assignee) =>
        set((state) => ({
          board: {
            ...state.board,
            assignees: [
              ...state.board.assignees,
              { ...assignee, id: generateId() },
            ],
          },
        })),

      openTaskPanel: (taskId) =>
        set({
          selectedTaskId: taskId,
          isTaskPanelOpen: true,
          isCreatingTask: false,
          createTaskColumnId: null,
        }),

      openCreateTaskPanel: (columnId) =>
        set({
          selectedTaskId: null,
          isTaskPanelOpen: true,
          isCreatingTask: true,
          createTaskColumnId: columnId,
        }),

      closeTaskPanel: () =>
        set({
          isTaskPanelOpen: false,
          isCreatingTask: false,
          createTaskColumnId: null,
        }),

      getColumnTasks: (columnId) => {
        const { board, filters, sortBy } = get();
        const tasks = board.tasks.filter(
          (task) =>
            task.columnId === columnId && matchesFilters(task, filters, board),
        );
        return sortTasks(tasks, sortBy);
      },

      isWipExceeded: (columnId) => {
        const { board, filters } = get();
        const column = board.columns.find((c) => c.id === columnId);
        if (!column?.wipLimit) return false;

        const count = board.tasks.filter(
          (task) =>
            task.columnId === columnId && matchesFilters(task, filters, board),
        ).length;

        return count > column.wipLimit;
      },
    }),
    {
      name: STORAGE_KEYS.board,
      partialize: (state) => ({ board: state.board, sortBy: state.sortBy }),
    },
  ),
);

export type { Subtask };
