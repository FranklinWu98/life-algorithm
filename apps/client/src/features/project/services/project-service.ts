import api from '@/lib/api-client';
import {
  ICreateDomain,
  ICreateMission,
  IDomain,
  IMission,
  IUpdateDomain,
  IUpdateMission,
} from '@/features/project/types/project.types';
import type { IPage } from '@/features/page/types/page.types';

// ── Domains ──────────────────────────────────────────────────────────────────

export async function getDomains(spaceId: string): Promise<IDomain[]> {
  const res = await api.get('/domains', { params: { spaceId } });
  return res.data;
}

export async function getDomainById(domainId: string, spaceId: string): Promise<IDomain> {
  const res = await api.get(`/domains/${domainId}`, { params: { spaceId } });
  return res.data;
}

export async function createDomain(data: ICreateDomain): Promise<IDomain> {
  const res = await api.post('/domains', data);
  return res.data;
}

export async function updateDomain(
  domainId: string,
  spaceId: string,
  data: IUpdateDomain,
): Promise<void> {
  await api.put(`/domains/${domainId}`, data, { params: { spaceId } });
}

export async function deleteDomain(domainId: string, spaceId: string): Promise<void> {
  await api.delete(`/domains/${domainId}`, { params: { spaceId } });
}

// ── Missions ─────────────────────────────────────────────────────────────────

export async function getMissionsByDomain(domainId: string): Promise<IMission[]> {
  const res = await api.get('/missions', { params: { domainId } });
  return res.data;
}

export async function getMissionsBySpace(spaceId: string): Promise<IMission[]> {
  const res = await api.get('/missions', { params: { spaceId } });
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

// ── Mission pages (pages that belong to a mission) ───────────────────────────

export async function getMissionPages(missionId: string, spaceId: string): Promise<IPage[]> {
  const res = await api.get(`/pages/mission/${missionId}`, { params: { spaceId } });
  return res.data;
}

// ── All task-pages for a space ────────────────────────────────────────────────

export async function getSpaceTasks(spaceId: string): Promise<IPage[]> {
  const res = await api.get('/pages/space-tasks', { params: { spaceId } });
  return res.data;
}
