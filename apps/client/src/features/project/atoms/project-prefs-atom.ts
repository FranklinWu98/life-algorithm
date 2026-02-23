import { atomWithStorage } from 'jotai/utils';
import type { MissionStatus } from '@/features/project/types/project.types';

// ── Task property visibility ───────────────────────────────────────────────────

export interface TaskPropertyPrefs {
  showStatus: boolean;
  showImportance: boolean;
  showSchedule: boolean;
  showFinishTime: boolean;
}

export const DEFAULT_TASK_PREFS: TaskPropertyPrefs = {
  showStatus: true,
  showImportance: true,
  showSchedule: true,
  showFinishTime: true,
};

export const taskPropertyPrefsAtom = atomWithStorage<TaskPropertyPrefs>(
  'docmost:task-property-prefs',
  DEFAULT_TASK_PREFS,
);

// ── Task view mode (persisted) ─────────────────────────────────────────────────

export type TaskViewMode = 'drawer' | 'modal' | 'fullscreen';

export const taskViewModeAtom = atomWithStorage<TaskViewMode>(
  'docmost:task-view-mode',
  'drawer',
);

// ── Task note full width (persisted) ──────────────────────────────────────────

export const taskNoteFullWidthAtom = atomWithStorage<boolean>(
  'docmost:task-note-full-width',
  false,
);

// ── Mission status filter in sidebar (persisted) ───────────────────────────────

export const missionStatusFilterAtom = atomWithStorage<MissionStatus | null>(
  'docmost:mission-status-filter',
  null,
);

// ── Sort keys for sidebar (persisted) ─────────────────────────────────────────

export type DomainSortKey = 'default' | 'name-asc' | 'name-desc';
export type MissionSortKey = 'default' | 'name-asc' | 'name-desc' | 'status';

export const domainSortAtom = atomWithStorage<DomainSortKey>(
  'docmost:domain-sort',
  'default',
);
export const missionSortAtom = atomWithStorage<MissionSortKey>(
  'docmost:mission-sort',
  'default',
);

// ── Sidebar view toggle (pages vs projects) ────────────────────────────────────
export const sidebarViewAtom = atomWithStorage<'pages' | 'projects'>(
  'docmost:sidebar-view',
  'pages',
);
