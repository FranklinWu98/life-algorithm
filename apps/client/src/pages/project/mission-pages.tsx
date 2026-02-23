import {
  ActionIcon,
  Badge,
  Button,
  Chip,
  Divider,
  Group,
  Loader,
  Menu,
  Select,
  Table,
  Text,
  TextInput,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  IconArrowsSort,
  IconDots,
  IconExternalLink,
  IconPlus,
  IconSearch,
  IconSortAscending,
  IconSortDescending,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import {
  useGetMissionQuery,
  useGetMissionPagesQuery,
  projectKeys,
} from '@/features/project/queries/project-query';
import { useGetSpaceBySlugQuery } from '@/features/space/queries/space-query';
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  IMPORTANCE_LABELS,
  IMPORTANCE_COLORS,
  MISSION_STATUS_COLORS,
} from '@/features/project/hooks/use-task-filters';
import type { IPage } from '@/features/page/types/page.types';
import type { TaskStatus, ImportantLevel } from '@/features/project/types/project.types';
import { createPage, updatePage, deletePage } from '@/features/page/services/page-service';

type SortKey = 'title' | 'status' | 'importance' | 'timeToDoStart' | 'timeToDoEnd';
type SortDir = 'asc' | 'desc';

const STATUS_OPTIONS = Object.entries(TASK_STATUS_LABELS).map(([v, label]) => ({ value: v, label }));
const IMPORTANCE_OPTIONS = Object.entries(IMPORTANCE_LABELS).map(([v, label]) => ({
  value: String(v),
  label,
}));

function ColorDot({ color }: { color: string }) {
  return (
    <div style={{
      width: 8, height: 8, borderRadius: '50%',
      backgroundColor: `var(--mantine-color-${color}-5)`,
      flexShrink: 0,
    }} />
  );
}

