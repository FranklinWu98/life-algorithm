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
  IconPlus,
  IconTarget,
  IconTrash,
} from '@tabler/icons-react';
import { Link, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { useDisclosure } from '@mantine/hooks';
import { useState, useEffect } from 'react';
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

// ── Edit domain modal ─────────────────────────────────────────────────────────

interface EditDomainModalProps {
  opened: boolean;
  onClose: () => void;
  domain: IDomain;
}

function EditDomainModal({ opened, onClose, domain }: EditDomainModalProps) {
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
            onChange={(v: string) => setStartDate(v || null)}
            clearable
            placeholder="Pick date"
          />
          <DateInput
            label="End date"
            value={endDate ? new Date(endDate) : null}
            onChange={(v: string) => setEndDate(v || null)}
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
}

function DomainItem({ domain }: DomainItemProps) {
  const [expanded, setExpanded] = useState(true);
  const { data: missions = [], isLoading } = useGetMissionsQuery(domain.id);
  const deleteDomain = useDeleteDomainMutation();
  const [addMissionOpened, { open: openAddMission, close: closeAddMission }] =
    useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);

  const dotColor = domain.color ?? '#868e96';

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
                onClick={() => deleteDomain.mutate(domain.id)}
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
          {missions.map((m) => (
            <MissionItem key={m.id} mission={m} domain={domain} />
          ))}
          {!isLoading && missions.length === 0 && (
            <Text size="xs" c="dimmed" px="xs">
              No missions yet
            </Text>
          )}
        </div>
      )}

      <AddMissionModal
        opened={addMissionOpened}
        onClose={closeAddMission}
        domain={domain}
      />
      <EditDomainModal
        opened={editOpened}
        onClose={closeEdit}
        domain={domain}
      />
    </div>
  );
}

// ── Mission item ──────────────────────────────────────────────────────────────

interface MissionItemProps {
  mission: IMission;
  domain: IDomain;
}

function MissionItem({ mission, domain }: MissionItemProps) {
  const { missionId: activeMissionId } = useParams();
  const deleteMission = useDeleteMissionMutation();
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const isActive = activeMissionId === mission.id;
  const statusColor = MISSION_STATUS_COLORS[mission.status] ?? 'gray';

  return (
    <>
      <UnstyledButton
        component={Link}
        to={`/project/d/${domain.id}/m/${mission.id}`}
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
}

function AddDomainModal({ opened, onClose }: AddDomainModalProps) {
  const [name, setName] = useState('');
  const create = useCreateDomainMutation();

  const handleSubmit = () => {
    if (!name.trim()) return;
    create.mutate(
      { name: name.trim() },
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
}

function AddMissionModal({ opened, onClose, domain }: AddMissionModalProps) {
  const [name, setName] = useState('');
  const create = useCreateMissionMutation();

  const handleSubmit = () => {
    if (!name.trim()) return;
    create.mutate(
      { name: name.trim(), domainId: domain.id },
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

// ── Sidebar root ──────────────────────────────────────────────────────────────

export function ProjectSidebar() {
  const { data: domains = [], isLoading } = useGetDomainsQuery();
  const [addDomainOpened, { open: openAddDomain, close: closeAddDomain }] =
    useDisclosure(false);

  return (
    <div className={classes.navbar}>
      {/* Header */}
      <div className={classes.header}>
        <IconLayoutList size={16} className={classes.headerIcon} />
        <span>Project Manager</span>
      </div>

      {/* Tree */}
      <div className={classes.treeRoot}>
        {isLoading && (
          <Text size="sm" c="dimmed" px="xs">
            Loading…
          </Text>
        )}

        {domains.map((domain) => (
          <DomainItem key={domain.id} domain={domain} />
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

      <AddDomainModal opened={addDomainOpened} onClose={closeAddDomain} />
    </div>
  );
}
