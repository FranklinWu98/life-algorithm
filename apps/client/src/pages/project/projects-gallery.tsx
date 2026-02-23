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
  Text,
  TextInput,
} from '@mantine/core';
import { Link, useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  IconChevronRight,
  IconSearch,
  IconSortAscending,
  IconTarget,
  IconX,
} from '@tabler/icons-react';
import {
  useGetDomainsQuery,
  useGetMissionsQuery,
} from '@/features/project/queries/project-query';
import { useGetSpaceBySlugQuery } from '@/features/space/queries/space-query';
import { MISSION_STATUS_COLORS } from '@/features/project/hooks/use-task-filters';
import type { IDomain, MissionStatus } from '@/features/project/types/project.types';

type GallerySortKey = 'default' | 'name-asc' | 'name-desc';
type MissionStatusFilter = MissionStatus | null;

// ── Domain card ───────────────────────────────────────────────────────────────

interface DomainCardProps {
  domain: IDomain;
  spaceSlug: string;
  missionStatusFilter: MissionStatusFilter;
}

function DomainCard({ domain, spaceSlug, missionStatusFilter }: DomainCardProps) {
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
          style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {domain.name}
        </Text>
        <ActionIcon
          size="sm"
          variant="subtle"
          component={Link}
          to={`/s/${spaceSlug}/mission`}
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
          {filteredMissions.slice(0, 7).map((m) => (
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
          ))}
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

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<GallerySortKey>('default');
  const [missionStatusFilter, setMissionStatusFilter] = useState<MissionStatusFilter>(null);

  const filtered = useMemo(() => {
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
    <div style={{ padding: '24px 32px', maxWidth: 1300 }}>
      {/* Header */}
      <Group mb="lg" justify="space-between" align="center">
        <Text fw={700} size="xl">Projects</Text>
        <Group gap="xs">
          <Select
            size="xs"
            placeholder="All mission statuses"
            value={missionStatusFilter}
            onChange={(v) => setMissionStatusFilter(v as MissionStatusFilter)}
            data={MISSION_STATUS_OPTIONS}
            clearable
            w={170}
          />
          <Menu shadow="md" width={180}>
            <Menu.Target>
              <Button size="xs" variant="default" leftSection={<IconSortAscending size={14} />}>
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
      </Group>

      {/* Search */}
      <Group mb="lg">
        <TextInput
          size="sm"
          placeholder="Search domains…"
          leftSection={<IconSearch size={14} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          w={240}
          rightSection={
            search ? (
              <ActionIcon size="xs" variant="subtle" onClick={() => setSearch('')}>
                <IconX size={12} />
              </ActionIcon>
            ) : null
          }
        />
      </Group>

      {filtered.length === 0 ? (
        <Text c="dimmed" size="sm">
          {domains.length === 0
            ? 'No domains yet. Create one from the sidebar.'
            : 'No domains match your search.'}
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {filtered.map((domain) => (
            <DomainCard
              key={domain.id}
              domain={domain}
              spaceSlug={spaceSlug!}
              missionStatusFilter={missionStatusFilter}
            />
          ))}
        </SimpleGrid>
      )}
    </div>
  );
}
