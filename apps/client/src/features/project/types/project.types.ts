export type MissionStatus = 'active' | 'completed' | 'archived' | 'cancelled';

export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled';

// 0=none, 1=low, 2=medium, 3=high, 4=urgent
export type ImportantLevel = 0 | 1 | 2 | 3 | 4;

export interface IDomain {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  sortOrder: number;
  spaceId: string;
  workspaceId: string;
  creatorId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface IMission {
  id: string;
  name: string;
  description: string | null;
  status: MissionStatus;
  startDate: string | null;
  endDate: string | null;
  sortOrder: number;
  domainId: string;
  workspaceId: string;
  creatorId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// Task properties present on a page when it belongs to a mission
export interface IPageTaskProps {
  missionId: string | null;
  taskStatus: TaskStatus | null;
  importantLevel: ImportantLevel | null;
  timeToDoStart: string | null;
  timeToDoEnd: string | null;
  finishTime: string | null;
}

// ── DTO shapes ─────────────────────────────────────────────────────────────

export interface ICreateDomain {
  name: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  spaceId: string;
}

export interface IUpdateDomain extends Partial<Omit<ICreateDomain, 'spaceId'>> {}

export interface ICreateMission {
  name: string;
  description?: string;
  status?: MissionStatus;
  startDate?: string;
  endDate?: string;
  sortOrder?: number;
  domainId: string;
  spaceId: string;
}

export interface IUpdateMission extends Partial<Omit<ICreateMission, 'domainId' | 'spaceId'>> {
  domainId?: string;
}

// Page task property update DTO (used when updating a page's mission link or task props)
export interface IUpdatePageTaskProps {
  missionId?: string | null;
  taskStatus?: TaskStatus;
  importantLevel?: ImportantLevel;
  timeToDoStart?: string | null;
  timeToDoEnd?: string | null;
  finishTime?: string | null;
}

// ── Filter shape ────────────────────────────────────────────────────────────

export interface ITaskFilterState {
  search: string;
  status: TaskStatus | null;
  importantLevel: ImportantLevel | null;
  timeToDoStart: string | null;
  timeToDoEnd: string | null;
}

export const DEFAULT_TASK_FILTERS: ITaskFilterState = {
  search: '',
  status: null,
  importantLevel: null,
  timeToDoStart: null,
  timeToDoEnd: null,
};
