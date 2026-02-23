import {
  ActionIcon,
  Badge,
  Button,
  Checkbox,
  Chip,
  Divider,
  Drawer,
  Group,
  Loader,
  Menu,
  Modal,
  Popover,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  IconAdjustments,
  IconArrowsSort,
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconEdit,
  IconEye,
  IconExternalLink,
  IconLayoutList,
  IconSearch,
  IconSortAscending,
  IconSortDescending,
  IconX,
} from '@tabler/icons-react';
import { atomWithStorage } from 'jotai/utils';
import { useAtom } from 'jotai';
import {
  useGetSpaceTasksQuery,
  projectKeys,
} from '@/features/project/queries/project-query';
import { useGetSpaceBySlugQuery } from '@/features/space/queries/space-query';
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  IMPORTANCE_LABELS,
  IMPORTANCE_COLORS,
} from '@/features/project/hooks/use-task-filters';
import type { IPage } from '@/features/page/types/page.types';
import type { TaskStatus, ImportantLevel } from '@/features/project/types/project.types';
import { updatePage } from '@/features/page/services/page-service';

// ── Persisted preferences ─────────────────────────────────────────────────────

type AllTasksTab = 'list' | 'calendar';
type PageOpenMode = 'page' | 'drawer' | 'modal';
type SortKey = 'title' | 'status' | 'importance' | 'timeToDoStart' | 'timeToDoEnd';

interface ColumnPrefs {
  showStatus: boolean;
  showPriority: boolean;
  showStart: boolean;
  showEnd: boolean;
  showSummary: boolean;
}

