import {
  ActionIcon,
  ColorInput,
  Group,
  Menu,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import {
  IconChevronDown,
  IconChevronRight,
  IconDots,
  IconEdit,
  IconLayoutList,
  IconList,
  IconPlus,
  IconSortAscending,
  IconTarget,
  IconTrash,
} from '@tabler/icons-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { useDisclosure } from '@mantine/hooks';
import { useState, useEffect, useMemo } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import classes from './project-sidebar.module.css';
import {
  useCreateDomainMutation,
  useCreateMissionMutation,
  useDeleteDomainMutation,
  useDeleteMissionMutation,
  useGetDomainsQuery,
  useGetMissionsQuery,
  useUpdateDomainMutation,
  useUpdateMissionMutation,
} from '@/features/project/queries/project-query';
import { IDomain, IMission, MissionStatus } from '@/features/project/types/project.types';
import { MISSION_STATUS_COLORS } from '@/features/project/hooks/use-task-filters';
import {
  missionStatusFilterAtom,
  domainSortAtom,
  missionSortAtom,
  type DomainSortKey,
  type MissionSortKey,
} from '@/features/project/atoms/project-prefs-atom';

// ── Edit domain modal ─────────────────────────────────────────────────────────

interface EditDomainModalProps {
  opened: boolean;
  onClose: () => void;
  domain: IDomain;
  spaceId: string;
}

function EditDomainModal({ opened, onClose, domain, spaceId }: EditDomainModalProps) {
  const [name, setName] = useState(domain.name);
  const [description, setDescription] = useState(domain.description ?? '');
  const [color, setColor] = useState(domain.color ?? '#228be6');
  const update = useUpdateDomainMutation();

  useEffect(() => {
    if (opened) {
      setName(domain.name);
      setDescription(domain.description ?? '');
      setColor(domain.color ?? '#228be6');
    }
  }, [opened, domain]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    update.mutate(
      {
        domainId: domain.id,
        spaceId,
        data: { name: name.trim(), description: description.trim() || undefined, color },
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Edit domain" size="sm">
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
        <ColorInput
          label="Color"
          value={color}
          onChange={setColor}
          format="hex"
        />
        <Group justify="flex-end">
          <UnstyledButton onClick={onClose} style={{ fontSize: 14 }}>
            Cancel
          </UnstyledButton>
          <ActionIcon
            onClick={handleSubmit}
            loading={update.isPending}
            variant="filled"
            size="md"
          >
            <IconEdit size={16} />
          </ActionIcon>
        </Group>
      </Stack>
    </Modal>
  );
}

// ── Edit mission modal ────────────────────────────────────────────────────────

interface EditMissionModalProps {
  opened: boolean;
  onClose: () => void;
  mission: IMission;
  domainId: string;
}

function EditMissionModal({ opened, onClose, mission, domainId }: EditMissionModalProps) {
  const [name, setName] = useState(mission.name);
  const [description, setDescription] = useState(mission.description ?? '');
  const [status, setStatus] = useState<MissionStatus>(mission.status);
  const [startDate, setStartDate] = useState<string | null>(
    mission.startDate ?? null,
  );
  const [endDate, setEndDate] = useState<string | null>(
    mission.endDate ?? null,
  );
  const update = useUpdateMissionMutation();

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
    update.mutate(
      {
        missionId: mission.id,
        domainId,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          status,
          startDate: startDate ?? undefined,
          endDate: endDate ?? undefined,
        },
      },
      { onSuccess: onClose },
    );
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
          data={[
            { value: 'active', label: 'Active' },
            { value: 'completed', label: 'Completed' },
            { value: 'archived', label: 'Archived' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
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
          <UnstyledButton onClick={onClose} style={{ fontSize: 14 }}>
            Cancel
          </UnstyledButton>
          <ActionIcon
            onClick={handleSubmit}
            loading={update.isPending}
            variant="filled"
            size="md"
          >
            <IconEdit size={16} />
          </ActionIcon>
        </Group>
      </Stack>
    </Modal>
  );
}

// ── Domain tree item ──────────────────────────────────────────────────────────

interface DomainItemProps {
  domain: IDomain;
  spaceId: string;
  spaceSlug: string;
}

function DomainItem({ domain, spaceId, spaceSlug }: DomainItemProps) {
  const [expanded, setExpanded] = useState(true);
  const { data: missions = [], isLoading } = useGetMissionsQuery(domain.id);
  const deleteDomain = useDeleteDomainMutation();
  const [addMissionOpened, { open: openAddMission, close: closeAddMission }] =
    useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);

  const statusFilter = useAtomValue(missionStatusFilterAtom);
  const missionSort = useAtomValue(missionSortAtom);

  const dotColor = domain.color ?? '#868e96';

  const filteredSortedMissions = useMemo(() => {
    let list = missions;
    // Filter
    if (statusFilter) {
      list = list.filter((m) => m.status === statusFilter);
    }
    // Sort
    if (missionSort === 'name-asc') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (missionSort === 'name-desc') {
      list = [...list].sort((a, b) => b.name.localeCompare(a.name));
    } else if (missionSort === 'status') {
      const order: Record<MissionStatus, number> = { active: 0, completed: 1, archived: 2, cancelled: 3 };
      list = [...list].sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
    }
    return list;
  }, [missions, statusFilter, missionSort]);

  return (
    <div>
      {/* Domain row */}
      <div className={classes.domainItem}>
        <div
          className={classes.domainLeft}
          onClick={() => setExpanded((v) => !v)}
          style={{ flex: 1 }}
        >
          <ActionIcon
            size={14}
            variant="transparent"
            color="gray"
            style={{ flexShrink: 0 }}
          >
            {expanded ? (
              <IconChevronDown size={12} />
            ) : (
              <IconChevronRight size={12} />
            )}
          </ActionIcon>
          <span
            className={classes.domainColor}
            style={{ backgroundColor: dotColor }}
          />
          <span className={classes.domainName}>{domain.name}</span>
        </div>

        <div className={classes.domainActions}>
          <Tooltip label="Add mission" withArrow position="right">
            <ActionIcon
              size={16}
              variant="transparent"
              color="gray"
              onClick={openAddMission}
            >
              <IconPlus size={14} />
            </ActionIcon>
          </Tooltip>

          <Menu width={160} shadow="md" withArrow position="right-start">
            <Menu.Target>
              <ActionIcon size={16} variant="transparent" color="gray">
                <IconDots size={14} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconEdit size={14} />}
                onClick={openEdit}
              >
                Edit domain
              </Menu.Item>
              <Menu.Item
                leftSection={<IconPlus size={14} />}
                onClick={openAddMission}
              >
                Add mission
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={() => deleteDomain.mutate({ domainId: domain.id, spaceId })}
              >
                Delete domain
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      </div>

      {/* Missions list */}
      {expanded && (
        <div className={classes.missionList}>
          {isLoading && (
            <Text size="xs" c="dimmed" px="xs">
              Loading…
            </Text>
          )}
          {filteredSortedMissions.map((m) => (
            <MissionItem key={m.id} mission={m} domain={domain} spaceId={spaceId} spaceSlug={spaceSlug} />
          ))}
          {!isLoading && filteredSortedMissions.length === 0 && (
            <Text size="xs" c="dimmed" px="xs">
              {statusFilter ? 'No missions match filter' : 'No missions yet'}
            </Text>
          )}
        </div>
      )}

      <AddMissionModal
        opened={addMissionOpened}
        onClose={closeAddMission}
        domain={domain}
        spaceId={spaceId}
      />
      <EditDomainModal
        opened={editOpened}
        onClose={closeEdit}
        domain={domain}
        spaceId={spaceId}
      />
    </div>
  );
}

// ── Mission item ──────────────────────────────────────────────────────────────

interface MissionItemProps {
  mission: IMission;
  domain: IDomain;
  spaceId: string;
  spaceSlug: string;
}

function MissionItem({ mission, domain, spaceId, spaceSlug }: MissionItemProps) {
  const { missionId: activeMissionId } = useParams();
  const deleteMission = useDeleteMissionMutation();
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const isActive = activeMissionId === mission.id;
  const statusColor = MISSION_STATUS_COLORS[mission.status] ?? 'gray';

  return (
    <>
      <UnstyledButton
        component={Link}
        to={`/s/${spaceSlug}/mission/${mission.id}`}
        className={clsx(
          classes.missionItem,
          isActive && classes.missionItemActive,
        )}
      >
        <div className={classes.missionLeft}>
          <IconTarget size={13} color={`var(--mantine-color-${statusColor}-5)`} />
          <span className={classes.missionName}>{mission.name}</span>
        </div>

        <div className={classes.missionActions}>
          <Menu width={160} shadow="md" withArrow position="right-start">
            <Menu.Target>
              <ActionIcon
                size={16}
                variant="transparent"
                color="gray"
                onClick={(e) => e.preventDefault()}
              >
                <IconDots size={13} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconEdit size={14} />}
                onClick={(e) => {
                  e.preventDefault();
                  openEdit();
                }}
              >
                Edit mission
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={(e) => {
                  e.preventDefault();
                  deleteMission.mutate({
                    missionId: mission.id,
                    domainId: domain.id,
                    spaceId,
                  });
                }}
              >
                Delete mission
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      </UnstyledButton>

      <EditMissionModal
        opened={editOpened}
        onClose={closeEdit}
        mission={mission}
        domainId={domain.id}
      />
    </>
  );
}

// ── Add domain modal ──────────────────────────────────────────────────────────

interface AddDomainModalProps {
  opened: boolean;
  onClose: () => void;
  spaceId: string;
}

function AddDomainModal({ opened, onClose, spaceId }: AddDomainModalProps) {
  const [name, setName] = useState('');
  const create = useCreateDomainMutation();

  const handleSubmit = () => {
    if (!name.trim()) return;
    create.mutate(
      { name: name.trim(), spaceId },
      {
        onSuccess: () => {
          setName('');
          onClose();
        },
      },
    );
  };

  return (
    <Modal opened={opened} onClose={onClose} title="New domain" size="sm">
      <Stack>
        <TextInput
          label="Name"
          placeholder="e.g. Work, Health, Learning"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
        />
        <Group justify="flex-end">
          <UnstyledButton onClick={onClose} style={{ fontSize: 14 }}>
            Cancel
          </UnstyledButton>
          <ActionIcon
            onClick={handleSubmit}
            loading={create.isPending}
            variant="filled"
            size="md"
          >
            <IconPlus size={16} />
          </ActionIcon>
        </Group>
      </Stack>
    </Modal>
  );
}

// ── Add mission modal ─────────────────────────────────────────────────────────

interface AddMissionModalProps {
  opened: boolean;
  onClose: () => void;
  domain: IDomain;
  spaceId: string;
}

function AddMissionModal({ opened, onClose, domain, spaceId }: AddMissionModalProps) {
  const [name, setName] = useState('');
  const create = useCreateMissionMutation();

  const handleSubmit = () => {
    if (!name.trim()) return;
    create.mutate(
      { name: name.trim(), domainId: domain.id, spaceId },
      {
        onSuccess: () => {
          setName('');
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`New mission in "${domain.name}"`}
      size="sm"
    >
      <Stack>
        <TextInput
          label="Name"
          placeholder="e.g. Launch v2, Learn TypeScript"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
        />
        <Group justify="flex-end">
          <UnstyledButton onClick={onClose} style={{ fontSize: 14 }}>
            Cancel
          </UnstyledButton>
          <ActionIcon
            onClick={handleSubmit}
            loading={create.isPending}
            variant="filled"
            size="md"
          >
            <IconPlus size={16} />
          </ActionIcon>
        </Group>
      </Stack>
    </Modal>
  );
}

// ── Filter + Sort bar ─────────────────────────────────────────────────────────

const STATUS_FILTERS: { value: MissionStatus | null; label: string; color: string }[] = [
  { value: null, label: 'All', color: 'gray' },
  { value: 'active', label: 'Active', color: 'blue' },
  { value: 'completed', label: 'Done', color: 'green' },
  { value: 'archived', label: 'Archived', color: 'gray' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
];

const DOMAIN_SORT_LABELS: Record<DomainSortKey, string> = {
  default: 'Domains: default',
  'name-asc': 'Domains: A → Z',
  'name-desc': 'Domains: Z → A',
};
const MISSION_SORT_LABELS: Record<MissionSortKey, string> = {
  default: 'Missions: default',
  'name-asc': 'Missions: A → Z',
  'name-desc': 'Missions: Z → A',
  status: 'Missions: by status',
};

function FilterSortBar() {
  const statusFilter = useAtomValue(missionStatusFilterAtom);
  const setStatusFilter = useSetAtom(missionStatusFilterAtom);
  const domainSort = useAtomValue(domainSortAtom);
  const setDomainSort = useSetAtom(domainSortAtom);
  const missionSort = useAtomValue(missionSortAtom);
  const setMissionSort = useSetAtom(missionSortAtom);

  const isSorted = domainSort !== 'default' || missionSort !== 'default';
  const isFiltered = statusFilter !== null;

  return (
    <div style={{ marginBottom: 8 }}>
      <Group gap={4} mb={4} align="center">
        {/* Filter menu */}
        <Menu width={180} shadow="md" withinPortal position="bottom-start">
          <Menu.Target>
            <Tooltip label="Filter missions" withArrow position="right">
              <ActionIcon
                size={20}
                variant={isFiltered ? 'filled' : 'subtle'}
                color={isFiltered ? 'blue' : 'gray'}
              >
                <IconList size={12} />
              </ActionIcon>
            </Tooltip>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Filter by status</Menu.Label>
            {STATUS_FILTERS.map(({ value, label, color }) => (
              <Menu.Item
                key={String(value)}
                fw={statusFilter === value ? 600 : 400}
                onClick={() => setStatusFilter(value)}
                rightSection={statusFilter === value ? '✓' : undefined}
                leftSection={
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    backgroundColor: `var(--mantine-color-${color}-5)`,
                  }} />
                }
              >
                {label}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>

        {/* Sort menu */}
        <Menu width={200} shadow="md" withinPortal position="bottom-start">
          <Menu.Target>
            <Tooltip label="Sort" withArrow position="right">
              <ActionIcon
                size={20}
                variant={isSorted ? 'filled' : 'subtle'}
                color={isSorted ? 'blue' : 'gray'}
              >
                <IconSortAscending size={12} />
              </ActionIcon>
            </Tooltip>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Domains</Menu.Label>
            {(Object.keys(DOMAIN_SORT_LABELS) as DomainSortKey[]).map((key) => (
              <Menu.Item
                key={key}
                fw={domainSort === key ? 600 : 400}
                onClick={() => setDomainSort(key)}
                rightSection={domainSort === key ? '✓' : undefined}
              >
                {DOMAIN_SORT_LABELS[key]}
              </Menu.Item>
            ))}
            <Menu.Divider />
            <Menu.Label>Missions</Menu.Label>
            {(Object.keys(MISSION_SORT_LABELS) as MissionSortKey[]).map((key) => (
              <Menu.Item
                key={key}
                fw={missionSort === key ? 600 : 400}
                onClick={() => setMissionSort(key)}
                rightSection={missionSort === key ? '✓' : undefined}
              >
                {MISSION_SORT_LABELS[key]}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      </Group>
    </div>
  );
}

// ── Sidebar root ──────────────────────────────────────────────────────────────

interface ProjectSidebarProps {
  spaceId: string;
  spaceSlug: string;
}

export function ProjectSidebar({ spaceId, spaceSlug }: ProjectSidebarProps) {
  const { data: domains = [], isLoading } = useGetDomainsQuery(spaceId);
  const [addDomainOpened, { open: openAddDomain, close: closeAddDomain }] =
    useDisclosure(false);
  const domainSort = useAtomValue(domainSortAtom);
  const location = useLocation();
  const isAllTasksActive = location.pathname === `/s/${spaceSlug}/tasks`;

  const sortedDomains = useMemo(() => {
    if (domainSort === 'name-asc') return [...domains].sort((a, b) => a.name.localeCompare(b.name));
    if (domainSort === 'name-desc') return [...domains].sort((a, b) => b.name.localeCompare(a.name));
    return domains;
  }, [domains, domainSort]);

  return (
    <div className={classes.navbar}>
      {/* Header */}
      <div className={classes.header}>
        <IconLayoutList size={16} className={classes.headerIcon} />
        <UnstyledButton
          component={Link}
          to={`/s/${spaceSlug}/projects`}
          style={{ fontSize: 15, fontWeight: 600, color: 'inherit', textDecoration: 'none', letterSpacing: 0 }}
        >
          Projects
        </UnstyledButton>
      </div>

      {/* All Tasks shortcut */}
      <UnstyledButton
        component={Link}
        to={`/s/${spaceSlug}/tasks`}
        className={clsx(classes.missionItem, isAllTasksActive && classes.missionItemActive)}
        style={{ marginBottom: 4 }}
      >
        <div className={classes.missionLeft}>
          <IconList size={13} />
          <span style={{ fontSize: 13, fontWeight: 500 }}>All Tasks</span>
        </div>
      </UnstyledButton>

      {/* Filter + Sort controls */}
      <FilterSortBar />

      {/* Tree */}
      <div className={classes.treeRoot}>
        {isLoading && (
          <Text size="sm" c="dimmed" px="xs">
            Loading…
          </Text>
        )}

        {sortedDomains.map((domain) => (
          <DomainItem key={domain.id} domain={domain} spaceId={spaceId} spaceSlug={spaceSlug} />
        ))}

        {!isLoading && domains.length === 0 && (
          <Text size="sm" c="dimmed" px="xs" mt="xs">
            No domains yet. Create one to get started.
          </Text>
        )}

        {/* Add domain button */}
        <UnstyledButton
          className={classes.addDomainBtn}
          onClick={openAddDomain}
        >
          <IconPlus size={14} />
          <span>Add domain</span>
        </UnstyledButton>
      </div>

      <AddDomainModal opened={addDomainOpened} onClose={closeAddDomain} spaceId={spaceId} />
    </div>
  );
}
