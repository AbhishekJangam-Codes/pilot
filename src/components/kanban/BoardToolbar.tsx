import { useKanbanStore } from "@/store/kanbanStore";
import type { Priority, SortOption } from "@/types/kanban";
import { PRIORITY_LABELS } from "@/types/kanban";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "manual", label: "Manual order" },
  { value: "dueDate", label: "Due date" },
  { value: "priority", label: "Priority" },
];

const DUE_FILTERS = [
  { value: "all", label: "All dates" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Due today" },
  { value: "week", label: "Due this week" },
  { value: "none", label: "No due date" },
] as const;

export function BoardToolbar() {
  const board = useKanbanStore((s) => s.board);
  const filters = useKanbanStore((s) => s.filters);
  const sortBy = useKanbanStore((s) => s.sortBy);
  const setFilters = useKanbanStore((s) => s.setFilters);
  const resetFilters = useKanbanStore((s) => s.resetFilters);
  const setSortBy = useKanbanStore((s) => s.setSortBy);
  const setBoardTitle = useKanbanStore((s) => s.setBoardTitle);

  const togglePriority = (priority: Priority) => {
    const exists = filters.priorities.includes(priority);
    setFilters({
      priorities: exists
        ? filters.priorities.filter((p) => p !== priority)
        : [...filters.priorities, priority],
    });
  };

  const toggleAssignee = (assigneeId: string) => {
    const exists = filters.assigneeIds.includes(assigneeId);
    setFilters({
      assigneeIds: exists
        ? filters.assigneeIds.filter((id) => id !== assigneeId)
        : [...filters.assigneeIds, assigneeId],
    });
  };

  const hasActiveFilters =
    filters.search.length > 0 ||
    filters.priorities.length > 0 ||
    filters.assigneeIds.length > 0 ||
    filters.dueDateFilter !== "all";

  return (
    <header className="border-b border-border bg-surface px-4 py-4 lg:px-6">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <input
              type="text"
              value={board.title}
              onChange={(e) => setBoardTitle(e.target.value)}
              className="w-full max-w-md truncate border-none bg-transparent text-2xl font-bold text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Board title"
            />
            <p className="mt-1 text-sm text-foreground-muted">
              Drag cards, filter tasks, and manage columns with WIP limits.
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              Search
            </label>
            <input
              type="search"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              placeholder="Search by title, tag, or assignee…"
              className={cn(
                "w-full max-w-xl rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm",
                "text-foreground placeholder:text-foreground-muted",
              )}
              aria-label="Search tasks"
            />
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                Sort
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm"
                aria-label="Sort tasks within columns"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                Due date
              </span>
              <select
                value={filters.dueDateFilter}
                onChange={(e) =>
                  setFilters({
                    dueDateFilter: e.target
                      .value as typeof filters.dueDateFilter,
                  })
                }
                className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm"
                aria-label="Filter by due date"
              >
                {DUE_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
            Priority
          </span>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PRIORITY_LABELS) as Priority[]).map((priority) => {
              const active = filters.priorities.includes(priority);
              return (
                <button
                  key={priority}
                  type="button"
                  onClick={() => togglePriority(priority)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                    active
                      ? "border-accent bg-accent-muted text-accent"
                      : "border-border bg-surface-elevated text-foreground-muted hover:bg-surface-muted",
                  )}
                >
                  {PRIORITY_LABELS[priority]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
            Assignees
          </span>
          <div className="flex flex-wrap gap-2">
            {board.assignees.map((assignee) => {
              const active = filters.assigneeIds.includes(assignee.id);
              return (
                <button
                  key={assignee.id}
                  type="button"
                  onClick={() => toggleAssignee(assignee.id)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    active
                      ? "border-accent bg-accent-muted text-accent"
                      : "border-border bg-surface-elevated text-foreground-muted hover:bg-surface-muted",
                  )}
                >
                  {assignee.name}
                </button>
              );
            })}
          </div>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="self-start text-sm font-medium text-accent hover:text-accent-hover"
          >
            Clear all filters
          </button>
        )}
      </div>
    </header>
  );
}
