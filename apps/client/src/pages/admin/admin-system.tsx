import {
  Avatar,
  Badge,
  Card,
  Code,
  Grid,
  Group,
  Loader,
  ScrollArea,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useAdminHealthQuery, useAdminSystemQuery } from '@/features/admin/queries/admin-query';

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function AdminSystem() {
  const { data: health } = useAdminHealthQuery();
  const { data: system, isLoading } = useAdminSystemQuery();

  return (
    <Stack gap="lg">
      <Title order={3}>System</Title>

      {/* Health */}
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Card withBorder padding="md" radius="md">
            <Text size="sm" fw={600} mb="md">Server Runtime</Text>
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
                  <Code>{health.nodeVersion}</Code>
                </Group>
              </Stack>
            ) : (
              <Loader size="xs" />
            )}
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Card withBorder padding="md" radius="md">
            <Text size="sm" fw={600} mb="md">Memory Usage</Text>
            {health ? (
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Heap used</Text>
                  <Text size="sm">{health.memory.heapUsedMb} MB</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Heap total</Text>
                  <Text size="sm">{health.memory.heapTotalMb} MB</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">RSS</Text>
                  <Text size="sm">{health.memory.rssMb} MB</Text>
                </Group>
                {/* Memory bar */}
                <div
                  style={{
                    marginTop: 4,
                    height: 6,
                    borderRadius: 4,
                    background: 'var(--mantine-color-gray-2)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.round((health.memory.heapUsedMb / health.memory.heapTotalMb) * 100))}%`,
                      background: health.memory.heapUsedMb / health.memory.heapTotalMb > 0.8
                        ? 'var(--mantine-color-red-5)'
                        : 'var(--mantine-color-blue-5)',
                      borderRadius: 4,
                    }}
                  />
                </div>
                <Text size="xs" c="dimmed" ta="right">
                  {Math.round((health.memory.heapUsedMb / health.memory.heapTotalMb) * 100)}% used
                </Text>
              </Stack>
            ) : (
              <Loader size="xs" />
            )}
          </Card>
        </Grid.Col>
      </Grid>

      {/* Environment Config */}
      <Title order={4} mt="sm">Configuration</Title>
      <Card withBorder padding={0} radius="md">
        {isLoading ? (
          <Group justify="center" py="xl">
            <Loader size="sm" />
          </Group>
        ) : system ? (
          <ScrollArea>
            <Table striped withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: '40%' }}>Key</Table.Th>
                  <Table.Th>Value</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {Object.entries(system.env).map(([key, value]) => (
                  <Table.Tr key={key}>
                    <Table.Td>
                      <Code>{key}</Code>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c={value ? undefined : 'dimmed'}>
                        {value || '(not set)'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        ) : (
          <Text size="sm" c="dimmed" ta="center" py="xl">
            No configuration data
          </Text>
        )}
      </Card>

      {/* Recent Logins */}
      <Title order={4} mt="sm">Recent Logins</Title>
      <Card withBorder padding={0} radius="md">
        {isLoading ? (
          <Group justify="center" py="xl">
            <Loader size="sm" />
          </Group>
        ) : system && system.recentLogins.length > 0 ? (
          <Stack gap={0}>
            {system.recentLogins.map((entry, i) => (
              <div
                key={entry.id}
                style={{
                  padding: '10px 16px',
                  borderBottom:
                    i < system.recentLogins.length - 1
                      ? '1px solid var(--mantine-color-default-border)'
                      : 'none',
                }}
              >
                <Group gap="sm" wrap="nowrap">
                  <Avatar
                    src={entry.avatarUrl}
                    size={28}
                    radius="xl"
                    color="blue"
                  >
                    {(entry.name ?? entry.email)[0].toUpperCase()}
                  </Avatar>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" fw={500}>
                      {entry.name ?? entry.email}
                    </Text>
                    {entry.name && (
                      <Text size="xs" c="dimmed">{entry.email}</Text>
                    )}
                  </div>
                  <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                    {new Date(entry.lastLoginAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </Group>
              </div>
            ))}
          </Stack>
        ) : (
          <Text size="sm" c="dimmed" ta="center" py="xl">
            No login records
          </Text>
        )}
      </Card>
    </Stack>
  );
}