export default function MissionPagesView() {
  const { spaceSlug, missionId } = useParams<{ spaceSlug: string; missionId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: space, isLoading: spaceLoading } = useGetSpaceBySlugQuery(spaceSlug);
  const { data: mission, isLoading: missionLoading } = useGetMissionQuery(missionId ?? '');
  const { data: pages = [], isLoading: pagesLoading } = useGetMissionPagesQuery(
    missionId ?? '',
    space?.id ?? '',
  );

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [importanceFilter, setImportanceFilter] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('title');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: projectKeys.missionPages(missionId ?? '') });

  const createTask = useMutation({
    mutationFn: () =>
      createPage({
        spaceId: space!.id,
        missionId: missionId,
        taskStatus: 'not_started',
        title: '',
      } as Partial<IPage>),
    onSuccess: (page: IPage) => {
      invalidate();
      navigate(`/s/${spaceSlug}/p/${page.slugId}`);
    },
  });

  const updateTask = useMutation({
    mutationFn: (data: Partial<IPage> & { pageId: string }) => updatePage(data as any),
    onSuccess: invalidate,
  });

  const removeFromMission = useMutation({
    mutationFn: (pageId: string) => updatePage({ pageId, missionId: null } as any),
    onSuccess: invalidate,
  });

  const deleteTask = useMutation({
    mutationFn: (pageId: string) => deletePage(pageId),
    onSuccess: invalidate,
  });

  const visiblePages = useMemo(() => {
    let list = [...pages];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => (p.title ?? '').toLowerCase().includes(q));
    }
    if (statusFilter) {
      list = list.filter((p) => p.taskStatus === statusFilter);
    }
    if (importanceFilter !== null) {
      list = list.filter((p) => String(p.importantLevel ?? 0) === importanceFilter);
    }

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'title':
          cmp = (a.title ?? '').localeCompare(b.title ?? '');
          break;
        case 'status':
          cmp = (a.taskStatus ?? '').localeCompare(b.taskStatus ?? '');
          break;
        case 'importance':
          cmp = (a.importantLevel ?? 0) - (b.importantLevel ?? 0);
          break;
        case 'timeToDoStart':
          cmp = (a.timeToDoStart ?? '').localeCompare(b.timeToDoStart ?? '');
          break;
        case 'timeToDoEnd':
          cmp = (a.timeToDoEnd ?? '').localeCompare(b.timeToDoEnd ?? '');
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [pages, search, statusFilter, importanceFilter, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <IconArrowsSort size={12} opacity={0.4} />;
    return sortDir === 'asc' ? <IconSortAscending size={12} /> : <IconSortDescending size={12} />;
  };

  if (missionLoading || spaceLoading || !mission) {
    return (
      <Group justify="center" mt="xl">
        <Loader size="sm" />
      </Group>
    );
  }

  const hasFilters = !!search || !!statusFilter || importanceFilter !== null;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200 }}>
      {/* Mission header */}
      <Group mb="md" align="center" justify="space-between">
        <Group align="center">
          <Text fw={600} size="xl">{mission.name}</Text>
          <Badge color={MISSION_STATUS_COLORS[mission.status] ?? 'gray'} variant="light">
            {mission.status}
          </Badge>
        </Group>
        <Button
          size="xs"
          leftSection={<IconPlus size={14} />}
          onClick={() => createTask.mutate()}
          loading={createTask.isPending}
          disabled={!space}
        >
          New task
        </Button>
      </Group>

      {mission.description && (
        <Text size="sm" c="dimmed" mb="md">{mission.description}</Text>
      )}

      {/* Filter bar */}
      <Group mb="sm" gap="xs" wrap="wrap" align="center">
        <TextInput
          size="xs"
          placeholder="Search tasks…"
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
        <Divider orientation="vertical" />
        {Object.entries(TASK_STATUS_LABELS).map(([v, label]) => (
          <Chip
            key={v}
            size="xs"
            checked={statusFilter === v}
            onChange={() => setStatusFilter(statusFilter === v ? null : v)}
            color={TASK_STATUS_COLORS[v]}
          >
            {label}
          </Chip>
        ))}
        <Divider orientation="vertical" />
        <Select
          size="xs"
          placeholder="Any priority"
          value={importanceFilter}
          onChange={setImportanceFilter}
          data={IMPORTANCE_OPTIONS}
          clearable
          w={130}
        />
        {hasFilters && (
          <Tooltip label="Clear filters">
            <ActionIcon
              size="xs"
              variant="subtle"
              color="gray"
              onClick={() => { setSearch(''); setStatusFilter(null); setImportanceFilter(null); }}
            >
              <IconX size={12} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

      {/* Task table */}
      {pagesLoading ? (
        <Group justify="center" mt="xl">
          <Loader size="sm" />
        </Group>
      ) : visiblePages.length === 0 ? (
        <Text c="dimmed" size="sm" mt="lg">
          {pages.length === 0
            ? 'No tasks in this mission yet. Click "New task" or open a page and assign it to this mission.'
            : 'No tasks match the current filters.'}
        </Text>
      ) : (
        <Table striped highlightOnHover style={{ tableLayout: 'fixed' }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: '28%' }}>
                <UnstyledButton onClick={() => handleSort('title')}>
                  <Group gap={4} wrap="nowrap">
                    <Text size="xs">Title</Text><SortIcon col="title" />
                  </Group>
                </UnstyledButton>
              </Table.Th>
              <Table.Th style={{ width: '13%' }}>
                <UnstyledButton onClick={() => handleSort('status')}>
                  <Group gap={4} wrap="nowrap">
                    <Text size="xs">Status</Text><SortIcon col="status" />
                  </Group>
                </UnstyledButton>
              </Table.Th>
              <Table.Th style={{ width: '12%' }}>
                <UnstyledButton onClick={() => handleSort('importance')}>
                  <Group gap={4} wrap="nowrap">
                    <Text size="xs">Priority</Text><SortIcon col="importance" />
                  </Group>
                </UnstyledButton>
              </Table.Th>
              <Table.Th style={{ width: '18%' }}>
                <UnstyledButton onClick={() => handleSort('timeToDoStart')}>
                  <Group gap={4} wrap="nowrap">
                    <Text size="xs">Start</Text><SortIcon col="timeToDoStart" />
                  </Group>
                </UnstyledButton>
              </Table.Th>
              <Table.Th style={{ width: '18%' }}>
                <UnstyledButton onClick={() => handleSort('timeToDoEnd')}>
                  <Group gap={4} wrap="nowrap">
                    <Text size="xs">End</Text><SortIcon col="timeToDoEnd" />
                  </Group>
                </UnstyledButton>
              </Table.Th>
              <Table.Th style={{ width: '11%' }} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {visiblePages.map((page: IPage) => (
              <TaskRow
                key={page.id}
                page={page}
                spaceSlug={spaceSlug!}
                onUpdate={(data) => updateTask.mutate({ pageId: page.id, ...data } as any)}
                onRemove={() => removeFromMission.mutate(page.id)}
                onDelete={() => deleteTask.mutate(page.id)}
              />
            ))}
          </Table.Tbody>
        </Table>
      )}
    </div>
  );
}

