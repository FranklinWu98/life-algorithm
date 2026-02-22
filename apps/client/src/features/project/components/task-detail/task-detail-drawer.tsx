import {
  ActionIcon,
  Anchor,
  Badge,
  Breadcrumbs,
  Checkbox,
  Divider,
  Drawer,
  Group,
  Loader,
  Modal,
  Popover,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDebouncedCallback } from '@mantine/hooks';
import { useAtom } from 'jotai';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconAdjustments,
  IconCalendar,
  IconFlag,
  IconCheck,
  IconLayoutSidebarRight,
  IconWindowMaximize,
  IconMaximize,
  IconX,
} from '@tabler/icons-react';
import {
  useGetTaskNoteQuery,
  useGetTaskQuery,
  useGetMissionQuery,
  useGetDomainQuery,
  useUpdateTaskMutation,
} from '@/features/project/queries/project-query';
import {
  taskPropertyPrefsAtom,
  taskViewModeAtom,
  DEFAULT_TASK_PREFS,
  type TaskViewMode,
} from '@/features/project/atoms/project-prefs-atom';
import {
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
  IMPORTANCE_COLORS,
  IMPORTANCE_LABELS,
} from '@/features/project/hooks/use-task-filters';
import { TaskNoteEditor } from './task-note-editor';

// ── Property row ──────────────────────────────────────────────────────────────

function PropRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Group gap="sm" align="center" wrap="nowrap">
      <Group gap={6} style={{ width: 120, flexShrink: 0 }} wrap="nowrap">
        {icon}
        <Text size="sm" c="dimmed" style={{ userSelect: 'none' }}>
          {label}
        </Text>
      </Group>
      <div style={{ flex: 1 }}>{children}</div>
    </Group>
  );
}

// ── Customize popover ─────────────────────────────────────────────────────────

