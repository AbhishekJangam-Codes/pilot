# Pilot — Kanban Board

A full-featured, responsive Kanban board built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS v4**, **Zustand**, and **@dnd-kit**.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## File hierarchy

```
pilot/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── src/
    ├── main.tsx                 # App bootstrap
    ├── App.tsx                  # Renders <KanbanBoard />
    ├── index.css                # Theme tokens (light/dark, WCAG-friendly)
    ├── types/
    │   └── kanban.ts            # Task, Column, Board, Priority, Tag, etc.
    ├── store/
    │   └── kanbanStore.ts       # Zustand store + localStorage persistence
    ├── hooks/
    │   └── useTheme.ts          # Theme toggle + system preference
    ├── lib/
    │   ├── utils.ts             # Helpers (dates, progress, cn)
    │   └── constants.ts         # Seed data, priority colors
    └── components/kanban/
        ├── index.ts
        ├── KanbanBoard.tsx      # DnD context, keyboard movement
        ├── KanbanColumn.tsx     # Column + droppable task list
        ├── KanbanCard.tsx       # Task card with progress bar
        ├── ColumnHeader.tsx     # Rename, WIP limit, delete
        ├── BoardToolbar.tsx     # Search, filters, sort
        ├── TaskDrawer.tsx       # CRUD slide-over panel
        ├── AddColumnButton.tsx  # Dynamic column creation
        ├── ThemeToggle.tsx      # Light / Dark / System
        ├── PriorityBadge.tsx
        └── DropIndicator.tsx
```

## Features

| Area | Capability |
|------|------------|
| **Columns** | Backlog, To Do, In Progress, In Review, Done (seed) + add/rename/reorder/delete |
| **WIP limits** | Per-column limits with visual “WIP exceeded” indicator |
| **Tasks** | Title, Markdown description, priority, tags, due dates, subtasks, assignees, attachment placeholders |
| **CRUD** | Slide-over drawer for create/edit/delete |
| **Progress** | Auto-updating subtask progress bar on cards |
| **Drag & drop** | Reorder within columns, move across columns, drag overlay, drop indicators |
| **Accessibility** | Keyboard sensors (@dnd-kit), arrow-key column/reorder movement |
| **Search & filters** | Title/tag/assignee search; priority, assignee, due-date filters |
| **Sorting** | Manual, due date, or priority within columns |
| **Theme** | Light / Dark / System with `localStorage` persistence |
| **Persistence** | Board state persisted to `localStorage` (`pilot-kanban-board`) |

## Integration

The board is already wired in `src/App.tsx`:

```tsx
import { KanbanBoard } from "@/components/kanban";

export default function App() {
  return <KanbanBoard />;
}
```

To embed in an existing layout, import and render `KanbanBoard` (or individual exports from `@/components/kanban`) anywhere in your route tree:

```tsx
import { KanbanBoard, ThemeToggle } from "@/components/kanban";

function ProjectPage() {
  return (
    <div className="min-h-screen">
      {/* Optional: use ThemeToggle standalone elsewhere */}
      <KanbanBoard />
    </div>
  );
}
```

Ensure `src/index.css` is imported once at the app entry (already done in `main.tsx`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build |

## Storage keys

- `pilot-kanban-board` — board columns, tasks, tags, assignees
- `pilot-theme` — `light` \| `dark` \| `system`
