import api from '@/lib/api-client';
import {
  ICreateDomain,
  ICreateMission,
  ICreateTask,
  IDomain,
  IMission,
  ITask,
  ITaskNote,
  IUpdateDomain,
  IUpdateMission,
  IUpdateTask,
} from '@/features/project/types/project.types';

// Every NestJS response is wrapped: { data: T, success: true, status: N }
// The axios interceptor returns response.data (the HTTP body),
// so we still need to extract .data from the NestJS transform wrapper.

// ── Domains ──────────────────────────────────────────────────────────────────

export async function getDomains(): Promise<IDomain[]> {
  const res = await api.get('/domains');
  return res.data;
}

export async function getDomainById(domainId: string): Promise<IDomain> {
  const res = await api.get(`/domains/${domainId}`);
  return res.data;
}

export async function createDomain(data: ICreateDomain): Promise<IDomain> {
  const res = await api.post('/domains', data);
  return res.data;
}

export async function updateDomain(
  domainId: string,
  data: IUpdateDomain,
): Promise<void> {
  await api.put(`/domains/${domainId}`, data);
}

export async function deleteDomain(domainId: string): Promise<void> {
  await api.delete(`/domains/${domainId}`);
}

// ── Missions ─────────────────────────────────────────────────────────────────

export async function getMissionsByDomain(
  domainId: string,
): Promise<IMission[]> {
  const res = await api.get('/missions', { params: { domainId } });
  return res.data;
}

export async function getMissionById(missionId: string): Promise<IMission> {
  const res = await api.get(`/missions/${missionId}`);
  return res.data;
}

export async function createMission(data: ICreateMission): Promise<IMission> {
  const res = await api.post('/missions', data);
  return res.data;
}

export async function updateMission(
  missionId: string,
  data: IUpdateMission,
): Promise<void> {
  await api.put(`/missions/${missionId}`, data);
}

export async function deleteMission(missionId: string): Promise<void> {
  await api.delete(`/missions/${missionId}`);
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function getTasksByMission(
  missionId: string,
  status?: string,
): Promise<ITask[]> {
  const res = await api.get('/tasks', { params: { missionId, status } });
  return res.data;
}

export async function getTaskById(taskId: string): Promise<ITask> {
  const res = await api.get(`/tasks/${taskId}`);
  return res.data;
}

export async function createTask(data: ICreateTask): Promise<ITask> {
  const res = await api.post('/tasks', data);
  return res.data;
}

export async function updateTask(
  taskId: string,
  data: IUpdateTask,
): Promise<void> {
  await api.put(`/tasks/${taskId}`, data);
}

export async function deleteTask(taskId: string): Promise<void> {
  await api.delete(`/tasks/${taskId}`);
}

// ── Task Notes ────────────────────────────────────────────────────────────────

export async function getTaskNote(taskId: string): Promise<ITaskNote | null> {
  const res = await api.get(`/tasks/${taskId}/note`);
  return res.data;
}

export async function updateTaskNote(
  taskId: string,
  data: { content?: Record<string, unknown>; textContent?: string },
): Promise<ITaskNote> {
  const res = await api.put(`/tasks/${taskId}/note`, data);
  return res.data;
}
