import { Badge, Group, Select, Text } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useGetDomainsQuery,
  useGetSpaceMissionsQuery,
  projectKeys,
} from '@/features/project/queries/project-query';
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  IMPORTANCE_LABELS,
  IMPORTANCE_COLORS,
} from '@/features/project/hooks/use-task-filters';
import { updatePage } from '@/features/page/services/page-service';
import type { IPage } from '@/features/page/types/page.types';
import type { TaskStatus, ImportantLevel } from '@/features/project/types/project.types';

interface Props {
  page: IPage;
  readOnly?: boolean;
}

function ColorDot({ color }: { color: string }) {
  return (
    <div style={{
      width: 8, height: 8, borderRadius: '50%',
      backgroundColor: `var(--mantine-color-${color}-5)`,
      flexShrink: 0,
    }} />
  );
}

export function PageTaskProps({ page, readOnly }: Props) {
  const qc = useQueryClient();
  const { data: domains = [] } = useGetDomainsQuery(page.spaceId);
  const { data: allMissions = [] } = useGetSpaceMissionsQuery(page.spaceId);

  const update = useMutation({
    mutationFn: (data: Partial<IPage> & { pageId: string }) =>
      updatePage(data as any),
    onSuccess: (updated) => {
      qc.setQueryData(['pages', updated.slugId], (old: IPage | undefined) =>
        old ? { ...old, ...updated } : updated,
      );
      qc.setQueryData(['pages', updated.id], (old: IPage | undefined) =>
        old ? { ...old, ...updated } : updated,
      );
      if (page.missionId) {
        qc.invalidateQueries({ queryKey: projectKeys.missionPages(page.missionId) });
      }
      if (updated.missionId && updated.missionId !== page.missionId) {
        qc.invalidateQueries({ queryKey: projectKeys.missionPages(updated.missionId) });
      }
    },
  });

  // Mantine v8 nested grouped format
  const missionOptions = useMemo(() => {
    if (!allMissions || allMissions.length === 0) return [];
    const domainMap = new Map((domains ?? []).map((d) => [d.id, d.name]));
    const grouped = new Map<string, { value: string; label: string }[]>();
    for (const m of allMissions) {
      const groupName = domainMap.get(m.domainId) ?? 'Unknown';
      if (!grouped.has(groupName)) grouped.set(groupName, []);
      grouped.get(groupName)!.push({ value: m.id, label: m.name });
    }
    return Array.from(grouped.entries()).map(([group, items]) => ({ group, items }));
  }, [domains, allMissions]);

  const statusOptions = Object.entries(TASK_STATUS_LABELS).map(([v, label]) => ({ value: v, label }));
  const importanceOptions = Object.entries(IMPORTANCE_LABELS).map(([v, label]) => ({
    value: String(v),
    label,
  }));

  const statusColor = TASK_STATUS_COLORS[page.taskStatus ?? 'not_started'] ?? 'gray';
  const priorityColor = IMPORTANCE_COLORS[page.importantLevel ?? 0] ?? 'gray';

  return (
    <div
      style={{
        borderBottom: '1px solid var(--mantine-color-default-border)',
        padding: '6px 24px',
        background: 'var(--mantine-color-body)',
        position: 'sticky',
        top: 90,
        zIndex: 50,
        marginTop: 29,
      }}
    >
      <Group gap="xs" wrap="wrap" align="center">
        {/* Mission selector — always visible */}
        <Select
          size="xs"
          value={page.missionId ?? null}
          onChange={(val: string | null) =>
            update.mutate({ pageId: page.id, missionId: val ?? null })
          }
          data={missionOptions}
          placeholder="Assign to mission…"
          disabled={readOnly}
          variant="filled"
          w={180}
          clearable
          searchable
          nothingFoundMessage="No missions"
        />

        {/* Task properties — only when linked to a mission */}
        {page.missionId && (
          <>
            <Text size="xs" c="dimmed">·</Text>

            {/* Status */}
            <Select
              size="xs"
              value={page.taskStatus ?? 'not_started'}
              onChange={(val: string | null) => {
                if (!val) return;
                update.mutate({ pageId: page.id, taskStatus: val as TaskStatus });
              }}
              data={statusOptions}
              disabled={readOnly}
              variant="filled"
              w={130}
              leftSection={<ColorDot color={statusColor} />}
              renderOption={({ option }) => (
                <Badge size="xs" variant="light" color={TASK_STATUS_COLORS[option.value] ?? 'gray'}>
                  {option.label}
                </Badge>
              )}
            />

            {/* Priority */}
            <Select
              size="xs"
              value={String(page.importantLevel ?? 0)}
              onChange={(val: string | null) => {
                if (val === null) return;
                update.mutate({ pageId: page.id, importantLevel: Number(val) as ImportantLevel });
              }}
              data={importanceOptions}
              disabled={readOnly}
              variant="filled"
              w={110}
              leftSection={<ColorDot color={priorityColor} />}
              renderOption={({ option }) => (
                <Badge size="xs" variant="dot" color={IMPORTANCE_COLORS[Number(option.value)] ?? 'gray'}>
                  {option.label}
                </Badge>
              )}
            />

            {/* Start date+time */}
            <DateTimePicker
              size="xs"
              placeholder="Start"
              value={page.timeToDoStart ? new Date(page.timeToDoStart) : null}
              onChange={(v: any) =>
                update.mutate({ pageId: page.id, timeToDoStart: v ? new Date(v).toISOString() : null })
              }
              clearable
              disabled={readOnly}
              w={160}
              valueFormat="MMM D, HH:mm"
              popoverProps={{ withinPortal: true }}
            />
            <Text size="xs" c="dimmed">→</Text>
            {/* End date+time */}
            <DateTimePicker
              size="xs"
              placeholder="End"
              value={page.timeToDoEnd ? new Date(page.timeToDoEnd) : null}
              onChange={(v: any) =>
                update.mutate({ pageId: page.id, timeToDoEnd: v ? new Date(v).toISOString() : null })
              }
              clearable
              disabled={readOnly}
              w={160}
              valueFormat="MMM D, HH:mm"
              popoverProps={{ withinPortal: true }}
            />

            {/* Finish time badge */}
            {page.finishTime && (
              <Badge size="xs" variant="light" color="green">
                Done{' '}
                {new Date(page.finishTime).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </Badge>
            )}
          </>
        )}
      </Group>
    </div>
  );
}
