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

export interface ITask {
  id: string;
  name: string;
  status: TaskStatus;
  importantLevel: ImportantLevel;
  timeToDoStart: string | null;
  timeToDoEnd: string | null;
  finishTime: string | null;
  sortOrder: number;
  missionId: string;
  workspaceId: string;
  creatorId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  // eagerly-loaded relations
  note?: ITaskNote | null;
  creator?: { id: string; name: string; avatarUrl: string | null } | null;
}

export interface ITaskNote {
  taskId: string;
  content: Record<string, unknown> | null;
  textContent: string | null;
  version: number;
  updatedAt: string;
}

// ── DTO shapes ─────────────────────────────────────────────────────────────

export interface ICreateDomain {
  name: string;
  description?: string;
  color?: string;
  sortOrder?: number;
}

export interface IUpdateDomain extends Partial<ICreateDomain> {}

export interface ICreateMission {
  name: string;
  description?: string;
  status?: MissionStatus;
  startDate?: string;
  endDate?: string;
  sortOrder?: number;
  domainId: string;
}

export interface IUpdateMission extends Partial<Omit<ICreateMission, 'domainId'>> {
  domainId?: string;
}

export interface ICreateTask {
  name: string;
  status?: TaskStatus;
  importantLevel?: ImportantLevel;
  timeToDoStart?: string;
  timeToDoEnd?: string;
  sortOrder?: number;
  missionId: string;
}

export interface IUpdateTask extends Partial<Omit<ICreateTask, 'missionId'>> {
  missionId?: string;
  finishTime?: string;
}

// ── Filter shape — designed to grow ────────────────────────────────────────

export interface ITaskFilterState {
  search: string;
  status: TaskStatus | null;
  importantLevel: ImportantLevel | null;
  timeToDoStart: string | null; // ISO date
  timeToDoEnd: string | null;   // ISO date
}

export const DEFAULT_TASK_FILTERS: ITaskFilterState = {
  search: '',
  status: null,
  importantLevel: null,
  timeToDoStart: null,
  timeToDoEnd: null,
};
