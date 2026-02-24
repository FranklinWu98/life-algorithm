import {
  ActionIcon,
  Anchor,
  Badge,
  Breadcrumbs,
  Button,
  Chip,
  Divider,
  Group,
  Loader,
  Menu,
  Modal,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  IconArrowsSort,
  IconDots,
  IconEdit,
  IconExternalLink,
  IconPlus,
  IconSearch,
  IconSortAscending,
  IconSortDescending,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import {
  useGetDomainQuery,
  useGetMissionsQuery,
  useCreateMissionMutation,
  useDeleteMissionMutation,
  projectKeys,
} from '@/features/project/queries/project-query';
import { useGetSpaceBySlugQuery } from '@/features/space/queries/space-query';
import { MISSION_STATUS_COLORS } from '@/features/project/hooks/use-task-filters';
import type { IMission, MissionStatus } from '@/features/project/types/project.types';
import { updateMission } from '@/features/project/services/project-service';

type SortKey = 'name' | 'status' | 'startDate' | 'endDate';
type SortDir = 'asc' | 'desc';

const STATUS_OPTIONS: { value: MissionStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_FILTER_LIST: { value: MissionStatus | null; label: string }[] = [
  { value: null, label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Done' },
  { value: 'archived', label: 'Archived' },
  { value: 'cancelled', label: 'Cancelled' },
];

// ── Edit mission modal ────────────────────────────────────────────────────────

interface EditMissionModalProps {
  opened: boolean;
  onClose: () => void;
  mission: IMission;
  domainId: string;
  onSave: (data: Partial<IMission>) => void;
  saving: boolean;
}

function EditMissionModal({ opened, onClose, mission, onSave, saving }: EditMissionModalProps) {
  const [name, setName] = useState(mission.name);
  const [description, setDescription] = useState(mission.description ?? '');
  const [status, setStatus] = useState<MissionStatus>(mission.status);
  const [startDate, setStartDate] = useState<string | null>(mission.startDate ?? null);
  const [endDate, setEndDate] = useState<string | null>(mission.endDate ?? null);

  useEffect(() => {
    if (opened) {
      setName(mission.name);
      setDescription(mission.description ?? '');
      setStatus(mission.status);
      setStartDate(mission.startDate ?? null);
      setEndDate(mission.endDate ?? null);
    }
  }, [opened, mission]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      status,
      startDate: startDate ?? undefined,
      endDate: endDate ?? undefined,
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Edit mission" size="sm">
      <Stack>
        <TextInput
          label="Name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          placeholder="Optional description"
          autosize
          minRows={2}
        />
        <Select
          label="Status"
          value={status}
          onChange={(v) => v && setStatus(v as MissionStatus)}
          data={STATUS_OPTIONS}
        />
        <Group grow>
          <DateInput
            label="Start date"
            value={startDate ? new Date(startDate) : null}
            onChange={(v: string | null) => setStartDate(v ?? null)}
            clearable
            placeholder="Pick date"
          />
          <DateInput
            label="End date"
            value={endDate ? new Date(endDate) : null}
            onChange={(v: string | null) => setEndDate(v ?? null)}
            clearable
            placeholder="Pick date"
          />
        </Group>
        <Group justify="flex-end">
          <UnstyledButton onClick={onClose} style={{ fontSize: 14 }}>Cancel</UnstyledButton>
          <Button size="xs" onClick={handleSubmit} loading={saving}>Save</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

// ── Mission row ───────────────────────────────────────────────────────────────

interface MissionRowProps {
  mission: IMission;
  spaceSlug: string;
  onUpdate: (data: Partial<IMission>) => void;
  onDelete: () => void;
}

function MissionRow({ mission, spaceSlug, onUpdate, onDelete }: MissionRowProps) {
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const qc = useQueryClient();

  const updateMut = useMutation({
    mutationFn: (data: Partial<IMission>) => updateMission(mission.id, data as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.missions(mission.domainId) });
    },
  });

  const handleSave = (data: Partial<IMission>) => {
    updateMut.mutate(data, { onSuccess: closeEdit });
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }) : '—';

  return (
    <>
      <Table.Tr>
        {/* Name */}
        <Table.Td>
          <Anchor
            component={Link}
            to={`/s/${spaceSlug}/mission/${mission.id}`}
            size="sm"
            fw={500}
            c="inherit"
            underline="hover"
            style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
          >
            {mission.name}
          </Anchor>
          {mission.description && (
            <Text size="xs" c="dimmed" lineClamp={1}>{mission.description}</Text>
          )}
        </Table.Td>

        {/* Status — inline editable */}
        <Table.Td>
          <Select
            size="xs"
            value={mission.status}
            onChange={(val) => {
              if (val) onUpdate({ status: val as MissionStatus });
            }}
            data={STATUS_OPTIONS}
            variant="filled"
            w={120}
            leftSection={
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                backgroundColor: `var(--mantine-color-${MISSION_STATUS_COLORS[mission.status] ?? 'gray'}-5)`,
                flexShrink: 0,
              }} />
            }
            renderOption={({ option }) => (
              <Badge size="xs" color={MISSION_STATUS_COLORS[option.value] ?? 'gray'} variant="light">
                {option.label}
              </Badge>
            )}
          />
        </Table.Td>

        {/* Start */}
        <Table.Td>
          <Text size="xs">{formatDate(mission.startDate)}</Text>
        </Table.Td>

        {/* End */}
        <Table.Td>
          <Text size="xs">{formatDate(mission.endDate)}</Text>
        </Table.Td>

        {/* Actions */}
        <Table.Td>
          <Group gap={4} justify="flex-end">
            <Tooltip label="Open mission" withArrow>
              <ActionIcon
                variant="subtle"
                size="xs"
                component={Link}
                to={`/s/${spaceSlug}/mission/${mission.id}`}
              >
                <IconExternalLink size={14} />
              </ActionIcon>
            </Tooltip>
            <Menu shadow="md" width={160} withArrow position="bottom-end">
              <Menu.Target>
                <ActionIcon variant="subtle" size="xs">
                  <IconDots size={14} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconEdit size={14} />} onClick={openEdit}>
                  Edit mission
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={onDelete}>
                  Delete mission
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Table.Td>
      </Table.Tr>

      <EditMissionModal
        opened={editOpened}
        onClose={closeEdit}
        mission={mission}
        domainId={mission.domainId}
        onSave={handleSave}
        saving={updateMut.isPending}
      />
    </>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function DomainMissionsView() {
  const { spaceSlug, domainId } = useParams<{ spaceSlug: string; domainId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: space, isLoading: spaceLoading } = useGetSpaceBySlugQuery(spaceSlug);
  const { data: domain, isLoading: domainLoading } = useGetDomainQuery(domainId ?? '', space?.id ?? '');
  const { data: missions = [], isLoading: missionsLoading } = useGetMissionsQuery(domainId ?? '');

  const createMission = useCreateMissionMutation();
  const deleteMissionMut = useDeleteMissionMutation();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<MissionStatus | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [newMissionName, setNewMissionName] = useState('');

  const invalidate = () => qc.invalidateQueries({ queryKey: projectKeys.missions(domainId ?? '') });

  const updateMut = useMutation({
    mutationFn: ({ missionId, data }: { missionId: string; data: Partial<IMission> }) =>
      updateMission(missionId, data as any),
    onSuccess: invalidate,
  });

  const visibleMissions = useMemo(() => {
    let list = [...missions];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m) => m.name.toLowerCase().includes(q) || (m.description ?? '').toLowerCase().includes(q));
    }
    if (statusFilter) {
      list = list.filter((m) => m.status === statusFilter);
    }
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
        case 'startDate': cmp = (a.startDate ?? '').localeCompare(b.startDate ?? ''); break;
        case 'endDate': cmp = (a.endDate ?? '').localeCompare(b.endDate ?? ''); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [missions, search, statusFilter, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <IconArrowsSort size={12} opacity={0.4} />;
    return sortDir === 'asc' ? <IconSortAscending size={12} /> : <IconSortDescending size={12} />;
  };

  const handleCreateMission = () => {
    if (!newMissionName.trim() || !space) return;
    createMission.mutate(
      { name: newMissionName.trim(), domainId: domainId!, spaceId: space.id },
      {
        onSuccess: (m) => {
          setNewMissionName('');
          closeAdd();
          navigate(`/s/${spaceSlug}/mission/${m.id}`);
        },
      },
    );
  };

  const hasFilters = !!search || statusFilter !== null;

  if (spaceLoading || domainLoading) {
    return <Group justify="center" mt="xl"><Loader size="sm" /></Group>;
  }

  if (!domain) {
    return <Text c="dimmed" p="xl">Domain not found.</Text>;
  }

  const dotColor = domain.color ?? '#868e96';

  return (
    <>
      {/* Fixed breadcrumb header — matches page view style */}
      <div style={{
        height: 45,
        backgroundColor: 'var(--mantine-color-body)',
        paddingLeft: 'var(--mantine-spacing-md)',
        paddingRight: 'var(--mantine-spacing-md)',
        position: 'fixed',
        zIndex: 99,
        top: 'var(--app-shell-header-offset, 0rem)',
        insetInlineStart: 'var(--app-shell-navbar-offset, 0rem)',
        insetInlineEnd: 'var(--app-shell-aside-offset, 0rem)',
        display: 'flex',
        alignItems: 'center',
      }}>
        <Breadcrumbs separator="›" separatorMargin={4}
          styles={{ separator: { color: 'var(--mantine-color-dimmed)', fontSize: 13 } }}>
          <Anchor component={Link} to={`/s/${spaceSlug}/projects`} size="sm" c="dimmed" underline="hover">
            Projects
          </Anchor>
          <Text size="sm" fw={500}>{domain.name}</Text>
        </Breadcrumbs>
      </div>

    <div style={{ padding: '29px 32px 24px', maxWidth: 1100 }}>
      {/* Domain header */}
      <Group mb="xs" align="center" justify="space-between">
        <Group align="center" gap={8}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0 }} />
          <Text fw={700} size="xl">{domain.name}</Text>
        </Group>
        <Button size="xs" leftSection={<IconPlus size={14} />} onClick={openAdd}>
          New mission
        </Button>
      </Group>

      {domain.description && (
        <Text size="sm" c="dimmed" mb="md">{domain.description}</Text>
      )}

      {/* Filter bar */}
      <Group mb="sm" gap="xs" wrap="wrap" align="center">
        <TextInput
          size="xs"
          placeholder="Search missions…"
          leftSection={<IconSearch size={12} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          w={200}
          rightSection={
            search ? (
              <ActionIcon size="xs" variant="subtle" onClick={() => setSearch('')}><IconX size={10} /></ActionIcon>
            ) : null
          }
        />
        <Divider orientation="vertical" />
        {STATUS_FILTER_LIST.map(({ value, label }) => (
          <Chip
            key={String(value)}
            size="xs"
            checked={statusFilter === value}
            onChange={() => setStatusFilter(statusFilter === value ? null : value)}
            color={value ? (MISSION_STATUS_COLORS[value] ?? 'gray') : 'gray'}
          >
            {label}
          </Chip>
        ))}
        {hasFilters && (
          <Tooltip label="Clear filters">
            <ActionIcon size="xs" variant="subtle" color="gray"
              onClick={() => { setSearch(''); setStatusFilter(null); }}>
              <IconX size={12} />
            </ActionIcon>
          </Tooltip>
        )}

        {/* Sort menu */}
        <Menu shadow="md" width={180} withinPortal>
          <Menu.Target>
            <Tooltip label="Sort">
              <ActionIcon size="sm" variant="subtle">
                <IconSortAscending size={14} />
              </ActionIcon>
            </Tooltip>
          </Menu.Target>
          <Menu.Dropdown>
            {(['name', 'status', 'startDate', 'endDate'] as SortKey[]).map((key) => (
              <Menu.Item
                key={key}
                fw={sortKey === key ? 600 : 400}
                onClick={() => handleSort(key)}
                rightSection={sortKey === key ? (sortDir === 'asc' ? '↑' : '↓') : undefined}
              >
                {key === 'name' ? 'Name' : key === 'status' ? 'Status' : key === 'startDate' ? 'Start date' : 'End date'}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      </Group>

      {/* Missions table */}
      {missionsLoading ? (
        <Group justify="center" mt="xl"><Loader size="sm" /></Group>
      ) : visibleMissions.length === 0 ? (
        <Text c="dimmed" size="sm" mt="lg">
          {missions.length === 0
            ? 'No missions yet. Click "New mission" to add one.'
            : 'No missions match the current filters.'}
        </Text>
      ) : (
        <Table striped highlightOnHover style={{ tableLayout: 'fixed' }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: '35%' }}>
                <UnstyledButton onClick={() => handleSort('name')}>
                  <Group gap={4} wrap="nowrap"><Text size="xs">Name</Text><SortIcon col="name" /></Group>
                </UnstyledButton>
              </Table.Th>
              <Table.Th style={{ width: '18%' }}>
                <UnstyledButton onClick={() => handleSort('status')}>
                  <Group gap={4} wrap="nowrap"><Text size="xs">Status</Text><SortIcon col="status" /></Group>
                </UnstyledButton>
              </Table.Th>
              <Table.Th style={{ width: '18%' }}>
                <UnstyledButton onClick={() => handleSort('startDate')}>
                  <Group gap={4} wrap="nowrap"><Text size="xs">Start</Text><SortIcon col="startDate" /></Group>
                </UnstyledButton>
              </Table.Th>
              <Table.Th style={{ width: '18%' }}>
                <UnstyledButton onClick={() => handleSort('endDate')}>
                  <Group gap={4} wrap="nowrap"><Text size="xs">End</Text><SortIcon col="endDate" /></Group>
                </UnstyledButton>
              </Table.Th>
              <Table.Th style={{ width: '11%' }} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {visibleMissions.map((mission) => (
              <MissionRow
                key={mission.id}
                mission={mission}
                spaceSlug={spaceSlug!}
                onUpdate={(data) => updateMut.mutate({ missionId: mission.id, data })}
                onDelete={() => deleteMissionMut.mutate({ missionId: mission.id, domainId: domainId!, spaceId: space!.id })}
              />
            ))}
          </Table.Tbody>
        </Table>
      )}

      {/* Add mission modal */}
      <Modal opened={addOpened} onClose={closeAdd} title="New mission" size="sm">
        <Stack>
          <TextInput
            label="Name"
            placeholder="e.g. Launch v2, Q1 Planning"
            value={newMissionName}
            onChange={(e) => setNewMissionName(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateMission()}
            autoFocus
          />
          <Group justify="flex-end">
            <UnstyledButton onClick={closeAdd} style={{ fontSize: 14 }}>Cancel</UnstyledButton>
            <Button size="xs" onClick={handleCreateMission} loading={createMission.isPending}>
              Create
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
    </>
  );
}
