import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import {
  IDomain,
  IMission,
  ICreateDomain,
  ICreateMission,
  IUpdateDomain,
  IUpdateMission,
} from '@/features/project/types/project.types';
import type { IPage } from '@/features/page/types/page.types';
import {
  createDomain,
  createMission,
  deleteDomain,
  deleteMission,
  getDomainById,
  getDomains,
  getMissionById,
  getMissionsByDomain,
  getMissionsBySpace,
  getMissionPages,
  getSpaceTasks,
  updateDomain,
  updateMission,
} from '@/features/project/services/project-service';

// ── Query keys ────────────────────────────────────────────────────────────────
export const projectKeys = {
  domains: (spaceId: string) => ['domains', spaceId] as const,
  domain: (id: string) => ['domain', id] as const,
  missions: (domainId: string) => ['missions', domainId] as const,
  spaceMissions: (spaceId: string) => ['spaceMissions', spaceId] as const,
  mission: (id: string) => ['mission', id] as const,
  missionPages: (missionId: string) => ['missionPages', missionId] as const,
  spaceTasks: (spaceId: string) => ['spaceTasks', spaceId] as const,
};

// ── Domains ───────────────────────────────────────────────────────────────────

export function useGetDomainsQuery(spaceId: string): UseQueryResult<IDomain[], Error> {
  return useQuery({
    queryKey: projectKeys.domains(spaceId),
    queryFn: () => getDomains(spaceId),
    enabled: !!spaceId,
    staleTime: 30_000,
  });
}

export function useGetDomainQuery(
  domainId: string,
  spaceId: string,
): UseQueryResult<IDomain, Error> {
  return useQuery({
    queryKey: projectKeys.domain(domainId),
    queryFn: () => getDomainById(domainId, spaceId),
    enabled: !!domainId && !!spaceId,
  });
}

export function useCreateDomainMutation() {
  const qc = useQueryClient();
  return useMutation<IDomain, Error, ICreateDomain>({
    mutationFn: createDomain,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: projectKeys.domains(vars.spaceId) });
      notifications.show({ message: 'Domain created' });
    },
    onError: (err) => {
      notifications.show({
        message: (err as any)?.response?.data?.message ?? 'Failed to create domain',
        color: 'red',
      });
    },
  });
}

export function useUpdateDomainMutation() {
  const qc = useQueryClient();
  return useMutation<void, Error, { domainId: string; spaceId: string; data: IUpdateDomain }>({
    mutationFn: ({ domainId, spaceId, data }) => updateDomain(domainId, spaceId, data),
    onSuccess: (_, { domainId, spaceId }) => {
      qc.invalidateQueries({ queryKey: projectKeys.domains(spaceId) });
      qc.invalidateQueries({ queryKey: projectKeys.domain(domainId) });
    },
    onError: (err) => {
      notifications.show({
        message: (err as any)?.response?.data?.message ?? 'Failed to update domain',
        color: 'red',
      });
    },
  });
}

export function useDeleteDomainMutation() {
  const qc = useQueryClient();
  return useMutation<void, Error, { domainId: string; spaceId: string }>({
    mutationFn: ({ domainId, spaceId }) => deleteDomain(domainId, spaceId),
    onSuccess: (_, { spaceId }) => {
      qc.invalidateQueries({ queryKey: projectKeys.domains(spaceId) });
      notifications.show({ message: 'Domain deleted' });
    },
    onError: (err) => {
      notifications.show({
        message: (err as any)?.response?.data?.message ?? 'Failed to delete domain',
        color: 'red',
      });
    },
  });
}

// ── Missions ──────────────────────────────────────────────────────────────────

export function useGetMissionsQuery(
  domainId: string,
): UseQueryResult<IMission[], Error> {
  return useQuery({
    queryKey: projectKeys.missions(domainId),
    queryFn: () => getMissionsByDomain(domainId),
    enabled: !!domainId,
    staleTime: 30_000,
  });
}

export function useGetSpaceMissionsQuery(
  spaceId: string,
): UseQueryResult<IMission[], Error> {
  return useQuery({
    queryKey: projectKeys.spaceMissions(spaceId),
    queryFn: () => getMissionsBySpace(spaceId),
    enabled: !!spaceId,
    staleTime: 30_000,
  });
}

export function useGetMissionQuery(
  missionId: string,
): UseQueryResult<IMission, Error> {
  return useQuery({
    queryKey: projectKeys.mission(missionId),
    queryFn: () => getMissionById(missionId),
    enabled: !!missionId,
  });
}

export function useCreateMissionMutation() {
  const qc = useQueryClient();
  return useMutation<IMission, Error, ICreateMission>({
    mutationFn: createMission,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: projectKeys.missions(vars.domainId) });
      notifications.show({ message: 'Mission created' });
    },
    onError: (err) => {
      notifications.show({
        message: (err as any)?.response?.data?.message ?? 'Failed to create mission',
        color: 'red',
      });
    },
  });
}

export function useUpdateMissionMutation() {
  const qc = useQueryClient();
  return useMutation<void, Error, { missionId: string; domainId: string; data: IUpdateMission }>({
    mutationFn: ({ missionId, data }) => updateMission(missionId, data),
    onSuccess: (_, { missionId, domainId }) => {
      qc.invalidateQueries({ queryKey: projectKeys.missions(domainId) });
      qc.invalidateQueries({ queryKey: projectKeys.mission(missionId) });
    },
    onError: (err) => {
      notifications.show({
        message: (err as any)?.response?.data?.message ?? 'Failed to update mission',
        color: 'red',
      });
    },
  });
}

export function useDeleteMissionMutation() {
  const qc = useQueryClient();
  return useMutation<void, Error, { missionId: string; domainId: string; spaceId: string }>({
    mutationFn: ({ missionId }) => deleteMission(missionId),
    onSuccess: (_, { domainId }) => {
      qc.invalidateQueries({ queryKey: projectKeys.missions(domainId) });
      notifications.show({ message: 'Mission deleted' });
    },
    onError: (err) => {
      notifications.show({
        message: (err as any)?.response?.data?.message ?? 'Failed to delete mission',
        color: 'red',
      });
    },
  });
}

// ── Mission pages ─────────────────────────────────────────────────────────────

export function useGetMissionPagesQuery(
  missionId: string,
  spaceId: string,
): UseQueryResult<IPage[], Error> {
  return useQuery({
    queryKey: projectKeys.missionPages(missionId),
    queryFn: () => getMissionPages(missionId, spaceId),
    enabled: !!missionId && !!spaceId,
    staleTime: 10_000,
  });
}

export function useGetSpaceTasksQuery(spaceId: string): UseQueryResult<IPage[], Error> {
  return useQuery({
    queryKey: projectKeys.spaceTasks(spaceId),
    queryFn: () => getSpaceTasks(spaceId),
    enabled: !!spaceId,
    staleTime: 10_000,
  });
}
