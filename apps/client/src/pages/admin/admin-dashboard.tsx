import {
  Avatar,
  Badge,
  Card,
  Grid,
  Group,
  Loader,
  RingProgress,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  IconFile,
  IconTarget,
  IconUsers,
  IconWorld,
  IconFolder,
  IconDeviceFloppy,
} from '@tabler/icons-react';
import {
  useAdminActivityQuery,
  useAdminHealthQuery,
  useAdminStatsQuery,
} from '@/features/admin/queries/admin-query';

interface StatCardProps {
  label: string;
  value: number | undefined;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}

function StatCard({ label, value, icon, color, sub }: StatCardProps) {
  return (
    <Card withBorder padding="md" radius="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            {label}
          </Text>
          {value === undefined ? (
            <Loader size="xs" />
          ) : (
            <Text size="xl" fw={700}>
              {value.toLocaleString()}
            </Text>
          )}
          {sub && (
            <Text size="xs" c="dimmed">
              {sub}
            </Text>
          )}
        </Stack>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: `var(--mantine-color-${color}-1)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: `var(--mantine-color-${color}-6)`,
          }}
        >
          {icon}
        </div>
      </Group>
    </Card>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  not_started: { label: 'Not started', color: 'gray' },
  in_progress: { label: 'In progress', color: 'blue' },
  completed: { label: 'Completed', color: 'green' },
  cancelled: { label: 'Cancelled', color: 'red' },
};

const RING_COLORS: Record<string, string> = {
  not_started: '#868e96',
  in_progress: '#228be6',
  completed: '#40c057',
  cancelled: '#fa5252',
};

export default function AdminDashboard() {
  const { data: stats } = useAdminStatsQuery();
  const { data: health } = useAdminHealthQuery();
  const { data: activity = [] } = useAdminActivityQuery();

  const totalTasks = stats
    ? Object.values(stats.taskStatus).reduce((s, n) => s + n, 0)
    : 0;

  const ringData = stats
    ? Object.entries(stats.taskStatus)
        .filter(([, count]) => count > 0)
        .map(([status, count]) => ({
          value: totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0,
          color: RING_COLORS[status] ?? '#868e96',
          tooltip: `${STATUS_LABELS[status]?.label ?? status}: ${count}`,
        }))
    : [];

  return (
    <Stack gap="lg">
      <Title order={3}>Dashboard</Title>

      {/* Stats Row 1 */}
      <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }}>
        <StatCard
          label="Users"
          value={stats?.users}
          icon={<IconUsers size={18} />}
          color="blue"
          sub={stats ? `${stats.activeUsers} active (30d)` : undefined}
        />
        <StatCard
          label="Workspaces"
          value={stats?.workspaces}
          icon={<IconWorld size={18} />}
          color="grape"
        />
        <StatCard
          label="Spaces"
          value={stats?.spaces}
          icon={<IconFolder size={18} />}
          color="teal"
        />
        <StatCard
          label="Pages"
          value={stats?.pages}
          icon={<IconFile size={18} />}
          color="orange"
        />
        <StatCard
          label="Missions"
          value={stats?.missions}
          icon={<IconTarget size={18} />}
          color="pink"
        />
        <Card withBorder padding="md" radius="md">
          <Group justify="space-between" align="flex-start">
            <Stack gap={4}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Storage
              </Text>
              {stats === undefined ? (
                <Loader size="xs" />
              ) : (
                <Text size="xl" fw={700}>
                  {formatBytes(stats.storageBytes)}
                </Text>
              )}
            </Stack>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'var(--mantine-color-cyan-1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--mantine-color-cyan-6)',
              }}
            >
              <IconDeviceFloppy size={18} />
            </div>
          </Group>
        </Card>
      </SimpleGrid>

      <Grid>
        {/* Task Status */}
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Card withBorder padding="md" radius="md" h="100%">
            <Text size="sm" fw={600} mb="md">
              Task Status
            </Text>
            {stats ? (
              totalTasks === 0 ? (
                <Text size="sm" c="dimmed">No tasks yet</Text>
              ) : (
                <Group align="center" gap="xl">
                  <RingProgress
                    size={120}
                    thickness={14}
                    sections={ringData}
                    label={
                      <Text size="xs" ta="center" fw={600}>
                        {totalTasks}
                        <br />
                        <Text span size="xs" c="dimmed">tasks</Text>
                      </Text>
                    }
                  />
                  <Stack gap={6}>
                    {Object.entries(stats.taskStatus).map(([status, count]) => (
                      <Group key={status} gap="xs">
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 2,
                            background: RING_COLORS[status] ?? '#868e96',
                            flexShrink: 0,
                          }}
                        />
                        <Text size="xs" c="dimmed">
                          {STATUS_LABELS[status]?.label ?? status}
                        </Text>
                        <Text size="xs" fw={600}>{count}</Text>
                      </Group>
                    ))}
                  </Stack>
                </Group>
              )
            ) : (
              <Loader size="xs" />
            )}
          </Card>
        </Grid.Col>

        {/* Active Users */}
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Card withBorder padding="md" radius="md" h="100%">
            <Text size="sm" fw={600} mb="md">
              User Activity
            </Text>
            {stats ? (
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Total users</Text>
                  <Text size="sm" fw={600}>{stats.users.toLocaleString()}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Active (last 30d)</Text>
                  <Badge color="green" variant="light" size="sm">
                    {stats.activeUsers.toLocaleString()}
                  </Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Inactive</Text>
                  <Text size="sm" c="dimmed">
                    {(stats.users - stats.activeUsers).toLocaleString()}
                  </Text>
                </Group>
                {stats.users > 0 && (
                  <div
                    style={{
                      marginTop: 8,
                      height: 6,
                      borderRadius: 4,
                      background: 'var(--mantine-color-gray-2)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.round((stats.activeUsers / stats.users) * 100)}%`,
                        background: 'var(--mantine-color-green-5)',
                        borderRadius: 4,
                      }}
                    />
                  </div>
                )}
              </Stack>
            ) : (
              <Loader size="xs" />
            )}
          </Card>
        </Grid.Col>

        {/* Health */}
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Card withBorder padding="md" radius="md" h="100%">
            <Text size="sm" fw={600} mb="md">
              Server Health
            </Text>
            {health ? (
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Database</Text>
                  <Badge color={health.db === 'ok' ? 'green' : 'red'} variant="light" size="sm">
                    {health.db === 'ok' ? 'Connected' : 'Error'}
                  </Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Uptime</Text>
                  <Text size="sm">{formatUptime(health.uptime)}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Node.js</Text>
                  <Text size="sm">{health.nodeVersion}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Heap used</Text>
                  <Text size="sm">{health.memory.heapUsedMb} MB</Text>
                </Group>
              </Stack>
            ) : (
              <Loader size="xs" />
            )}
          </Card>
        </Grid.Col>
      </Grid>

      {/* Recent Activity */}
      <Title order={4} mt="sm">
        Recent Activity
      </Title>
      <Card withBorder padding={0} radius="md">
        {activity.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="xl">
            No recent activity
          </Text>
        ) : (
          <Stack gap={0}>
            {activity.map((item, i) => (
              <div
                key={item.id}
                style={{
                  padding: '10px 16px',
                  borderBottom:
                    i < activity.length - 1
                      ? '1px solid var(--mantine-color-default-border)'
                      : 'none',
                }}
              >
                <Group gap="sm" wrap="nowrap">
                  <Avatar
                    src={item.updaterAvatar}
                    size={28}
                    radius="xl"
                    color="blue"
                  >
                    {(item.updaterName ?? item.updaterEmail ?? '?')[0].toUpperCase()}
                  </Avatar>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" fw={500} truncate>
                      {item.title || 'Untitled page'}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {item.updaterName ?? item.updaterEmail ?? 'Unknown'} ·{' '}
                      {new Date(item.updatedAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </div>
                </Group>
              </div>
            ))}
          </Stack>
        )}
      </Card>
    </Stack>
  );
}
