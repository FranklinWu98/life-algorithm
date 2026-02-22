import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Popover,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  IconFilter,
  IconSearch,
  IconX,
} from '@tabler/icons-react';
import { useTaskFilters } from '@/features/project/hooks/use-task-filters';
import { ImportantLevel, TaskStatus } from '@/features/project/types/project.types';
import { useDisclosure } from '@mantine/hooks';

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const IMPORTANCE_OPTIONS = [
  { value: '0', label: 'None' },
  { value: '1', label: 'Low' },
  { value: '2', label: 'Medium' },
  { value: '3', label: 'High' },
  { value: '4', label: 'Urgent' },
];

export function TaskFilterBar() {
  const { filters, setFilter, resetFilters, hasActiveFilters } =
    useTaskFilters();
  const [popoverOpen, { toggle: togglePopover, close: closePopover }] =
    useDisclosure(false);

  return (
    <Group gap="xs" align="center">
      {/* Search — always visible */}
      <TextInput
        placeholder="Search tasks…"
        leftSection={<IconSearch size={14} />}
        value={filters.search}
        onChange={(e) => setFilter('search', e.currentTarget.value)}
        size="xs"
        style={{ width: 200 }}
        rightSection={
          filters.search ? (
            <ActionIcon
              size={14}
              variant="transparent"
              onClick={() => setFilter('search', '')}
            >
              <IconX size={12} />
            </ActionIcon>
          ) : null
        }
      />

      {/* Filter popover for the rest */}
      <Popover
        opened={popoverOpen}
        onClose={closePopover}
        position="bottom-start"
        shadow="md"
        withArrow
      >
        <Popover.Target>
          <Tooltip label="Filters" withArrow>
            <Button
              size="xs"
              variant={hasActiveFilters ? 'filled' : 'default'}
              leftSection={<IconFilter size={14} />}
              onClick={togglePopover}
              rightSection={
                hasActiveFilters ? (
                  <Badge size="xs" circle>
                    {[
                      filters.status,
                      filters.importantLevel !== null ? '1' : null,
                      filters.timeToDoStart,
                      filters.timeToDoEnd,
                    ].filter(Boolean).length}
                  </Badge>
                ) : null
              }
            >
              Filter
            </Button>
          </Tooltip>
        </Popover.Target>

        <Popover.Dropdown>
          <Stack gap="sm" style={{ minWidth: 260 }}>
            <Text size="xs" fw={600} c="dimmed">
              FILTERS
            </Text>

            <Select
              label="Status"
              placeholder="Any status"
              data={STATUS_OPTIONS}
              value={filters.status}
              onChange={(v) => setFilter('status', (v as TaskStatus) ?? null)}
              clearable
              size="xs"
            />

            <Select
              label="Importance"
              placeholder="Any level"
              data={IMPORTANCE_OPTIONS}
              value={
                filters.importantLevel !== null
                  ? String(filters.importantLevel)
                  : null
              }
              onChange={(v) =>
                setFilter(
                  'importantLevel',
                  v !== null ? (Number(v) as ImportantLevel) : null,
                )
              }
              clearable
              size="xs"
            />

            <DatePickerInput
              label="Start date (from)"
              placeholder="Pick a date"
              value={
                filters.timeToDoStart ? new Date(filters.timeToDoStart) : null
              }
              onChange={(d) =>
                setFilter('timeToDoStart', d ? new Date(d as unknown as Date).toISOString() : null)
              }
              clearable
              size="xs"
            />

            <DatePickerInput
              label="End date (to)"
              placeholder="Pick a date"
              value={
                filters.timeToDoEnd ? new Date(filters.timeToDoEnd) : null
              }
              onChange={(d) =>
                setFilter('timeToDoEnd', d ? new Date(d as unknown as Date).toISOString() : null)
              }
              clearable
              size="xs"
            />

            {hasActiveFilters && (
              <Button
                size="xs"
                variant="subtle"
                color="red"
                onClick={() => {
                  resetFilters();
                  closePopover();
                }}
              >
                Clear all filters
              </Button>
            )}
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </Group>
  );
}
