import {
  Avatar,
  Badge,
  Button,
  Group,
  Loader,
  Modal,
  Pagination,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useState, useMemo } from 'react';
import {
  useAdminUsersQuery,
  useAdminUserQuery,
  useSetUserDeactivatedMutation,
  useUpdateAdminUserMutation,
} from '@/features/admin/queries/admin-query';
import type { AdminUser } from '@/features/admin/services/admin-service';

// ─── User Row ────────────────────────────────────────────────────────────────

function UserRow({
  user,
  onView,
}: {
  user: AdminUser;
  onView: (id: string) => void;
}) {
  const deactivate = useSetUserDeactivatedMutation();
  const isDeactivated = !!user.deactivatedAt;

  return (
    <Table.Tr opacity={isDeactivated ? 0.55 : 1}>
      <Table.Td>
        <Group gap="sm" wrap="nowrap">
          <Avatar src={user.avatarUrl} size={32} radius="xl" color="blue">
            {(user.name ?? user.email)[0].toUpperCase()}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <Text
              size="sm"
              fw={500}
              style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {user.name ?? '(no name)'}
            </Text>
            <Text size="xs" c="dimmed">
              {user.email}
            </Text>
          </div>
        </Group>
      </Table.Td>
      <Table.Td>
        <Text size="xs" c="dimmed">
          {user.workspaceName ?? '—'}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="xs" c="dimmed">
          {user.role ?? '—'}
        </Text>
      </Table.Td>
      <Table.Td>
        <Badge variant="light" color={isDeactivated ? 'red' : 'green'} size="sm">
          {isDeactivated ? 'Deactivated' : 'Active'}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="xs" c="dimmed">
          {user.lastLoginAt
            ? new Date(user.lastLoginAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'Never'}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="xs" c="dimmed">
          {new Date(user.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <Button size="xs" variant="subtle" onClick={() => onView(user.id)}>
            View
          </Button>
          <Button
            size="xs"
            variant="subtle"
            color={isDeactivated ? 'green' : 'red'}
            loading={deactivate.isPending}
            onClick={() =>
              deactivate.mutate({ userId: user.id, deactivate: !isDeactivated })
            }
          >
            {isDeactivated ? 'Reactivate' : 'Deactivate'}
          </Button>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}

// ─── User Detail Modal ────────────────────────────────────────────────────────

function UserDetailModal({
  userId,
  onClose,
}: {
  userId: string | null;
  onClose: () => void;
}) {
  const { data: user, isLoading } = useAdminUserQuery(userId);
  const updateUser = useUpdateAdminUserMutation();
  const deactivate = useSetUserDeactivatedMutation();

  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editing, setEditing] = useState(false);

  const isDeactivated = !!user?.deactivatedAt;

  function startEdit() {
    setEditName(user?.name ?? '');
    setEditEmail(user?.email ?? '');
    setEditRole(user?.role ?? '');
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  function saveEdit() {
    if (!userId) return;
    updateUser.mutate(
      { userId, data: { name: editName, email: editEmail, role: editRole } },
      { onSuccess: () => setEditing(false) },
    );
  }

  return (
    <Modal
      opened={!!userId}
      onClose={onClose}
      title="User Details"
      size="md"
    >
      {isLoading || !user ? (
        <Group justify="center" py="lg">
          <Loader size="sm" />
        </Group>
      ) : (
        <Stack gap="md">
          <Group gap="md">
            <Avatar src={user.avatarUrl} size={56} radius="xl" color="blue">
              {(user.name ?? user.email)[0].toUpperCase()}
            </Avatar>
            <div>
              <Text fw={600}>{user.name ?? '(no name)'}</Text>
              <Text size="sm" c="dimmed">{user.email}</Text>
              <Badge
                variant="light"
                color={isDeactivated ? 'red' : 'green'}
                size="xs"
                mt={4}
              >
                {isDeactivated ? 'Deactivated' : 'Active'}
              </Badge>
            </div>
          </Group>

          {editing ? (
            <Stack gap="sm">
              <TextInput
                label="Name"
                value={editName}
                onChange={(e) => setEditName(e.currentTarget.value)}
              />
              <TextInput
                label="Email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.currentTarget.value)}
              />
              <Select
                label="Role"
                value={editRole}
                onChange={(v) => setEditRole(v ?? '')}
                data={[
                  { value: 'owner', label: 'Owner' },
                  { value: 'admin', label: 'Admin' },
                  { value: 'member', label: 'Member' },
                  { value: 'guest', label: 'Guest' },
                ]}
              />
              <Group justify="flex-end" gap="xs">
                <Button variant="subtle" size="xs" onClick={cancelEdit}>
                  Cancel
                </Button>
                <Button
                  size="xs"
                  loading={updateUser.isPending}
                  onClick={saveEdit}
                >
                  Save
                </Button>
              </Group>
            </Stack>
          ) : (
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Workspace</Text>
                <Text size="sm">{user.workspaceName ?? '—'}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Role</Text>
                <Text size="sm">{user.role ?? '—'}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Last login</Text>
                <Text size="sm">
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Never'}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Joined</Text>
                <Text size="sm">
                  {new Date(user.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </Group>

              <Group justify="flex-end" gap="xs" mt="sm">
                <Button
                  size="xs"
                  variant="subtle"
                  color={isDeactivated ? 'green' : 'red'}
                  loading={deactivate.isPending}
                  onClick={() =>
                    deactivate.mutate(
                      { userId: user.id, deactivate: !isDeactivated },
                      { onSuccess: onClose },
                    )
                  }
                >
                  {isDeactivated ? 'Reactivate' : 'Deactivate'}
                </Button>
                <Button size="xs" onClick={startEdit}>
                  Edit
                </Button>
              </Group>
            </Stack>
          )}
        </Stack>
      )}
    </Modal>
  );
}

// ─── Admin Users Page ─────────────────────────────────────────────────────────

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { data, isLoading } = useAdminUsersQuery(page);

  const filtered = useMemo(() => {
    if (!search.trim() || !data?.data) return data?.data ?? [];
    const q = search.toLowerCase();
    return data.data.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.name?.toLowerCase() ?? '').includes(q),
    );
  }, [data?.data, search]);

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <>
      <UserDetailModal
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />

      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={3}>Users</Title>
          <Text size="sm" c="dimmed">
            {data ? `${data.total} total` : ''}
          </Text>
        </Group>

        <TextInput
          placeholder="Search by name or email…"
          leftSection={<IconSearch size={14} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          w={280}
        />

        {isLoading ? (
          <Loader />
        ) : (
          <>
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>User</Table.Th>
                  <Table.Th>Workspace</Table.Th>
                  <Table.Th>Role</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Last login</Table.Th>
                  <Table.Th>Joined</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtered.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={7}>
                      <Text size="sm" c="dimmed" ta="center" py="md">
                        No users found
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  filtered.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      onView={setSelectedUserId}
                    />
                  ))
                )}
              </Table.Tbody>
            </Table>

            {totalPages > 1 && (
              <Group justify="center">
                <Pagination value={page} onChange={setPage} total={totalPages} />
              </Group>
            )}
          </>
        )}
      </Stack>
    </>
  );
}