// ── Individual task row with inline editing ───────────────────────────────────

interface TaskRowProps {
  page: IPage;
  spaceSlug: string;
  onUpdate: (data: Partial<IPage>) => void;
  onRemove: () => void;
  onDelete: () => void;
}

function TaskRow({ page, spaceSlug, onUpdate, onRemove, onDelete }: TaskRowProps) {
  const statusColor = TASK_STATUS_COLORS[page.taskStatus ?? 'not_started'] ?? 'gray';
  const priorityColor = IMPORTANCE_COLORS[page.importantLevel ?? 0] ?? 'gray';

  return (
    <Table.Tr>
      {/* Title */}
      <Table.Td>
        <UnstyledButton
          component={Link}
          to={`/s/${spaceSlug}/p/${page.slugId}`}
          style={{ fontWeight: 500, color: 'inherit', fontSize: 'var(--mantine-font-size-sm)' }}
        >
          {page.icon ? `${page.icon} ` : ''}{page.title || 'Untitled'}
        </UnstyledButton>
      </Table.Td>

      {/* Status */}
      <Table.Td>
        <Select
          size="xs"
          value={page.taskStatus ?? 'not_started'}
          onChange={(val) => { if (val) onUpdate({ taskStatus: val as TaskStatus }); }}
          data={STATUS_OPTIONS}
          variant="filled"
          w={120}
          leftSection={<ColorDot color={statusColor} />}
          renderOption={({ option }) => (
            <Badge size="xs" color={TASK_STATUS_COLORS[option.value] ?? 'gray'} variant="light">
              {option.label}
            </Badge>
          )}
        />
      </Table.Td>

      {/* Priority */}
      <Table.Td>
        <Select
          size="xs"
          value={String(page.importantLevel ?? 0)}
          onChange={(val) => {
            if (val !== null) onUpdate({ importantLevel: Number(val) as ImportantLevel });
          }}
          data={IMPORTANCE_OPTIONS}
          variant="filled"
          w={100}
          leftSection={<ColorDot color={priorityColor} />}
          renderOption={({ option }) => (
            <Badge size="xs" color={IMPORTANCE_COLORS[Number(option.value)] ?? 'gray'} variant="dot">
              {option.label}
            </Badge>
          )}
        />
      </Table.Td>

      {/* Start date+time */}
      <Table.Td>
        <DateTimePicker
          size="xs"
          value={page.timeToDoStart ? new Date(page.timeToDoStart) : null}
          onChange={(v: any) => onUpdate({ timeToDoStart: v ? new Date(v).toISOString() : null })}
          placeholder="—"
          clearable
          variant="unstyled"
          valueFormat="MMM D HH:mm"
          popoverProps={{ withinPortal: true }}
          style={{ minWidth: 140 }}
        />
      </Table.Td>

      {/* End date+time */}
      <Table.Td>
        <DateTimePicker
          size="xs"
          value={page.timeToDoEnd ? new Date(page.timeToDoEnd) : null}
          onChange={(v: any) => onUpdate({ timeToDoEnd: v ? new Date(v).toISOString() : null })}
          placeholder="—"
          clearable
          variant="unstyled"
          valueFormat="MMM D HH:mm"
          popoverProps={{ withinPortal: true }}
          style={{ minWidth: 140 }}
        />
      </Table.Td>

      {/* Row actions */}
      <Table.Td>
        <Group gap={4} justify="flex-end">
          <Tooltip label="Open page" withArrow>
            <ActionIcon
              variant="subtle"
              size="xs"
              component={Link}
              to={`/s/${spaceSlug}/p/${page.slugId}`}
            >
              <IconExternalLink size={14} />
            </ActionIcon>
          </Tooltip>
          <Menu shadow="md" width={180} withArrow position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="subtle" size="xs">
                <IconDots size={14} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconX size={14} />} onClick={onRemove}>
                Remove from mission
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={onDelete}>
                Delete page
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}
