import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAdminActivity,
  getAdminHealth,
  getAdminStats,
  getAdminSystem,
  getAdminUser,
  getAdminUsers,
  setUserDeactivated,
  updateAdminUser,
} from '@/features/admin/services/admin-service';
import { notifications } from '@mantine/notifications';

export const adminKeys = {
  stats: ['admin', 'stats'] as const,
  health: ['admin', 'health'] as const,
  activity: ['admin', 'activity'] as const,
  users: (page: number) => ['admin', 'users', page] as const,
  user: (id: string) => ['admin', 'user', id] as const,
  system: ['admin', 'system'] as const,
};

export function useAdminStatsQuery() {
  return useQuery({
    queryKey: adminKeys.stats,
    queryFn: getAdminStats,
    staleTime: 30_000,
    retry: false,
  });
}

export function useAdminHealthQuery() {
  return useQuery({
    queryKey: adminKeys.health,
    queryFn: getAdminHealth,
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: false,
  });
}

export function useAdminActivityQuery() {
  return useQuery({
    queryKey: adminKeys.activity,
    queryFn: getAdminActivity,
    staleTime: 60_000,
    retry: false,
  });
}

export function useAdminUsersQuery(page: number) {
  return useQuery({
    queryKey: adminKeys.users(page),
    queryFn: () => getAdminUsers(page),
    staleTime: 15_000,
    retry: false,
  });
}

export function useAdminUserQuery(userId: string | null) {
  return useQuery({
    queryKey: adminKeys.user(userId ?? ''),
    queryFn: () => getAdminUser(userId!),
    enabled: !!userId,
    staleTime: 15_000,
    retry: false,
  });
}

export function useAdminSystemQuery() {
  return useQuery({
    queryKey: adminKeys.system,
    queryFn: getAdminSystem,
    staleTime: 60_000,
    retry: false,
  });
}

export function useSetUserDeactivatedMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      deactivate,
    }: {
      userId: string;
      deactivate: boolean;
    }) => setUserDeactivated(userId, deactivate),
    onSuccess: (_, { deactivate }) => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      notifications.show({
        message: deactivate ? 'User deactivated' : 'User reactivated',
      });
    },
    onError: () => {
      notifications.show({ message: 'Failed to update user status', color: 'red' });
    },
  });
}

export function useUpdateAdminUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: { name?: string; email?: string; role?: string };
    }) => updateAdminUser(userId, data),
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: adminKeys.user(userId) });
      notifications.show({ message: 'User updated successfully' });
    },
    onError: () => {
      notifications.show({ message: 'Failed to update user', color: 'red' });
    },
  });
}
