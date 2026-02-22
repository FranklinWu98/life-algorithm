import {
  ActionIcon,
  Badge,
  Checkbox,
  Group,
  Menu,
  Text,
  Tooltip,
} from '@mantine/core';
import { IconDots, IconTrash } from '@tabler/icons-react';
import { ITask } from '@/features/project/types/project.types';
import {
  IMPORTANCE_COLORS,
  IMPORTANCE_LABELS,
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
} from '@/features/project/hooks/use-task-filters';
import {
  useDeleteTaskMutation,
  useUpdateTaskMutation,
} from '@/features/project/queries/project-query';

interface TaskRowProps {
  task: ITask;
  onOpen: () => void;
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function TaskRow({ task, onOpen }: TaskRowProps) {
  const updateTask = useUpdateTaskMutation();
  const deleteTask = useDeleteTaskMutation();

  const isCompleted = task.status === 'completed';

  const toggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = isCompleted ? 'not_started' : 'completed';
    updateTask.mutate({
      taskId: task.id,
      missionId: task.missionId,
      data: { status: newStatus },
    });
  };

  return (
    <tr
      style={{ opacity: task.status === 'cancelled' ? 0.5 : 1, cursor: 'pointer' }}
      onClick={onOpen}
    >
      {/* Checkbox */}
      <td style={{ width: 36, paddingRight: 0 }} onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isCompleted}
          onChange={() => {}}
          onClick={toggleComplete}
          size="sm"
          radius="xl"
        />
      </td>

      {/* Name */}
      <td>
        <Text
          size="sm"
          td={isCompleted ? 'line-through' : undefined}
          c={isCompleted ? 'dimmed' : undefined}
          style={{ lineHeight: 1.4 }}
        >
          {task.name}
        </Text>
      </td>

      {/* Status */}
      <td style={{ width: 110 }}>
        <Badge
          size="xs"
          variant="light"
          color={TASK_STATUS_COLORS[task.status] ?? 'gray'}
        >
          {TASK_STATUS_LABELS[task.status] ?? task.status}
        </Badge>
      </td>

      {/* Importance */}
      <td style={{ width: 80 }}>
        {task.importantLevel > 0 && (
          <Badge
            size="xs"
            variant="dot"
            color={IMPORTANCE_COLORS[task.importantLevel] ?? 'gray'}
          >
            {IMPORTANCE_LABELS[task.importantLevel]}
          </Badge>
        )}
      </td>

      {/* Date window */}
      <td style={{ width: 140 }}>
        <Text size="xs" c="dimmed">
          {task.timeToDoStart && formatDate(task.timeToDoStart)}
          {task.timeToDoStart && task.timeToDoEnd && ' → '}
          {task.timeToDoEnd && formatDate(task.timeToDoEnd)}
        </Text>
      </td>

      {/* Finish time (when completed) */}
      <td style={{ width: 100 }}>
        {task.finishTime && (
          <Tooltip label={`Finished ${new Date(task.finishTime).toLocaleString()}`} withArrow>
            <Text size="xs" c="green">
              ✓ {formatDate(task.finishTime)}
            </Text>
          </Tooltip>
        )}
      </td>

      {/* Actions */}
      <td style={{ width: 36 }} onClick={(e) => e.stopPropagation()}>
        <Menu width={160} shadow="md" withArrow position="right-start">
          <Menu.Target>
            <ActionIcon size="sm" variant="subtle" color="gray">
              <IconDots size={14} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              color="red"
              leftSection={<IconTrash size={14} />}
              onClick={() =>
                deleteTask.mutate({
                  taskId: task.id,
                  missionId: task.missionId,
                })
              }
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </td>
    </tr>
  );
}
