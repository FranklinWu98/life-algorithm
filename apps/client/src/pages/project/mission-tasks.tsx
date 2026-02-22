import {
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import {
  IconCalendar,
  IconPlus,
  IconTarget,
} from '@tabler/icons-react';
import {
  useCreateTaskMutation,
  useGetMissionQuery,
  useGetTasksQuery,
} from '@/features/project/queries/project-query';
import { TaskFilterBar } from '@/features/project/components/task-list/task-filters';
import { TaskRow } from '@/features/project/components/task-list/task-row';
import { useTaskFilters } from '@/features/project/hooks/use-task-filters';
import {
  MISSION_STATUS_COLORS,
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
} from '@/features/project/hooks/use-task-filters';
import { TaskDetailPanel } from '@/features/project/components/task-detail/task-detail-drawer';

// ── Add task modal ────────────────────────────────────────────────────────────

interface AddTaskModalProps {
  opened: boolean;
  onClose: () => void;
  missionId: string;
}

function AddTaskModal({ opened, onClose, missionId }: AddTaskModalProps) {
  const [name, setName] = useState('');
  const create = useCreateTaskMutation();

  const handleSubmit = () => {
    if (!name.trim()) return;
    create.mutate(
      { name: name.trim(), missionId },
      {
        onSuccess: () => {
          setName('');
          onClose();
        },
      },
    );
  };

  return (
    <Modal opened={opened} onClose={onClose} title="New task" size="sm">
      <Stack>
        <TextInput
          label="Task name"
          placeholder="What needs to be done?"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
        />
        <Group justify="flex-end">
          <Button variant="default" size="xs" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="xs"
            onClick={handleSubmit}
            loading={create.isPending}
          >
            Create task
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

// ── Task stats strip ──────────────────────────────────────────────────────────

function TaskStats({ tasks }: { tasks: ReturnType<typeof useGetTasksQuery>['data'] }) {
  if (!tasks?.length) return null;

  const counts = tasks.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <Group gap="xs">
      {Object.entries(counts).map(([status, count]) => (
        <Badge
          key={status}
          size="sm"
          variant="light"
          color={TASK_STATUS_COLORS[status] ?? 'gray'}
        >
          {count} {TASK_STATUS_LABELS[status] ?? status}
        </Badge>
      ))}
    </Group>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MissionTasksPage() {
  const { missionId } = useParams<{ missionId: string }>();
  const { data: mission, isLoading: missionLoading } =
    useGetMissionQuery(missionId!);
  const { data: tasks, isLoading: tasksLoading } =
    useGetTasksQuery(missionId!);
  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const { applyFilters, hasActiveFilters } = useTaskFilters();

  // Task detail panel state — track by ID so panel always shows live query data
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const filteredTasks = applyFilters(tasks ?? []);

  if (missionLoading) {
    return (
      <Box p="xl" ta="center">
        <Loader size="sm" />
      </Box>
    );
  }

  if (!mission) {
    return (
      <Box p="xl">
        <Text c="dimmed">Mission not found.</Text>
      </Box>
    );
  }

  return (
    <>
      <Box p="xl" style={{ maxWidth: 900 }}>
        {/* Mission header */}
        <Stack gap="xs" mb="lg">
          <Group gap="xs" align="center">
            <IconTarget
              size={20}
              color={`var(--mantine-color-${MISSION_STATUS_COLORS[mission.status] ?? 'gray'}-5)`}
            />
            <Title order={3}>{mission.name}</Title>
            <Badge
              size="sm"
              variant="light"
              color={MISSION_STATUS_COLORS[mission.status] ?? 'gray'}
            >
              {mission.status}
            </Badge>
          </Group>

          {mission.description && (
            <Text size="sm" c="dimmed">
              {mission.description}
            </Text>
          )}

          {(mission.startDate || mission.endDate) && (
            <Group gap="xs">
              <IconCalendar size={14} color="var(--mantine-color-gray-5)" />
              <Text size="xs" c="dimmed">
                {mission.startDate &&
                  new Date(mission.startDate).toLocaleDateString()}
                {mission.startDate && mission.endDate && ' → '}
                {mission.endDate &&
                  new Date(mission.endDate).toLocaleDateString()}
              </Text>
            </Group>
          )}

          <TaskStats tasks={tasks} />
        </Stack>

        {/* Toolbar */}
        <Group justify="space-between" mb="md">
          <TaskFilterBar />
          <Button
            size="xs"
            leftSection={<IconPlus size={14} />}
            onClick={openAdd}
          >
            Add task
          </Button>
        </Group>

        {/* Task table */}
        {tasksLoading ? (
          <Box ta="center" py="xl">
            <Loader size="sm" />
          </Box>
        ) : filteredTasks.length === 0 ? (
          <Box ta="center" py="xl">
            <Text c="dimmed" size="sm">
              {hasActiveFilters
                ? 'No tasks match your filters.'
                : 'No tasks yet. Add one to get started.'}
            </Text>
          </Box>
        ) : (
          <Table
            striped
            highlightOnHover
            withTableBorder
            withColumnBorders={false}
            verticalSpacing="xs"
            style={{ tableLayout: 'fixed' }}
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: 36 }} />
                <Table.Th>Task</Table.Th>
                <Table.Th style={{ width: 110 }}>Status</Table.Th>
                <Table.Th style={{ width: 80 }}>Priority</Table.Th>
                <Table.Th style={{ width: 140 }}>Scheduled</Table.Th>
                <Table.Th style={{ width: 100 }}>Finished</Table.Th>
                <Table.Th style={{ width: 36 }} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onOpen={() => setSelectedTaskId(task.id)}
                />
              ))}
            </Table.Tbody>
          </Table>
        )}

        <AddTaskModal
          opened={addOpened}
          onClose={closeAdd}
          missionId={missionId!}
        />
      </Box>

      {/* Task detail panel (drawer / modal / fullscreen) */}
      <TaskDetailPanel
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </>
  );
}
