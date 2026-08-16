import { useState } from "react";
import { useKanbanStore } from "@/store/kanbanStore";
import { cn } from "@/lib/utils";

export function AddColumnButton() {
  const addColumn = useKanbanStore((s) => s.addColumn);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [wipLimit, setWipLimit] = useState("");

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const limit = wipLimit.trim()
      ? Math.max(1, Number.parseInt(wipLimit, 10) || 1)
      : undefined;
    addColumn(trimmed, limit);
    setTitle("");
    setWipLimit("");
    setIsOpen(false);
  };

  return (
    <div className="w-[min(100%,320px)] shrink-0">
      {isOpen ? (
        <div className="rounded-2xl border border-border bg-column-bg p-4 animate-scale-in">
          <h3 className="mb-3 text-sm font-semibold">New column</h3>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Column name"
            className="mb-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <input
            type="number"
            min={1}
            value={wipLimit}
            onChange={(e) => setWipLimit(e.target.value)}
            placeholder="WIP limit (optional)"
            className="mb-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white"
            >
              Add column
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-border px-3 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={cn(
            "flex h-full min-h-[160px] w-full items-center justify-center rounded-2xl border border-dashed",
            "border-border bg-surface-elevated/50 text-sm font-medium text-foreground-muted",
            "transition-colors hover:border-accent hover:text-accent",
          )}
        >
          + Add column
        </button>
      )}
    </div>
  );
}
