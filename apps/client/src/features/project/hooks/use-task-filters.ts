import { useCallback, useMemo } from 'react';
import { atom, useAtom } from 'jotai';
import {
  DEFAULT_TASK_FILTERS,
  ITaskFilterState,
  TaskStatus,
  ImportantLevel,
} from '@/features/project/types/project.types';
import type { IPage } from '@/features/page/types/page.types';

// ── Atom — one filter state per session, reset when navigating away ───────────
export const taskFiltersAtom = atom<ITaskFilterState>(DEFAULT_TASK_FILTERS);

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useTaskFilters() {
  const [filters, setFilters] = useAtom(taskFiltersAtom);

  const setFilter = useCallback(
    <K extends keyof ITaskFilterState>(key: K, value: ITaskFilterState[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [setFilters],
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_TASK_FILTERS);
  }, [setFilters]);

  // Client-side filtering for pages that are mission tasks
  const applyFilters = useCallback(
    (pages: IPage[]): IPage[] => {
      return pages.filter((page) => {
        if (filters.search) {
          const q = filters.search.toLowerCase();
          if (!(page.title ?? '').toLowerCase().includes(q)) return false;
        }

        if (filters.status !== null) {
          if (page.taskStatus !== filters.status) return false;
        }

        if (filters.importantLevel !== null) {
          if (page.importantLevel !== filters.importantLevel) return false;
        }

        if (filters.timeToDoStart) {
          if (!page.timeToDoStart) return false;
          if (new Date(page.timeToDoStart) < new Date(filters.timeToDoStart))
            return false;
        }

        if (filters.timeToDoEnd) {
          if (!page.timeToDoEnd) return false;
          if (new Date(page.timeToDoEnd) > new Date(filters.timeToDoEnd))
            return false;
        }

        return true;
      });
    },
    [filters],
  );

  // ── Server-side query params ───────────────────────────────────────────────
  // When you move filtering to the server, pass these as ?params to the API.
  const toQueryParams = useCallback((): Record<string, string> => {
    const params: Record<string, string> = {};
    if (filters.search) params.search = filters.search;
    if (filters.status) params.status = filters.status;
    if (filters.importantLevel !== null)
      params.importantLevel = String(filters.importantLevel);
    if (filters.timeToDoStart) params.timeToDoStart = filters.timeToDoStart;
    if (filters.timeToDoEnd) params.timeToDoEnd = filters.timeToDoEnd;
    return params;
  }, [filters]);

  const hasActiveFilters = useMemo(
    () =>
      filters.search !== '' ||
      filters.status !== null ||
      filters.importantLevel !== null ||
      filters.timeToDoStart !== null ||
      filters.timeToDoEnd !== null,
    [filters],
  );

  return {
    filters,
    setFilter,
    resetFilters,
    applyFilters,
    toQueryParams,
    hasActiveFilters,
  };
}

// ── Display helpers — used by both sidebar badges and task rows ───────────────

export const TASK_STATUS_LABELS: Record<string, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const TASK_STATUS_COLORS: Record<string, string> = {
  not_started: 'gray',
  in_progress: 'blue',
  completed: 'green',
  cancelled: 'red',
};

export const MISSION_STATUS_COLORS: Record<string, string> = {
  active: 'blue',
  completed: 'green',
  archived: 'gray',
  cancelled: 'red',
};

export const IMPORTANCE_LABELS: Record<number, string> = {
  0: 'None',
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Urgent',
};

export const IMPORTANCE_COLORS: Record<number, string> = {
  0: 'gray',
  1: 'blue',
  2: 'yellow',
  3: 'orange',
  4: 'red',
};
