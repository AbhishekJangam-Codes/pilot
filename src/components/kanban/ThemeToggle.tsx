import { useTheme } from "@/hooks/useTheme";
import type { ThemeMode } from "@/types/kanban";
import { cn } from "@/lib/utils";

const LABELS: Record<ThemeMode, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

const ICONS: Record<ThemeMode, string> = {
  light: "☀️",
  dark: "🌙",
  system: "💻",
};

export function ThemeToggle() {
  const { mode, cycleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm font-medium",
        "text-foreground transition-colors hover:bg-surface-muted",
      )}
      aria-label={`Theme: ${LABELS[mode]}. Click to switch theme.`}
      title={`Theme: ${LABELS[mode]}`}
    >
      <span aria-hidden="true">{ICONS[mode]}</span>
      <span>{LABELS[mode]}</span>
    </button>
  );
}
