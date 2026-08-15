export type Priority = "low" | "medium" | "high" | "urgent";

export type SortOption = "manual" | "dueDate" | "priority";

export type ThemeMode = "light" | "dark" | "system";

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
}

export interface Assignee {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface Task {
  id: string;
  columnId: string;
  title: string;
  description: string;
  priority: Priority;
  tagIds: string[];
  dueDate?: string;
  subtasks: Subtask[];
  assigneeIds: string[];
  attachments: Attachment[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  title: string;
  order: number;
  wipLimit?: number;
}

export interface Board {
  id: string;
  title: string;
  columns: Column[];
  tasks: Task[];
  tags: Tag[];
  assignees: Assignee[];
}

export interface FilterState {
  search: string;
  priorities: Priority[];
  assigneeIds: string[];
  dueDateFilter: "all" | "overdue" | "today" | "week" | "none";
}

export const PRIORITY_ORDER: Record<Priority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};