function CustomizePopover() {
  const [prefs, setPrefs] = useAtom(taskPropertyPrefsAtom);

  const toggle = (key: keyof typeof prefs) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return (
    <Popover width={200} position="bottom-end" withArrow shadow="md">
      <Popover.Target>
        <Tooltip label="Customize visible properties" withArrow>
          <ActionIcon variant="subtle" color="gray" size="sm">
            <IconAdjustments size={14} />
          </ActionIcon>
        </Tooltip>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="xs">
          <Text size="xs" fw={600} c="dimmed">
            Show / hide properties
          </Text>
          {(
            [
              ['showStatus', 'Status'],
              ['showImportance', 'Priority'],
              ['showSchedule', 'Schedule'],
              ['showFinishTime', 'Finished'],
            ] as [keyof typeof DEFAULT_TASK_PREFS, string][]
          ).map(([key, label]) => (
            <Checkbox
              key={key}
              size="xs"
              label={label}
              checked={prefs[key]}
              onChange={() => toggle(key)}
            />
          ))}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}

// ── View mode toggle ──────────────────────────────────────────────────────────

function ViewModeToggle() {
  const [viewMode, setViewMode] = useAtom(taskViewModeAtom);

  const modes: { value: TaskViewMode; label: string; icon: React.ReactNode }[] = [
    { value: 'drawer', label: 'Side panel', icon: <IconLayoutSidebarRight size={14} /> },
    { value: 'modal', label: 'Center window', icon: <IconWindowMaximize size={14} /> },
    { value: 'fullscreen', label: 'Full screen', icon: <IconMaximize size={14} /> },
  ];

  return (
    <Group gap={2} wrap="nowrap">
      {modes.map(({ value, label, icon }) => (
        <Tooltip key={value} label={label} withArrow>
          <ActionIcon
            size="sm"
            variant={viewMode === value ? 'filled' : 'subtle'}
            color={viewMode === value ? 'blue' : 'gray'}
            onClick={() => setViewMode(value)}
          >
            {icon}
          </ActionIcon>
        </Tooltip>
      ))}
    </Group>
  );
}

// ── Task detail content (shared across all view modes) ────────────────────────

interface TaskDetailContentProps {
  taskId: string;
  onClose: () => void;
}

function TaskDetailContent({ taskId, onClose }: TaskDetailContentProps) {
  const navigate = useNavigate();
  const [prefs] = useAtom(taskPropertyPrefsAtom);
  const updateTask = useUpdateTaskMutation();

  // Live task data — always fresh from query cache
  const { data: task, isLoading: taskLoading } = useGetTaskQuery(taskId);
  // Breadcrumb data
  const { data: mission } = useGetMissionQuery(task?.missionId ?? '');
  const { data: domain } = useGetDomainQuery(mission?.domainId ?? '');
  // Note
  const { data: taskNote, isLoading: noteLoading } = useGetTaskNoteQuery(taskId);

  // Local name — only re-initialized when taskId changes (not on re-fetch)
  const [editedName, setEditedName] = useState('');
  const lastTaskIdRef = useRef('');

  useEffect(() => {
    if (task?.id && task.id !== lastTaskIdRef.current) {
      lastTaskIdRef.current = task.id;
      setEditedName(task.name);
    }
  }, [task?.id, task?.name]);

  const saveNameDebounced = useDebouncedCallback((name: string) => {
    if (!task) return;
    updateTask.mutate({ taskId: task.id, missionId: task.missionId, data: { name } });
  }, 800);

  const handleStatusChange = (val: string | null) => {
    if (!val || !task) return;
    updateTask.mutate({ taskId: task.id, missionId: task.missionId, data: { status: val as any } });
  };

  const handleImportanceChange = (val: string | null) => {
    if (val === null || !task) return;
    updateTask.mutate({ taskId: task.id, missionId: task.missionId, data: { importantLevel: Number(val) as any } });
  };

  const handleStartDateChange = (dateVal: string) => {
    if (!task) return;
    updateTask.mutate({ taskId: task.id, missionId: task.missionId, data: { timeToDoStart: dateVal || undefined } });
  };

  const handleEndDateChange = (dateVal: string) => {
    if (!task) return;
    updateTask.mutate({ taskId: task.id, missionId: task.missionId, data: { timeToDoEnd: dateVal || undefined } });
  };

  const statusOptions = Object.entries(TASK_STATUS_LABELS).map(([v, label]) => ({ value: v, label }));
  const importanceOptions = Object.entries(IMPORTANCE_LABELS).map(([v, label]) => ({ value: v, label }));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div
        style={{
          padding: '10px 16px 10px',
          borderBottom: '1px solid var(--mantine-color-default-border)',
          flexShrink: 0,
        }}
      >
        {/* Breadcrumb + view controls */}
        <Group justify="space-between" mb={6} wrap="nowrap" gap="xs">
          <Breadcrumbs
            separator="›"
            styles={{ separator: { color: 'var(--mantine-color-dimmed)', margin: '0 2px' } }}
          >
            <Anchor
              size="xs"
              c="dimmed"
              onClick={() => { onClose(); navigate('/project'); }}
              style={{ cursor: 'pointer' }}
            >
              {domain?.name ?? '…'}
            </Anchor>
            <Anchor
              size="xs"
              c="dimmed"
              onClick={() => {
                if (mission && task) {
                  onClose();
                  navigate(`/project/d/${mission.domainId}/m/${task.missionId}`);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              {mission?.name ?? '…'}
            </Anchor>
          </Breadcrumbs>

          <Group gap={4} wrap="nowrap">
            <ViewModeToggle />
            <ActionIcon size="sm" variant="subtle" color="gray" ml={4} onClick={onClose}>
              <IconX size={14} />
            </ActionIcon>
          </Group>
        </Group>

        {/* Task name */}
        {taskLoading ? (
          <Text size="lg" fw={600} c="dimmed" style={{ minHeight: 32 }}>…</Text>
        ) : (
          <TextInput
            value={editedName}
            onChange={(e) => {
              const v = e.currentTarget.value;
              setEditedName(v);
              saveNameDebounced(v);
            }}
            variant="unstyled"
            placeholder="Task name"
            styles={{ input: { fontSize: 20, fontWeight: 600, padding: 0 } }}
          />
        )}
      </div>

      {/* ── Scrollable body ─────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
        {taskLoading ? (
          <Group justify="center" py="xl">
            <Loader size="sm" />
          </Group>
        ) : !task ? (
          <Text c="dimmed">Task not found.</Text>
        ) : (
          <>
            {/* Properties */}
            <Group justify="space-between" mb="xs" align="center">
              <Text size="xs" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: 0.5 }}>
                Properties
              </Text>
              <CustomizePopover />
            </Group>

            <Stack gap="xs" mb="md">
              {prefs.showStatus && (
                <PropRow icon={<IconCheck size={14} color="var(--mantine-color-gray-5)" />} label="Status">
                  <Select
                    size="xs"
                    value={task.status}
                    onChange={handleStatusChange}
                    data={statusOptions}
                    variant="filled"
                    styles={{ input: { width: 140 } }}
                    renderOption={({ option }) => (
                      <Badge size="xs" variant="light" color={TASK_STATUS_COLORS[option.value] ?? 'gray'}>
                        {option.label}
                      </Badge>
                    )}
                  />
                </PropRow>
              )}

              {prefs.showImportance && (
                <PropRow icon={<IconFlag size={14} color="var(--mantine-color-gray-5)" />} label="Priority">
                  <Select
                    size="xs"
                    value={String(task.importantLevel)}
                    onChange={handleImportanceChange}
                    data={importanceOptions}
                    variant="filled"
                    styles={{ input: { width: 140 } }}
                    renderOption={({ option }) => (
                      <Badge size="xs" variant="dot" color={IMPORTANCE_COLORS[Number(option.value)] ?? 'gray'}>
                        {option.label}
                      </Badge>
                    )}
                  />
                </PropRow>
              )}

              {prefs.showSchedule && (
                <PropRow icon={<IconCalendar size={14} color="var(--mantine-color-gray-5)" />} label="Schedule">
                  <Group gap="xs" wrap="nowrap">
                    <DateInput
                      size="xs"
                      placeholder="Start"
                      value={task.timeToDoStart ? new Date(task.timeToDoStart) : null}
                      onChange={handleStartDateChange}
                      clearable
                      style={{ width: 110 }}
                    />
                    <Text size="xs" c="dimmed">→</Text>
                    <DateInput
                      size="xs"
                      placeholder="End"
                      value={task.timeToDoEnd ? new Date(task.timeToDoEnd) : null}
                      onChange={handleEndDateChange}
                      clearable
                      style={{ width: 110 }}
                    />
                  </Group>
                </PropRow>
              )}

              {prefs.showFinishTime && task.finishTime && (
                <PropRow icon={<IconCheck size={14} color="var(--mantine-color-green-5)" />} label="Finished">
                  <Text size="sm" c="green">
                    {new Date(task.finishTime).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </PropRow>
              )}
            </Stack>

            <Divider mb="md" />

            {/* Note editor */}
            {noteLoading ? (
              <Group justify="center" py="xl">
                <Loader size="sm" />
              </Group>
            ) : (
              <TaskNoteEditor
                key={taskId}
                taskId={taskId}
                initialContent={taskNote?.content ?? null}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Container — switches between Drawer / Modal / Fullscreen ──────────────────

interface TaskDetailPanelProps {
  taskId: string | null;
  onClose: () => void;
}

export function TaskDetailPanel({ taskId, onClose }: TaskDetailPanelProps) {
  const [viewMode] = useAtom(taskViewModeAtom);
  const opened = !!taskId;

  const bodyStyle: React.CSSProperties = {
    padding: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <>
      {/* Side drawer */}
      <Drawer
        opened={opened && viewMode === 'drawer'}
        onClose={onClose}
        position="right"
        size="lg"
        withCloseButton={false}
        styles={{ body: bodyStyle, inner: { padding: 0 } }}
      >
        {taskId && viewMode === 'drawer' && (
          <TaskDetailContent taskId={taskId} onClose={onClose} />
        )}
      </Drawer>

      {/* Center modal */}
      <Modal
        opened={opened && viewMode === 'modal'}
        onClose={onClose}
        size={960}
        withCloseButton={false}
        styles={{ body: { ...bodyStyle, height: '78vh' } }}
      >
        {taskId && viewMode === 'modal' && (
          <TaskDetailContent taskId={taskId} onClose={onClose} />
        )}
      </Modal>

      {/* Full screen */}
      <Modal
        opened={opened && viewMode === 'fullscreen'}
        onClose={onClose}
        fullScreen
        withCloseButton={false}
        styles={{ body: bodyStyle }}
      >
        {taskId && viewMode === 'fullscreen' && (
          <TaskDetailContent taskId={taskId} onClose={onClose} />
        )}
      </Modal>
    </>
  );
}