const allTasksTabAtom = atomWithStorage<AllTasksTab>('docmost:all-tasks-tab', 'list');
const pageOpenModeAtom = atomWithStorage<PageOpenMode>('docmost:page-open-mode', 'page');
const columnPrefsAtom = atomWithStorage<ColumnPrefs>('docmost:all-tasks-cols', {
  showStatus: true,
  showPriority: true,
  showStart: true,
  showEnd: true,
  showSummary: true,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function diffDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

function taskDurationDays(page: IPage): number | null {
  if (!page.timeToDoStart || !page.timeToDoEnd) return null;
  return diffDays(new Date(page.timeToDoEnd), new Date(page.timeToDoStart));
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

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

interface Summary {
  text: string;
  color: string;
  isWarning: boolean;
}

function getSummary(page: IPage): Summary | null {
  const now = new Date();
  const status = page.taskStatus ?? 'not_started';

  if (status === 'not_started') {
    if (!page.timeToDoStart) return null;
    const start = new Date(page.timeToDoStart);
    const msUntil = start.getTime() - now.getTime();
    if (msUntil < 0) {
      const daysLate = Math.ceil(-msUntil / 86_400_000);
      return { text: `${daysLate}d overdue to start`, color: 'red', isWarning: true };
    }
    if (msUntil < 86_400_000) {
      return { text: 'Starts today', color: 'orange', isWarning: false };
    }
    const daysUntil = Math.ceil(msUntil / 86_400_000);
    return {
      text: `Starts in ${daysUntil}d`,
      color: daysUntil <= 3 ? 'orange' : 'blue',
      isWarning: false,
    };
  }

  if (status === 'in_progress') {
    if (!page.timeToDoEnd) return null;
    const end = new Date(page.timeToDoEnd);
    const msLeft = end.getTime() - now.getTime();
    if (msLeft < 0) {
      const daysLate = Math.ceil(-msLeft / 86_400_000);
      return { text: `Overdue by ${daysLate}d`, color: 'red', isWarning: true };
    }
    if (msLeft < 86_400_000) {
      const hoursLeft = Math.max(0, Math.floor(msLeft / 3_600_000));
      return { text: `${hoursLeft}h left`, color: 'orange', isWarning: hoursLeft < 4 };
    }
    const daysLeft = Math.floor(msLeft / 86_400_000);
    return {
      text: `${daysLeft}d left`,
      color: daysLeft <= 2 ? 'orange' : 'teal',
      isWarning: false,
    };
  }

  return null;
}

const STATUS_OPTIONS = Object.entries(TASK_STATUS_LABELS).map(([v, label]) => ({ value: v, label }));
const IMPORTANCE_OPTIONS = Object.entries(IMPORTANCE_LABELS).map(([v, label]) => ({
  value: String(v),
  label,
}));

// ── Main view ─────────────────────────────────────────────────────────────────

export default function AllTasksView() {
  const { spaceSlug } = useParams<{ spaceSlug: string }>();
  const { data: space, isLoading: spaceLoading } = useGetSpaceBySlugQuery(spaceSlug);
  const { data: pages = [], isLoading: pagesLoading } = useGetSpaceTasksQuery(space?.id ?? '');
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useAtom(allTasksTabAtom);
  const [pageOpenMode, setPageOpenMode] = useAtom(pageOpenModeAtom);
  const [colPrefs, setColPrefs] = useAtom(columnPrefsAtom);

  // Filter state — default: in_progress + not_started
  const [search, setSearch] = useState('');
  const [statusFilters, setStatusFilters] = useState<string[]>(['in_progress', 'not_started']);
  const [importanceFilter, setImportanceFilter] = useState<string | null>(null);

  // Edit mode
  const [editMode, setEditMode] = useState(true);

  // Sort state (list view)
  const [sortKey, setSortKey] = useState<SortKey>('timeToDoStart');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Page open state
  const [openedPage, setOpenedPage] = useState<IPage | null>(null);

  const navigate = useNavigate();

  const updateTask = useMutation({
    mutationFn: (data: Partial<IPage> & { pageId: string }) => updatePage(data as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.spaceTasks(space?.id ?? '') }),
  });

  const handleOpenPage = (page: IPage) => {
    if (pageOpenMode === 'page') {
      navigate(`/s/${spaceSlug}/p/${page.slugId}`);
    } else {
      setOpenedPage(page);
    }
  };

  const toggleStatusFilter = (v: string) => {
    setStatusFilters((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );
  };

  // Filtered + sorted pages
  const filtered = useMemo(() => {
    let list = [...pages];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => (p.title ?? '').toLowerCase().includes(q));
    }
    if (statusFilters.length > 0) {
      list = list.filter((p) => statusFilters.includes(p.taskStatus ?? 'not_started'));
    }
    if (importanceFilter !== null) {
      list = list.filter((p) => String(p.importantLevel ?? 0) === importanceFilter);
    }
    return list;
  }, [pages, search, statusFilters, importanceFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'title': cmp = (a.title ?? '').localeCompare(b.title ?? ''); break;
        case 'status': cmp = (a.taskStatus ?? '').localeCompare(b.taskStatus ?? ''); break;
        case 'importance': cmp = (a.importantLevel ?? 0) - (b.importantLevel ?? 0); break;
        case 'timeToDoStart': cmp = (a.timeToDoStart ?? '').localeCompare(b.timeToDoStart ?? ''); break;
        case 'timeToDoEnd': cmp = (a.timeToDoEnd ?? '').localeCompare(b.timeToDoEnd ?? ''); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // Short-term: duration ≤ 7 days or no dates
  const shortTerm = useMemo(() =>
    sorted.filter((p) => {
      const dur = taskDurationDays(p);
      return dur === null || dur <= 7;
    }),
    [sorted],
  );

  const longTerm = useMemo(() =>
    sorted.filter((p) => {
      const dur = taskDurationDays(p);
      return dur !== null && dur > 7;
    }),
    [sorted],
  );

  const hasFilters = !!search || statusFilters.length > 0 || importanceFilter !== null;

  if (spaceLoading) {
    return <Group justify="center" mt="xl"><Loader size="sm" /></Group>;
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1300 }}>
      {/* Header */}
      <Group mb="md" justify="space-between" align="center">
        <Text fw={700} size="xl">All Tasks</Text>
        <Group gap="xs">
          {/* Edit / View mode toggle */}
          <Button
            size="xs"
            variant="default"
            leftSection={editMode ? <IconEye size={14} /> : <IconEdit size={14} />}
            onClick={() => setEditMode((v) => !v)}
          >
            {editMode ? 'View mode' : 'Edit mode'}
          </Button>

          {/* View options popover */}
          <Popover width={280} shadow="md" withArrow position="bottom-end">
            <Popover.Target>
              <Button size="xs" variant="default" leftSection={<IconAdjustments size={14} />}>
                Options
              </Button>
            </Popover.Target>
            <Popover.Dropdown>
              <Stack gap="sm">
                <Text size="xs" fw={600} c="dimmed">COLUMNS</Text>
                <Checkbox
                  size="xs"
                  label="Show status"
                  checked={colPrefs.showStatus}
                  onChange={(e) => setColPrefs({ ...colPrefs, showStatus: e.currentTarget.checked })}
                />
                <Checkbox
                  size="xs"
                  label="Show priority"
                  checked={colPrefs.showPriority}
                  onChange={(e) => setColPrefs({ ...colPrefs, showPriority: e.currentTarget.checked })}
                />
                <Checkbox
                  size="xs"
                  label="Show start date"
                  checked={colPrefs.showStart}
                  onChange={(e) => setColPrefs({ ...colPrefs, showStart: e.currentTarget.checked })}
                />
                <Checkbox
                  size="xs"
                  label="Show end date"
                  checked={colPrefs.showEnd}
                  onChange={(e) => setColPrefs({ ...colPrefs, showEnd: e.currentTarget.checked })}
                />
                <Checkbox
                  size="xs"
                  label="Show summary"
                  checked={colPrefs.showSummary}
                  onChange={(e) => setColPrefs({ ...colPrefs, showSummary: e.currentTarget.checked })}
                />
                <Divider />
                <Text size="xs" fw={600} c="dimmed">PAGE OPEN MODE</Text>
                <Select
                  size="xs"
                  value={pageOpenMode}
                  onChange={(v) => v && setPageOpenMode(v as PageOpenMode)}
                  data={[
                    { value: 'page', label: 'Full page (navigate)' },
                    { value: 'drawer', label: 'Right side drawer' },
                    { value: 'modal', label: 'Center floating window' },
                  ]}
                />
              </Stack>
            </Popover.Dropdown>
          </Popover>

          {/* View toggle */}
          <Button.Group>
            <Button
              size="xs"
              variant={activeTab === 'list' ? 'filled' : 'default'}
              leftSection={<IconLayoutList size={14} />}
              onClick={() => setActiveTab('list')}
            >
              List
            </Button>
            <Button
              size="xs"
              variant={activeTab === 'calendar' ? 'filled' : 'default'}
              leftSection={<IconCalendar size={14} />}
              onClick={() => setActiveTab('calendar')}
            >
              Calendar
            </Button>
          </Button.Group>
        </Group>
      </Group>

      {/* Filter bar */}
      <Group mb="md" gap="xs" wrap="wrap" align="center">
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
            checked={statusFilters.includes(v)}
            onChange={() => toggleStatusFilter(v)}
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
              onClick={() => { setSearch(''); setStatusFilters([]); setImportanceFilter(null); }}
            >
              <IconX size={12} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

      {pagesLoading ? (
        <Group justify="center" mt="xl"><Loader size="sm" /></Group>
      ) : activeTab === 'list' ? (
        <ListView
          shortTerm={shortTerm}
          longTerm={longTerm}
          spaceSlug={spaceSlug!}
          colPrefs={colPrefs}
          sortKey={sortKey}
          sortDir={sortDir}
          editMode={editMode}
          onSort={(key) => {
            if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
            else { setSortKey(key); setSortDir('asc'); }
          }}
          onUpdate={(pageId, data) => updateTask.mutate({ pageId, ...data } as any)}
          onOpenPage={handleOpenPage}
        />
      ) : (
        <GanttView
          pages={filtered}
          spaceSlug={spaceSlug!}
          onUpdate={(pageId, data) => updateTask.mutate({ pageId, ...data } as any)}
          onOpenPage={handleOpenPage}
        />
      )}

      {/* Page drawer */}
      <Drawer
        opened={pageOpenMode === 'drawer' && !!openedPage}
        onClose={() => setOpenedPage(null)}
        position="right"
        size="55%"
        title={openedPage ? (openedPage.icon ? `${openedPage.icon} ${openedPage.title || 'Untitled'}` : openedPage.title || 'Untitled') : ''}
        styles={{ body: { padding: 0 } }}
      >
        {openedPage && (
          <div style={{ padding: '16px 24px' }}>
            <Group mb="md">
              <Button
                size="xs"
                variant="default"
                leftSection={<IconExternalLink size={14} />}
                component={Link}
                to={`/s/${spaceSlug}/p/${openedPage.slugId}`}
              >
                Open full page
              </Button>
            </Group>
            <Text size="sm" c="dimmed">Click "Open full page" to view and edit this page.</Text>
          </div>
        )}
      </Drawer>

      {/* Page modal */}
      <Modal
        opened={pageOpenMode === 'modal' && !!openedPage}
        onClose={() => setOpenedPage(null)}
        size="xl"
        centered
        title={openedPage ? (openedPage.icon ? `${openedPage.icon} ${openedPage.title || 'Untitled'}` : openedPage.title || 'Untitled') : ''}
      >
        {openedPage && (
          <div>
            <Group mb="md">
              <Button
                size="xs"
                variant="default"
                leftSection={<IconExternalLink size={14} />}
                component={Link}
                to={`/s/${spaceSlug}/p/${openedPage.slugId}`}
              >
                Open full page
              </Button>
            </Group>
            <Text size="sm" c="dimmed">Click "Open full page" to view and edit this page.</Text>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ── List view ─────────────────────────────────────────────────────────────────

interface ListViewProps {
  shortTerm: IPage[];
  longTerm: IPage[];
  spaceSlug: string;
  colPrefs: ColumnPrefs;
  sortKey: SortKey;
  sortDir: 'asc' | 'desc';
  editMode: boolean;
  onSort: (key: SortKey) => void;
  onUpdate: (pageId: string, data: Partial<IPage>) => void;
  onOpenPage: (page: IPage) => void;
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: 'asc' | 'desc' }) {
  if (sortKey !== col) return <IconArrowsSort size={12} opacity={0.4} />;
  return sortDir === 'asc' ? <IconSortAscending size={12} /> : <IconSortDescending size={12} />;
}

function ListView({ shortTerm, longTerm, spaceSlug, colPrefs, sortKey, sortDir, editMode, onSort, onUpdate, onOpenPage }: ListViewProps) {
  if (shortTerm.length === 0 && longTerm.length === 0) {
    return (
      <Text c="dimmed" size="sm" mt="lg">
        No tasks found. Try adjusting the filters.
      </Text>
    );
  }

  const renderTable = (pages: IPage[], label: string) => {
    if (pages.length === 0) return null;
    return (
      <div style={{ marginBottom: 32 }}>
        <Text fw={600} size="sm" mb="xs" c="dimmed">{label} ({pages.length})</Text>
        <Table striped highlightOnHover style={{ tableLayout: 'fixed' }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: '28%' }}>
                <UnstyledButton onClick={() => onSort('title')}>
                  <Group gap={4} wrap="nowrap">
                    <Text size="xs">Title</Text>
                    <SortIcon col="title" sortKey={sortKey} sortDir={sortDir} />
                  </Group>
                </UnstyledButton>
              </Table.Th>
              {colPrefs.showStatus && (
                <Table.Th style={{ width: '12%' }}>
                  <UnstyledButton onClick={() => onSort('status')}>
                    <Group gap={4} wrap="nowrap">
                      <Text size="xs">Status</Text>
                      <SortIcon col="status" sortKey={sortKey} sortDir={sortDir} />
                    </Group>
                  </UnstyledButton>
                </Table.Th>
              )}
              {colPrefs.showPriority && (
                <Table.Th style={{ width: '11%' }}>
                  <UnstyledButton onClick={() => onSort('importance')}>
                    <Group gap={4} wrap="nowrap">
                      <Text size="xs">Priority</Text>
                      <SortIcon col="importance" sortKey={sortKey} sortDir={sortDir} />
                    </Group>
                  </UnstyledButton>
                </Table.Th>
              )}
              {colPrefs.showStart && (
                <Table.Th style={{ width: '15%' }}>
                  <UnstyledButton onClick={() => onSort('timeToDoStart')}>
                    <Group gap={4} wrap="nowrap">
                      <Text size="xs">Start</Text>
                      <SortIcon col="timeToDoStart" sortKey={sortKey} sortDir={sortDir} />
                    </Group>
                  </UnstyledButton>
                </Table.Th>
              )}
              {colPrefs.showEnd && (
                <Table.Th style={{ width: '15%' }}>
                  <UnstyledButton onClick={() => onSort('timeToDoEnd')}>
                    <Group gap={4} wrap="nowrap">
                      <Text size="xs">End</Text>
                      <SortIcon col="timeToDoEnd" sortKey={sortKey} sortDir={sortDir} />
                    </Group>
                  </UnstyledButton>
                </Table.Th>
              )}
              {colPrefs.showSummary && (
                <Table.Th style={{ width: '14%' }}>
                  <Text size="xs">Summary</Text>
                </Table.Th>
              )}
              <Table.Th style={{ width: '5%' }} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {pages.map((page) => (
              <ListTaskRow
                key={page.id}
                page={page}
                spaceSlug={spaceSlug}
                colPrefs={colPrefs}
                editMode={editMode}
                onUpdate={(data) => onUpdate(page.id, data)}
                onOpenPage={() => onOpenPage(page)}
              />
            ))}
          </Table.Tbody>
        </Table>
      </div>
    );
  };

  return (
    <div>
      {renderTable(shortTerm, 'Short term')}
      {renderTable(longTerm, 'Long term')}
    </div>
  );
}

interface ListTaskRowProps {
  page: IPage;
  spaceSlug: string;
  colPrefs: ColumnPrefs;
  editMode: boolean;
  onUpdate: (data: Partial<IPage>) => void;
  onOpenPage: () => void;
}

function ListTaskRow({ page, spaceSlug, colPrefs, editMode, onUpdate, onOpenPage }: ListTaskRowProps) {
  const statusColor = TASK_STATUS_COLORS[page.taskStatus ?? 'not_started'] ?? 'gray';
  const priorityColor = IMPORTANCE_COLORS[page.importantLevel ?? 0] ?? 'gray';
  const summary = getSummary(page);

  return (
    <Table.Tr>
      <Table.Td>
        <UnstyledButton
          onClick={onOpenPage}
          style={{ fontWeight: 500, color: 'inherit', fontSize: 'var(--mantine-font-size-sm)' }}
        >
          {page.icon ? `${page.icon} ` : ''}{page.title || 'Untitled'}
        </UnstyledButton>
      </Table.Td>

      {colPrefs.showStatus && (
        <Table.Td>
          {editMode ? (
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
          ) : (
            <Badge size="xs" color={statusColor} variant="light">
              {TASK_STATUS_LABELS[page.taskStatus ?? 'not_started'] ?? page.taskStatus}
            </Badge>
          )}
        </Table.Td>
      )}

      {colPrefs.showPriority && (
        <Table.Td>
          {editMode ? (
            <Select
              size="xs"
              value={String(page.importantLevel ?? 0)}
              onChange={(val) => { if (val !== null) onUpdate({ importantLevel: Number(val) as ImportantLevel }); }}
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
          ) : (
            <Badge size="xs" color={priorityColor} variant="dot">
              {IMPORTANCE_LABELS[page.importantLevel ?? 0] ?? '—'}
            </Badge>
          )}
        </Table.Td>
      )}

      {colPrefs.showStart && (
        <Table.Td>
          {editMode ? (
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
          ) : (
            <Text size="xs" c={page.timeToDoStart ? undefined : 'dimmed'}>
              {formatDate(page.timeToDoStart)}
            </Text>
          )}
        </Table.Td>
      )}

      {colPrefs.showEnd && (
        <Table.Td>
          {editMode ? (
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
          ) : (
            <Text size="xs" c={page.timeToDoEnd ? undefined : 'dimmed'}>
              {formatDate(page.timeToDoEnd)}
            </Text>
          )}
        </Table.Td>
      )}

      {colPrefs.showSummary && (
        <Table.Td>
          {summary ? (
            <Text
              size="xs"
              c={summary.color}
              fw={summary.isWarning ? 600 : undefined}
            >
              {summary.isWarning ? '⚠ ' : ''}{summary.text}
            </Text>
          ) : (
            <Text size="xs" c="dimmed">—</Text>
          )}
        </Table.Td>
      )}

      <Table.Td>
        <Group gap={4} justify="flex-end">
          <Tooltip label="Open page" withArrow>
            <ActionIcon variant="subtle" size="xs" component={Link} to={`/s/${spaceSlug}/p/${page.slugId}`}>
              <IconExternalLink size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}

// ── Gantt / Calendar view ─────────────────────────────────────────────────────

interface GanttViewProps {
  pages: IPage[];
  spaceSlug: string;
  onUpdate: (pageId: string, data: Partial<IPage>) => void;
  onOpenPage: (page: IPage) => void;
}

function GanttView({ pages, spaceSlug, onUpdate, onOpenPage }: GanttViewProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [rangeStart, setRangeStart] = useState<Date>(() => {
    const d = new Date(today);
    d.setDate(1);
    return d;
  });
  const rangeDays = 30;

  const timelineRef = useRef<HTMLDivElement>(null);
  // Local optimistic date overrides during drag
  const localDatesRef = useRef<Record<string, { start?: string; end?: string }>>({});
  const [, forceRender] = useState(0);

  const pagesWithDates = pages.filter((p) => p.timeToDoStart || p.timeToDoEnd);
  const pagesWithoutDates = pages.filter((p) => !p.timeToDoStart && !p.timeToDoEnd);

  const navigateMonth = (delta: number) => {
    setRangeStart((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + delta);
      return d;
    });
  };

  // Build day headers
  const dayHeaders: Date[] = [];
  for (let i = 0; i < rangeDays; i++) {
    dayHeaders.push(addDays(rangeStart, i));
  }

  const getBarStyle = (page: IPage): { left: string; width: string } | null => {
    const local = localDatesRef.current[page.id] ?? {};
    const startStr = local.start ?? page.timeToDoStart;
    const endStr = local.end ?? page.timeToDoEnd;
    if (!startStr && !endStr) return null;

    const start = startStr ? new Date(startStr) : new Date(endStr!);
    const end = endStr ? new Date(endStr) : new Date(startStr!);

    const leftDays = Math.max(0, diffDays(start, rangeStart));
    const endDays = Math.min(rangeDays, diffDays(end, rangeStart) + 1);
    const widthDays = Math.max(1, endDays - leftDays);

    if (leftDays >= rangeDays || endDays <= 0) return null;

    return {
      left: `${(leftDays / rangeDays) * 100}%`,
      width: `${(widthDays / rangeDays) * 100}%`,
    };
  };

  const startDrag = (
    e: React.MouseEvent,
    page: IPage,
    side: 'left' | 'right' | 'move',
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const container = timelineRef.current;
    if (!container) return;

    const startX = e.clientX;
    const { width: containerWidth } = container.getBoundingClientRect();
    const pxPerDay = containerWidth / rangeDays;

    const local = localDatesRef.current[page.id] ?? {};
    const origStartStr = local.start ?? page.timeToDoStart;
    const origEndStr = local.end ?? page.timeToDoEnd;
    const origStart = origStartStr ? new Date(origStartStr) : null;
    const origEnd = origEndStr ? new Date(origEndStr) : null;

    const onMove = (me: MouseEvent) => {
      const deltaDays = Math.round((me.clientX - startX) / pxPerDay);
      const update: { start?: string; end?: string } = {};

      if (side === 'left' && origStart) {
        const ns = addDays(origStart, deltaDays);
        if (!origEnd || ns < origEnd) update.start = ns.toISOString();
      } else if (side === 'right' && origEnd) {
        const ne = addDays(origEnd, deltaDays);
        if (!origStart || ne > origStart) update.end = ne.toISOString();
      } else if (side === 'move') {
        if (origStart) update.start = addDays(origStart, deltaDays).toISOString();
        if (origEnd) update.end = addDays(origEnd, deltaDays).toISOString();
      }

      localDatesRef.current = { ...localDatesRef.current, [page.id]: update };
      forceRender((n) => n + 1);
    };

    const onUp = () => {
      const saved = localDatesRef.current[page.id] ?? {};
      if (saved.start !== undefined || saved.end !== undefined) {
        onUpdate(page.id, {
          timeToDoStart: saved.start !== undefined ? saved.start : page.timeToDoStart,
          timeToDoEnd: saved.end !== undefined ? saved.end : page.timeToDoEnd,
        });
      }
      const next = { ...localDatesRef.current };
      delete next[page.id];
      localDatesRef.current = next;
      forceRender((n) => n + 1);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const statusColors = ['not_started', 'in_progress', 'completed', 'cancelled'].reduce<Record<string, string>>(
    (acc, s) => ({ ...acc, [s]: TASK_STATUS_COLORS[s] ?? 'gray' }),
    {},
  );

  // Find "today" column
  const todayOffset = diffDays(today, rangeStart);
  const todayInRange = todayOffset >= 0 && todayOffset < rangeDays;

  const monthLabel = rangeStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div>
      {/* Timeline navigation */}
      <Group mb="sm" gap="xs" align="center">
        <ActionIcon variant="default" size="sm" onClick={() => navigateMonth(-1)}>
          <IconChevronLeft size={14} />
        </ActionIcon>
        <Text size="sm" fw={500} w={160} ta="center">{monthLabel}</Text>
        <ActionIcon variant="default" size="sm" onClick={() => navigateMonth(1)}>
          <IconChevronRight size={14} />
        </ActionIcon>
        <Button size="xs" variant="subtle" onClick={() => {
          const d = new Date(today);
          d.setDate(1);
          setRangeStart(d);
        }}>
          Today
        </Button>
      </Group>

      {/* Gantt table */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 800 }}>
          {/* Header row: day numbers */}
          <div style={{ display: 'flex' }}>
            <div style={{ width: 200, flexShrink: 0, borderBottom: '1px solid var(--mantine-color-default-border)', paddingBottom: 4 }}>
              <Text size="xs" c="dimmed" px="xs">Task</Text>
            </div>
            <div
              ref={timelineRef}
              style={{
                flex: 1,
                display: 'flex',
                borderBottom: '1px solid var(--mantine-color-default-border)',
                position: 'relative',
              }}
            >
              {dayHeaders.map((day, i) => {
                const isToday = todayInRange && i === todayOffset;
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      borderLeft: '1px solid var(--mantine-color-default-border)',
                      paddingBottom: 4,
                      textAlign: 'center',
                      background: isToday
                        ? 'var(--mantine-color-blue-0)'
                        : isWeekend
                        ? 'var(--mantine-color-gray-0)'
                        : undefined,
                    }}
                  >
                    <Text size="xs" c={isToday ? 'blue' : isWeekend ? 'dimmed' : undefined} fw={isToday ? 700 : undefined}>
                      {day.getDate()}
                    </Text>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Task rows */}
          {pagesWithDates.length === 0 && pagesWithoutDates.length === 0 && (
            <Text c="dimmed" size="sm" mt="md">No tasks match the current filter.</Text>
          )}

          {pagesWithDates.map((page) => {
            const barStyle = getBarStyle(page);
            const color = statusColors[page.taskStatus ?? 'not_started'] ?? 'gray';

            return (
              <div key={page.id} style={{ display: 'flex', alignItems: 'center', height: 36, borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                {/* Task name */}
                <div style={{ width: 200, flexShrink: 0, paddingInline: 8, overflow: 'hidden' }}>
                  <UnstyledButton
                    onClick={() => onOpenPage(page)}
                    style={{ fontSize: 12, color: 'inherit', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '100%' }}
                  >
                    {page.icon ? `${page.icon} ` : ''}{page.title || 'Untitled'}
                  </UnstyledButton>
                </div>

                {/* Timeline bar */}
                <div style={{ flex: 1, position: 'relative', height: '100%' }}>
                  {/* Weekend shading */}
                  {dayHeaders.map((day, i) => {
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    const isToday2 = todayInRange && i === todayOffset;
                    if (!isWeekend && !isToday2) return null;
                    return (
                      <div
                        key={i}
                        style={{
                          position: 'absolute',
                          left: `${(i / rangeDays) * 100}%`,
                          width: `${(1 / rangeDays) * 100}%`,
                          top: 0,
                          bottom: 0,
                          background: isToday2
                            ? 'var(--mantine-color-blue-0)'
                            : 'var(--mantine-color-gray-0)',
                          pointerEvents: 'none',
                        }}
                      />
                    );
                  })}

                  {barStyle && (
                    <div
                      style={{
                        position: 'absolute',
                        left: barStyle.left,
                        width: barStyle.width,
                        top: '20%',
                        height: '60%',
                        background: `var(--mantine-color-${color}-5)`,
                        borderRadius: 4,
                        cursor: 'grab',
                        display: 'flex',
                        alignItems: 'center',
                        overflow: 'hidden',
                        minWidth: 6,
                        userSelect: 'none',
                      }}
                      onMouseDown={(e) => startDrag(e, page, 'move')}
                    >
                      {/* Left resize handle */}
                      <div
                        style={{
                          width: 6,
                          height: '100%',
                          cursor: 'ew-resize',
                          background: `var(--mantine-color-${color}-7)`,
                          flexShrink: 0,
                        }}
                        onMouseDown={(e) => startDrag(e, page, 'left')}
                      />
                      {/* Task title inside bar */}
                      <Text
                        size="xs"
                        c="white"
                        px={4}
                        style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}
                      >
                        {page.title || 'Untitled'}
                      </Text>
                      {/* Right resize handle */}
                      <div
                        style={{
                          width: 6,
                          height: '100%',
                          cursor: 'ew-resize',
                          background: `var(--mantine-color-${color}-7)`,
                          flexShrink: 0,
                        }}
                        onMouseDown={(e) => startDrag(e, page, 'right')}
                      />
                    </div>
                  )}

                  {/* Day grid lines */}
                  {dayHeaders.map((_, i) => (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        left: `${(i / rangeDays) * 100}%`,
                        top: 0,
                        bottom: 0,
                        borderLeft: '1px solid var(--mantine-color-default-border)',
                        pointerEvents: 'none',
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Tasks without dates */}
          {pagesWithoutDates.length > 0 && (
            <>
              <Text size="xs" c="dimmed" mt="md" mb="xs" fw={500}>Tasks without dates</Text>
              {pagesWithoutDates.map((page) => (
                <div key={page.id} style={{ display: 'flex', alignItems: 'center', height: 32, borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                  <div style={{ width: 200, flexShrink: 0, paddingInline: 8 }}>
                    <UnstyledButton
                      onClick={() => onOpenPage(page)}
                      style={{ fontSize: 12, color: 'inherit', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '100%' }}
                    >
                      {page.icon ? `${page.icon} ` : ''}{page.title || 'Untitled'}
                    </UnstyledButton>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text size="xs" c="dimmed" px="xs">No dates set</Text>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
