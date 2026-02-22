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
  ITask,
  ITaskNote,
  ICreateDomain,
  ICreateMission,
  ICreateTask,
  IUpdateDomain,
  IUpdateMission,
  IUpdateTask,
} from '@/features/project/types/project.types';
import {
  createDomain,
  createMission,
  createTask,
  deleteDomain,
  deleteMission,
  deleteTask,
  getDomainById,
  getDomains,
  getMissionById,
  getMissionsByDomain,
  getTaskById,
  getTasksByMission,
  getTaskNote,
  updateDomain,
  updateMission,
  updateTask,
  updateTaskNote,
} from '@/features/project/services/project-service';

// ── Query keys ────────────────────────────────────────────────────────────────
export const projectKeys = {
  domains: () => ['domains'] as const,
  domain: (id: string) => ['domain', id] as const,
  missions: (domainId: string) => ['missions', domainId] as const,
  mission: (id: string) => ['mission', id] as const,
  tasks: (missionId: string) => ['tasks', missionId] as const,
  task: (id: string) => ['task', id] as const,
  taskNote: (taskId: string) => ['taskNote', taskId] as const,
};

// ── Domains ───────────────────────────────────────────────────────────────────

export function useGetDomainsQuery(): UseQueryResult<IDomain[], Error> {
  return useQuery({
    queryKey: projectKeys.domains(),
    queryFn: getDomains,
    staleTime: 30_000,
  });
}

export function useGetDomainQuery(
  domainId: string,
): UseQueryResult<IDomain, Error> {
  return useQuery({
    queryKey: projectKeys.domain(domainId),
    queryFn: () => getDomainById(domainId),
    enabled: !!domainId,
  });
}

export function useCreateDomainMutation() {
  const qc = useQueryClient();
  return useMutation<IDomain, Error, ICreateDomain>({
    mutationFn: createDomain,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.domains() });
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
  return useMutation<void, Error, { domainId: string; data: IUpdateDomain }>({
    mutationFn: ({ domainId, data }) => updateDomain(domainId, data),
    onSuccess: (_, { domainId }) => {
      qc.invalidateQueries({ queryKey: projectKeys.domains() });
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
  return useMutation<void, Error, string>({
    mutationFn: deleteDomain,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.domains() });
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
  return useMutation<void, Error, { missionId: string; domainId: string }>({
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

// ── Tasks ─────────────────────────────────────────────────────────────────────

export function useGetTasksQuery(
  missionId: string,
): UseQueryResult<ITask[], Error> {
  return useQuery({
    queryKey: projectKeys.tasks(missionId),
    queryFn: () => getTasksByMission(missionId),
    enabled: !!missionId,
    staleTime: 10_000,
  });
}

export function useGetTaskQuery(taskId: string): UseQueryResult<ITask, Error> {
  return useQuery({
    queryKey: projectKeys.task(taskId),
    queryFn: () => getTaskById(taskId),
    enabled: !!taskId,
  });
}

export function useCreateTaskMutation() {
  const qc = useQueryClient();
  return useMutation<ITask, Error, ICreateTask>({
    mutationFn: createTask,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: projectKeys.tasks(vars.missionId) });
    },
    onError: (err) => {
      notifications.show({
        message: (err as any)?.response?.data?.message ?? 'Failed to create task',
        color: 'red',
      });
    },
  });
}

export function useUpdateTaskMutation() {
  const qc = useQueryClient();
  return useMutation<void, Error, { taskId: string; missionId: string; data: IUpdateTask }>({
    mutationFn: ({ taskId, data }) => updateTask(taskId, data),
    onSuccess: (_, { taskId, missionId }) => {
      qc.invalidateQueries({ queryKey: projectKeys.tasks(missionId) });
      qc.invalidateQueries({ queryKey: projectKeys.task(taskId) });
    },
    onError: (err) => {
      notifications.show({
        message: (err as any)?.response?.data?.message ?? 'Failed to update task',
        color: 'red',
      });
    },
  });
}

export function useDeleteTaskMutation() {
  const qc = useQueryClient();
  return useMutation<void, Error, { taskId: string; missionId: string }>({
    mutationFn: ({ taskId }) => deleteTask(taskId),
    onSuccess: (_, { missionId }) => {
      qc.invalidateQueries({ queryKey: projectKeys.tasks(missionId) });
      notifications.show({ message: 'Task deleted' });
    },
    onError: (err) => {
      notifications.show({
        message: (err as any)?.response?.data?.message ?? 'Failed to delete task',
        color: 'red',
      });
    },
  });
}

// ── Task Notes ─────────────────────────────────────────────────────────────────

export function useGetTaskNoteQuery(taskId: string) {
  return useQuery<ITaskNote | null, Error>({
    queryKey: projectKeys.taskNote(taskId),
    queryFn: () => getTaskNote(taskId),
    enabled: !!taskId,
    staleTime: 5_000,
  });
}

export function useUpdateTaskNoteMutation() {
  const qc = useQueryClient();
  return useMutation<ITaskNote, Error, { taskId: string; data: { content?: Record<string, unknown>; textContent?: string } }>({
    mutationFn: ({ taskId, data }) => updateTaskNote(taskId, data),
    onSuccess: (_, { taskId }) => {
      qc.invalidateQueries({ queryKey: projectKeys.taskNote(taskId) });
    },
    onError: (err) => {
      notifications.show({
        message: (err as any)?.response?.data?.message ?? 'Failed to save note',
        color: 'red',
      });
    },
  });
}
