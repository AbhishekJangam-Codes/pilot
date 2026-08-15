import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Priority, Subtask, Task } from "@/types/kanban";
import { PRIORITY_LABELS } from "@/types/kanban";
import { useKanbanStore } from "@/store/kanbanStore";
import { generateId } from "@/lib/utils";
import { cn } from "@/lib/utils";

const EMPTY_TASK: Omit<Task, "id" | "createdAt" | "updatedAt" | "columnId" | "order"> = {
  title: "",
  description: "",
  priority: "medium",
  tagIds: [],
  subtasks: [],
  assigneeIds: [],
  attachments: [],
};

export function TaskDrawer() {
  const board = useKanbanStore((s) => s.board);
  const isOpen = useKanbanStore((s) => s.isTaskPanelOpen);
  const isCreating = useKanbanStore((s) => s.isCreatingTask);
  const selectedTaskId = useKanbanStore((s) => s.selectedTaskId);
  const createTaskColumnId = useKanbanStore((s) => s.createTaskColumnId);
  const closeTaskPanel = useKanbanStore((s) => s.closeTaskPanel);
  const addTask = useKanbanStore((s) => s.addTask);
  const updateTask = useKanbanStore((s) => s.updateTask);
  const deleteTask = useKanbanStore((s) => s.deleteTask);

  const existingTask = useMemo(
    () => board.tasks.find((t) => t.id === selectedTaskId),
    [board.tasks, selectedTaskId],
  );

  const [draft, setDraft] = useState(EMPTY_TASK);
  const [previewMarkdown, setPreviewMarkdown] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const [attachmentName, setAttachmentName] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    if (isCreating) {
      setDraft({ ...EMPTY_TASK });
    } else if (existingTask) {
      setDraft({
        title: existingTask.title,
        description: existingTask.description,
        priority: existingTask.priority,
        tagIds: [...existingTask.tagIds],
        dueDate: existingTask.dueDate,
        subtasks: existingTask.subtasks.map((s) => ({ ...s })),
        assigneeIds: [...existingTask.assigneeIds],
        attachments: existingTask.attachments.map((a) => ({ ...a })),
      });
    }

    setPreviewMarkdown(false);
    setNewSubtask("");
    setAttachmentName("");
  }, [isOpen, isCreating, existingTask]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) closeTaskPanel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeTaskPanel]);

  if (!isOpen) return null;

  const title = isCreating ? "Create task" : "Edit task";

  const toggleTag = (tagId: string) => {
    setDraft((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  const toggleAssignee = (assigneeId: string) => {
    setDraft((prev) => ({
      ...prev,
      assigneeIds: prev.assigneeIds.includes(assigneeId)
        ? prev.assigneeIds.filter((id) => id !== assigneeId)
        : [...prev.assigneeIds, assigneeId],
    }));
  };

  const addSubtask = () => {
    const trimmed = newSubtask.trim();
    if (!trimmed) return;
    const subtask: Subtask = {
      id: generateId(),
      title: trimmed,
      completed: false,
    };
    setDraft((prev) => ({ ...prev, subtasks: [...prev.subtasks, subtask] }));
    setNewSubtask("");
  };

  const toggleSubtask = (subtaskId: string) => {
    setDraft((prev) => ({
      ...prev,
      subtasks: prev.subtasks.map((s) =>
        s.id === subtaskId ? { ...s, completed: !s.completed } : s,
      ),
    }));
  };

  const removeSubtask = (subtaskId: string) => {
    setDraft((prev) => ({
      ...prev,
      subtasks: prev.subtasks.filter((s) => s.id !== subtaskId),
    }));
  };

  const addAttachmentPlaceholder = () => {
    const trimmed = attachmentName.trim();
    if (!trimmed) return;
    setDraft((prev) => ({
      ...prev,
      attachments: [
        ...prev.attachments,
        {
          id: generateId(),
          name: trimmed,
          url: "#",
          type: "application/octet-stream",
        },
      ],
    }));
    setAttachmentName("");
  };

  const handleSave = () => {
    const trimmedTitle = draft.title.trim() || "Untitled task";

    if (isCreating && createTaskColumnId) {
      addTask(createTaskColumnId, { ...draft, title: trimmedTitle });
    } else if (existingTask) {
      updateTask(existingTask.id, { ...draft, title: trimmedTitle });
    }

    closeTaskPanel();
  };

  const handleDelete = () => {
    if (!existingTask) return;
    if (window.confirm(`Delete task "${existingTask.title}"?`)) {
      deleteTask(existingTask.id);
      closeTaskPanel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--color-overlay)] animate-fade-in"
        aria-label="Close task panel"
        onClick={closeTaskPanel}
      />

      <aside
        className={cn(
          "relative flex h-full w-full max-w-xl flex-col border-l border-border bg-surface shadow-2xl",
          "animate-slide-in-right",
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            type="button"
            onClick={closeTaskPanel}
            className="rounded-lg px-3 py-1 text-sm text-foreground-muted hover:bg-surface-muted"
          >
            Close
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
          <div className="space-y-5">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                Title
              </label>
              <input
                value={draft.title}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm"
                placeholder="Task title"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                  Description (Markdown)
                </label>
                <button
                  type="button"
                  onClick={() => setPreviewMarkdown((v) => !v)}
                  className="text-xs font-medium text-accent"
                >
                  {previewMarkdown ? "Edit" : "Preview"}
                </button>
              </div>
              {previewMarkdown ? (
                <div className="prose prose-sm max-w-none rounded-lg border border-border bg-surface-elevated p-3 text-sm dark:prose-invert">
                  <ReactMarkdown>{draft.description || "_No description_"}</ReactMarkdown>
                </div>
              ) : (
                <textarea
                  value={draft.description}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={6}
                  className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm"
                  placeholder="Supports **markdown** formatting"
                />
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                  Priority
                </label>
                <select
                  value={draft.priority}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      priority: e.target.value as Priority,
                    }))
                  }
                  className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm"
                >
                  {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                  Due date
                </label>
                <input
                  type="date"
                  value={draft.dueDate ? draft.dueDate.slice(0, 10) : ""}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      dueDate: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : undefined,
                    }))
                  }
                  className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                Labels
              </label>
              <div className="flex flex-wrap gap-2">
                {board.tags.map((tag) => {
                  const active = draft.tagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold text-white transition-opacity",
                        !active && "opacity-40 hover:opacity-70",
                      )}
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                Assignees
              </label>
              <div className="flex flex-wrap gap-2">
                {board.assignees.map((assignee) => {
                  const active = draft.assigneeIds.includes(assignee.id);
                  return (
                    <button
                      key={assignee.id}
                      type="button"
                      onClick={() => toggleAssignee(assignee.id)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium",
                        active
                          ? "border-accent bg-accent-muted text-accent"
                          : "border-border bg-surface-elevated text-foreground-muted",
                      )}
                    >
                      {assignee.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                Subtasks
              </label>
              <ul className="space-y-2">
                {draft.subtasks.map((subtask) => (
                  <li
                    key={subtask.id}
                    className="flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => toggleSubtask(subtask.id)}
                      aria-label={`Mark subtask ${subtask.title} complete`}
                    />
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        subtask.completed && "line-through text-foreground-muted",
                      )}
                    >
                      {subtask.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSubtask(subtask.id)}
                      className="text-xs text-danger"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex gap-2">
                <input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSubtask()}
                  placeholder="Add subtask"
                  className="flex-1 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={addSubtask}
                  className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white"
                >
                  Add
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                Attachments (placeholders)
              </label>
              <ul className="mb-2 space-y-1">
                {draft.attachments.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span>📎 {file.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          attachments: prev.attachments.filter(
                            (a) => a.id !== file.id,
                          ),
                        }))
                      }
                      className="text-xs text-danger"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <input
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addAttachmentPlaceholder()}
                  placeholder="Attachment name"
                  className="flex-1 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={addAttachmentPlaceholder}
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
          {!isCreating && existingTask ? (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10"
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={closeTaskPanel}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
            >
              {isCreating ? "Create" : "Save changes"}
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}
