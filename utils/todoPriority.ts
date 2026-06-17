import { TodoPriority } from '../types.ts';

const LEGACY_PRIORITY_MAP: Record<string, TodoPriority> = {
  high: TodoPriority.P0,
  medium: TodoPriority.P1,
  low: TodoPriority.P3,
};

export const normalizeTodoPriority = (priority?: string | TodoPriority | null): TodoPriority => {
  if (!priority) return TodoPriority.P3;
  if (Object.values(TodoPriority).includes(priority as TodoPriority)) {
    return priority as TodoPriority;
  }

  return LEGACY_PRIORITY_MAP[String(priority).toLowerCase()] ?? TodoPriority.P3;
};
