import { useState, type HTMLAttributes } from "react";
import type { Column } from "@/types/kanban";
import { useKanbanStore } from "@/store/kanbanStore";
import { cn } from "@/lib/utils";

interface ColumnHeaderProps {
  column: Column;
  taskCount: number;
  wipExceeded: boolean;
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>;
}

export function ColumnHeader({
  column,
  taskCount,
  wipExceeded,
  dragHandleProps,
}: ColumnHeaderProps) {
  const updateColumn = useKanbanStore((s) => s.updateColumn);
  const deleteColumn = useKanbanStore((s) => s.deleteColumn);

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [showSettings, setShowSettings] = useState(false);
  const [wipInput, setWipInput] = useState(
    column.wipLimit?.toString() ?? "",
  );

  const saveTitle = () => {
    const trimmed = title.trim();
    if (trimmed) updateColumn(column.id, { title: trimmed });
    else setTitle(column.title);
    setIsEditing(false);
  };

  const saveWipLimit = () => {
    const value = wipInput.trim();
    updateColumn(column.id, {
      wipLimit: value ? Math.max(1, Number.parseInt(value, 10) || 1) : undefined,
    });
    setShowSettings(false);
  };

  return (
    <div className="mb-3 flex flex-col gap-2">
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-1 cursor-grab rounded p-1 text-foreground-muted hover:bg-surface-muted active:cursor-grabbing"
          aria-label={`Drag column ${column.title}`}
          {...dragHandleProps}
        >
          ⠿
        </button>

        <div className="min-w-0 flex-1">
          {isEditing ? (
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTitle();
                if (e.key === "Escape") {
                  setTitle(column.title);
                  setIsEditing(false);
                }
              }}
              className="w-full rounded-md border border-border bg-surface px-2 py-1 text-sm font-semibold"
              aria-label="Column title"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="truncate text-left text-sm font-semibold text-foreground hover:text-accent"
            >
              {column.title}
            </button>
          )}

          <div className="mt-1 flex items-center gap-2 text-xs">
            <span
              className={cn(
                "font-medium",
                wipExceeded ? "text-danger" : "text-foreground-muted",
              )}
            >
              {taskCount}
              {column.wipLimit ? ` / ${column.wipLimit}` : ""} tasks
            </span>
            {wipExceeded && (
              <span className="rounded-full bg-danger/15 px-2 py-0.5 font-semibold text-danger">
                WIP exceeded
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            className="rounded p-1 text-foreground-muted hover:bg-surface-muted"
            aria-label={`Column settings for ${column.title}`}
            aria-expanded={showSettings}
          >
            ⚙
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  `Delete column "${column.title}"? Tasks will move to the first column.`,
                )
              ) {
                deleteColumn(column.id);
              }
            }}
            className="rounded p-1 text-foreground-muted hover:bg-danger/10 hover:text-danger"
            aria-label={`Delete column ${column.title}`}
          >
            ✕
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="rounded-lg border border-border bg-surface p-3 animate-scale-in">
          <label className="mb-1 block text-xs font-semibold text-foreground-muted">
            WIP limit (optional)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={wipInput}
              onChange={(e) => setWipInput(e.target.value)}
              placeholder="No limit"
              className="w-full rounded-md border border-border bg-surface-elevated px-2 py-1 text-sm"
            />
            <button
              type="button"
              onClick={saveWipLimit}
              className="rounded-md bg-accent px-3 py-1 text-sm font-medium text-white"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
