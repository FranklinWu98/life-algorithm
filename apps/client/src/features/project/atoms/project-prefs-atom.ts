import { atom } from 'jotai';
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

// ── Mission status filter in sidebar (session only) ────────────────────────────

export const missionStatusFilterAtom = atom<MissionStatus | null>(null);
