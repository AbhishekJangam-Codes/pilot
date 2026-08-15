import type {
  Assignee,
  Board,
  Column,
  Priority,
  Tag,
  Task,
} from "@/types/kanban";
import { generateId } from "@/lib/utils";

export const DEFAULT_COLUMNS: Omit<Column, "id">[] = [
  { title: "Backlog", order: 0 },
  { title: "To Do", order: 1, wipLimit: 10 },
  { title: "In Progress", order: 2, wipLimit: 5 },
  { title: "In Review", order: 3, wipLimit: 3 },
  { title: "Done", order: 4 },
];

export const DEFAULT_TAGS: Tag[] = [
  { id: "tag-bug", name: "Bug", color: "#ef4444" },
  { id: "tag-feature", name: "Feature", color: "#3b82f6" },
  { id: "tag-docs", name: "Docs", color: "#8b5cf6" },
  { id: "tag-design", name: "Design", color: "#ec4899" },
];

export const DEFAULT_ASSIGNEES: Assignee[] = [
  { id: "user-1", name: "Alex Chen", avatarUrl: undefined },
  { id: "user-2", name: "Jordan Lee", avatarUrl: undefined },
  { id: "user-3", name: "Sam Rivera", avatarUrl: undefined },
  { id: "user-4", name: "Taylor Kim", avatarUrl: undefined },
];

function createColumn(partial: Omit<Column, "id">): Column {
  return { id: generateId(), ...partial };
}

function createTask(
  partial: Omit<Task, "id" | "createdAt" | "updatedAt">,
): Task {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

export function createInitialBoard(): Board {
  const columns = DEFAULT_COLUMNS.map(createColumn);
  const [backlog, todo, inProgress, inReview, done] = columns;

  const tasks: Task[] = [
    createTask({
      columnId: backlog.id,
      title: "Research competitor onboarding flows",
      description:
        "Review **3–5 competitors** and document UX patterns.\n\n- Sign-up friction\n- Empty states\n- Activation metrics",
      priority: "medium",
      tagIds: ["tag-design"],
      assigneeIds: ["user-1"],
      subtasks: [
        { id: generateId(), title: "Collect screenshots", completed: true },
        { id: generateId(), title: "Write summary doc", completed: false },
      ],
      attachments: [
        {
          id: generateId(),
          name: "competitor-notes.pdf",
          url: "#",
          type: "application/pdf",
        },
      ],
      order: 0,
    }),
    createTask({
      columnId: todo.id,
      title: "Implement authentication API",
      description: "OAuth2 + refresh token rotation with secure cookie storage.",
      priority: "high",
      tagIds: ["tag-feature"],
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      assigneeIds: ["user-2", "user-3"],
      subtasks: [
        { id: generateId(), title: "Define endpoints", completed: true },
        { id: generateId(), title: "Add integration tests", completed: false },
        { id: generateId(), title: "Security review", completed: false },
      ],
      attachments: [],
      order: 0,
    }),
    createTask({
      columnId: inProgress.id,
      title: "Fix pagination bug on mobile",
      description: "Infinite scroll resets when rotating device.",
      priority: "urgent",
      tagIds: ["tag-bug"],
      dueDate: new Date(Date.now() - 86400000).toISOString(),
      assigneeIds: ["user-4"],
      subtasks: [],
      attachments: [],
      order: 0,
    }),
    createTask({
      columnId: inReview.id,
      title: "Update API documentation",
      description: "Sync OpenAPI spec with latest endpoints.",
      priority: "low",
      tagIds: ["tag-docs"],
      assigneeIds: ["user-1"],
      subtasks: [
        { id: generateId(), title: "Draft changelog", completed: true },
        { id: generateId(), title: "Peer review", completed: true },
      ],
      attachments: [],
      order: 0,
    }),
    createTask({
      columnId: done.id,
      title: "Ship v1 dashboard widgets",
      description: "Delivered analytics cards with dark mode support.",
      priority: "medium",
      tagIds: ["tag-feature", "tag-design"],
      assigneeIds: ["user-2"],
      subtasks: [
        { id: generateId(), title: "QA sign-off", completed: true },
      ],
      attachments: [],
      order: 0,
    }),
  ];

  return {
    id: generateId(),
    title: "Product Sprint",
    columns,
    tasks,
    tags: DEFAULT_TAGS,
    assignees: DEFAULT_ASSIGNEES,
  };
}

export const PRIORITY_COLORS: Record<
  Priority,
  { bg: string; text: string; border: string }
> = {
  low: {
    bg: "bg-priority-low/15",
    text: "text-priority-low",
    border: "border-priority-low/40",
  },
  medium: {
    bg: "bg-priority-medium/15",
    text: "text-priority-medium",
    border: "border-priority-medium/40",
  },
  high: {
    bg: "bg-priority-high/15",
    text: "text-priority-high",
    border: "border-priority-high/40",
  },
  urgent: {
    bg: "bg-priority-urgent/15",
    text: "text-priority-urgent",
    border: "border-priority-urgent/40",
  },
};

export const STORAGE_KEYS = {
  board: "pilot-kanban-board",
  theme: "pilot-theme",
  sort: "pilot-kanban-sort",
} as const;
