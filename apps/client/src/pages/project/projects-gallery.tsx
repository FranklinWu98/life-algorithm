import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Menu,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { Link, useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  IconCheckbox,
  IconChevronRight,
  IconClock,
  IconFileDescription,
  IconLayoutList,
  IconSearch,
  IconSortAscending,
  IconTarget,
  IconX,
} from '@tabler/icons-react';
import {
  useGetDomainsQuery,
  useGetMissionsQuery,
  useGetSpaceTasksQuery,
} from '@/features/project/queries/project-query';
import { useGetSpaceBySlugQuery } from '@/features/space/queries/space-query';
import { MISSION_STATUS_COLORS } from '@/features/project/hooks/use-task-filters';
import type { IDomain, MissionStatus, TaskStatus } from '@/features/project/types/project.types';
import { useRecentChangesQuery } from '@/features/page/queries/page-query';
import { buildPageUrl } from '@/features/page/page.utils';
import { formattedDate } from '@/lib/time';
import type { IPage } from '@/features/page/types/page.types';

type GallerySortKey = 'default' | 'name-asc' | 'name-desc';
type MissionStatusFilter = MissionStatus | null;

const TASK_STATUS_COLORS: Record<string, string> = {
  not_started: 'gray',
  in_progress: 'blue',
  completed: 'green',
  cancelled: 'red',
};

// ── Domain card ───────────────────────────────────────────────────────────────

interface DomainCardProps {
  domain: IDomain;
  spaceSlug: string;
  missionStatusFilter: MissionStatusFilter;
  taskCountMap: Map<string, number>;
}

function DomainCard({ domain, spaceSlug, missionStatusFilter, taskCountMap }: DomainCardProps) {
  const { data: missions = [] } = useGetMissionsQuery(domain.id);
  const dotColor = domain.color ?? '#868e96';

  const filteredMissions = useMemo(() => {
    if (!missionStatusFilter) return missions;
    return missions.filter((m) => m.status === missionStatusFilter);
  }, [missions, missionStatusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of missions) {
      counts[m.status] = (counts[m.status] ?? 0) + 1;
    }
    return counts;
  }, [missions]);

  return (
    <Card withBorder radius="md" padding="md" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Domain header */}
      <Group gap={8} align="center" mb={2}>
        <div style={{
          width: 12, height: 12, borderRadius: '50%',
          backgroundColor: dotColor, flexShrink: 0,
        }} />
        <Text
          fw={700}
          size="sm"
          component={Link}
          to={`/s/${spaceSlug}/domain/${domain.id}`}
          style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'none', color: 'inherit' }}
        >
          {domain.name}
        </Text>
        <ActionIcon
          size="sm"
          variant="subtle"
          component={Link}
          to={`/s/${spaceSlug}/domain/${domain.id}`}
          style={{ flexShrink: 0 }}
        >
          <IconChevronRight size={14} />
        </ActionIcon>
      </Group>

      {/* Description */}
      {domain.description && (
        <Text size="xs" c="dimmed" lineClamp={2}>{domain.description}</Text>
      )}

      {/* Status summary badges */}
      {Object.keys(statusCounts).length > 0 && (
        <Group gap={4} wrap="wrap">
          {Object.entries(statusCounts).map(([status, count]) => (
            <Badge
              key={status}
              size="xs"
              variant="light"
              color={MISSION_STATUS_COLORS[status] ?? 'gray'}
            >
              {count} {status}
            </Badge>
          ))}
        </Group>
      )}

      {/* Missions list */}
      {missions.length === 0 ? (
        <Text size="xs" c="dimmed">No missions yet</Text>
      ) : (
        <Stack gap={3} mt={2}>
          {filteredMissions.slice(0, 7).map((m) => {
            const taskCount = taskCountMap.get(m.id) ?? 0;
            return (
              <Group key={m.id} justify="space-between" gap={4} wrap="nowrap">
                <Group gap={4} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                  <IconTarget
                    size={11}
                    color={`var(--mantine-color-${MISSION_STATUS_COLORS[m.status] ?? 'gray'}-5)`}
                    style={{ flexShrink: 0 }}
                  />
                  <Text
                    size="xs"
                    component={Link}
                    to={`/s/${spaceSlug}/mission/${m.id}`}
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    {m.name}
                  </Text>
                  {taskCount > 0 && (
                    <Text size="xs" c="dimmed" fw={500} style={{ flexShrink: 0 }}>
                      {taskCount}
                    </Text>
                  )}
                </Group>
                <Badge
                  size="xs"
                  variant="dot"
                  color={MISSION_STATUS_COLORS[m.status] ?? 'gray'}
                  style={{ flexShrink: 0 }}
                >
                  {m.status}
                </Badge>
              </Group>
            );
          })}
          {filteredMissions.length > 7 && (
            <Text size="xs" c="dimmed">+{filteredMissions.length - 7} more</Text>
          )}
          {filteredMissions.length === 0 && missionStatusFilter && (
            <Text size="xs" c="dimmed">No {missionStatusFilter} missions</Text>
          )}
        </Stack>
      )}
    </Card>
  );
}

