import api from '@/lib/api-client';

export interface AdminStats {
  users: number;
  workspaces: number;
  spaces: number;
  pages: number;
  missions: number;
  domains: number;
  activeUsers: number;
  storageBytes: number;
  taskStatus: Record<string, number>;
}

export interface AdminHealth {
  uptime: number;
  db: 'ok' | 'error';
  memory: {
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
  };
  nodeVersion: string;
}

export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  avatarUrl: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  deactivatedAt: string | null;
  workspaceName: string | null;
  workspaceId: string | null;
}

export interface AdminUsersResult {
  data: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminActivity {
  id: string;
  title: string | null;
  updatedAt: string;
  spaceId: string;
  updaterName: string | null;
  updaterEmail: string | null;
  updaterAvatar: string | null;
}

export interface AdminLoginEntry {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  lastLoginAt: string;
}

export interface AdminSystemInfo {
  env: Record<string, string>;
  recentLogins: AdminLoginEntry[];
}

export async function getAdminStats(): Promise<AdminStats> {
  const res = await api.get('/admin/stats');
  return res.data;
}

export async function getAdminHealth(): Promise<AdminHealth> {
  const res = await api.get('/admin/health');
  return res.data;
}

export async function getAdminActivity(): Promise<AdminActivity[]> {
  const res = await api.get('/admin/activity');
  return res.data;
}

export async function getAdminUsers(
  page = 1,
  limit = 50,
): Promise<AdminUsersResult> {
  const res = await api.get('/admin/users', { params: { page, limit } });
  return res.data;
}

export async function getAdminUser(userId: string): Promise<AdminUser> {
  const res = await api.get(`/admin/users/${userId}`);
  return res.data;
}

export async function updateAdminUser(
  userId: string,
  data: { name?: string; email?: string; role?: string },
): Promise<void> {
  await api.patch(`/admin/users/${userId}`, data);
}

export async function setUserDeactivated(
  userId: string,
  deactivate: boolean,
): Promise<void> {
  await api.patch(`/admin/users/${userId}/deactivate`, { deactivate });
}

export async function getAdminSystem(): Promise<AdminSystemInfo> {
  const res = await api.get('/admin/system');
  return res.data;
}