// ── All Tasks tab ─────────────────────────────────────────────────────────────

function AllTasksView({ tasks, spaceSlug }: { tasks: IPage[]; spaceSlug: string }) {
  if (tasks.length === 0) {
    return <Text c="dimmed" size="sm">No tasks yet.</Text>;
  }

  return (
    <Table.ScrollContainer minWidth={400}>
      <Table highlightOnHover verticalSpacing="xs">
        <Table.Tbody>
          {tasks.map((task) => (
            <Table.Tr key={task.id}>
              <Table.Td>
                <UnstyledButton
                  component={Link}
                  to={buildPageUrl(task.space?.slug ?? spaceSlug, task.slugId, task.title)}
                >
                  <Group wrap="nowrap" gap="xs">
                    {task.icon ? (
                      <span style={{ fontSize: 16 }}>{task.icon}</span>
                    ) : (
                      <IconFileDescription size={16} color="var(--mantine-color-dimmed)" />
                    )}
                    <Text size="sm" fw={500} lineClamp={1}>
                      {task.title || 'Untitled'}
                    </Text>
                  </Group>
                </UnstyledButton>
              </Table.Td>
              <Table.Td>
                {task.taskStatus && (
                  <Badge
                    size="xs"
                    variant="light"
                    color={TASK_STATUS_COLORS[task.taskStatus] ?? 'gray'}
                  >
                    {task.taskStatus.replace('_', ' ')}
                  </Badge>
                )}
              </Table.Td>
              <Table.Td>
                <Text c="dimmed" size="xs" style={{ whiteSpace: 'nowrap' }}>
                  {formattedDate(task.updatedAt)}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

// ── Recently Updated tab ──────────────────────────────────────────────────────

function RecentlyUpdatedView({ spaceId, spaceSlug }: { spaceId: string; spaceSlug: string }) {
  const { data: pages, isLoading } = useRecentChangesQuery(spaceId);

  if (isLoading) {
    return <Group justify="center" mt="md"><Loader size="sm" /></Group>;
  }

  const items = pages?.items ?? [];
  if (items.length === 0) {
    return <Text c="dimmed" size="sm">No recently updated pages.</Text>;
  }

  return (
    <Table.ScrollContainer minWidth={400}>
      <Table highlightOnHover verticalSpacing="xs">
        <Table.Tbody>
          {items.map((page) => (
            <Table.Tr key={page.id}>
              <Table.Td>
                <UnstyledButton
                  component={Link}
                  to={buildPageUrl(spaceSlug, page.slugId, page.title)}
                >
                  <Group wrap="nowrap" gap="xs">
                    {page.icon ? (
                      <span style={{ fontSize: 16 }}>{page.icon}</span>
                    ) : (
                      <IconFileDescription size={16} color="var(--mantine-color-dimmed)" />
                    )}
                    <Text size="sm" fw={500} lineClamp={1}>
                      {page.title || 'Untitled'}
                    </Text>
                  </Group>
                </UnstyledButton>
              </Table.Td>
              <Table.Td>
                <Text c="dimmed" size="xs" style={{ whiteSpace: 'nowrap' }}>
                  {formattedDate(page.updatedAt)}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

// ── Gallery view ──────────────────────────────────────────────────────────────

const MISSION_STATUS_OPTIONS: { value: MissionStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function ProjectsGalleryView() {
  const { spaceSlug } = useParams<{ spaceSlug: string }>();
  const { data: space, isLoading: spaceLoading } = useGetSpaceBySlugQuery(spaceSlug);
  const { data: domains = [], isLoading: domainsLoading } = useGetDomainsQuery(space?.id ?? '');
  const { data: spaceTasks = [] } = useGetSpaceTasksQuery(space?.id ?? '');

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<GallerySortKey>('default');
  const [missionStatusFilter, setMissionStatusFilter] = useState<MissionStatusFilter>(null);

  const taskCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const task of spaceTasks) {
      if (task.missionId) {
        map.set(task.missionId, (map.get(task.missionId) ?? 0) + 1);
      }
    }
    return map;
  }, [spaceTasks]);

  const filteredDomains = useMemo(() => {
    let list = [...domains];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((d) => d.name.toLowerCase().includes(q));
    }
    if (sort === 'name-asc') list = list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'name-desc') list = list.sort((a, b) => b.name.localeCompare(a.name));
    return list;
  }, [domains, search, sort]);

  if (spaceLoading || domainsLoading) {
    return <Group justify="center" mt="xl"><Loader size="sm" /></Group>;
  }

  return (
    <div style={{ padding: '16px 32px', maxWidth: 1300 }}>
      <Tabs defaultValue="domains" keepMounted={false} styles={{ tab: { paddingInlineStart: 0, paddingInlineEnd: 'var(--mantine-spacing-md)' } }}>
        {/* Tab bar — left aligned */}
        <Tabs.List mb="md" style={{ borderBottom: 'none' }}>
          <Tabs.Tab value="all-tasks" leftSection={<IconCheckbox size={14} />}>
            All Tasks
          </Tabs.Tab>
          <Tabs.Tab value="domains" leftSection={<IconLayoutList size={14} />}>
            Domains
          </Tabs.Tab>
          <Tabs.Tab value="recent" leftSection={<IconClock size={14} />}>
            Recently Updated
          </Tabs.Tab>
        </Tabs.List>

        {/* All Tasks */}
        <Tabs.Panel value="all-tasks">
          <AllTasksView tasks={spaceTasks} spaceSlug={spaceSlug!} />
        </Tabs.Panel>

        {/* Domains */}
        <Tabs.Panel value="domains">
          {/* Domains controls */}
          <Group gap="xs" mb="md" wrap="nowrap">
            <TextInput
              size="xs"
              placeholder="Search domains…"
              leftSection={<IconSearch size={12} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              w={180}
              rightSection={
                search ? (
                  <ActionIcon size="xs" variant="subtle" onClick={() => setSearch('')}>
                    <IconX size={10} />
                  </ActionIcon>
                ) : null
              }
            />
            <Select
              size="xs"
              placeholder="All statuses"
              value={missionStatusFilter}
              onChange={(v) => setMissionStatusFilter(v as MissionStatusFilter)}
              data={MISSION_STATUS_OPTIONS}
              clearable
              w={140}
            />
            <Menu shadow="md" width={180}>
              <Menu.Target>
                <Button size="xs" variant="default" leftSection={<IconSortAscending size={12} />}>
                  Sort
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  fw={sort === 'default' ? 600 : 400}
                  onClick={() => setSort('default')}
                  rightSection={sort === 'default' ? '✓' : undefined}
                >
                  Default
                </Menu.Item>
                <Menu.Item
                  fw={sort === 'name-asc' ? 600 : 400}
                  onClick={() => setSort('name-asc')}
                  rightSection={sort === 'name-asc' ? '✓' : undefined}
                >
                  Name A → Z
                </Menu.Item>
                <Menu.Item
                  fw={sort === 'name-desc' ? 600 : 400}
                  onClick={() => setSort('name-desc')}
                  rightSection={sort === 'name-desc' ? '✓' : undefined}
                >
                  Name Z → A
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>

          {filteredDomains.length === 0 ? (
            <Text c="dimmed" size="sm">
              {domains.length === 0
                ? 'No domains yet. Create one from the sidebar.'
                : 'No domains match your search.'}
            </Text>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {filteredDomains.map((domain) => (
                <DomainCard
                  key={domain.id}
                  domain={domain}
                  spaceSlug={spaceSlug!}
                  missionStatusFilter={missionStatusFilter}
                  taskCountMap={taskCountMap}
                />
              ))}
            </SimpleGrid>
          )}
        </Tabs.Panel>

        {/* Recently Updated */}
        <Tabs.Panel value="recent">
          {space?.id && (
            <RecentlyUpdatedView spaceId={space.id} spaceSlug={spaceSlug!} />
          )}
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
