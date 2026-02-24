import {
  AppShell,
  Group,
  NavLink,
  Text,
} from '@mantine/core';
import {
  IconLayoutDashboard,
  IconLogout,
  IconServer,
  IconSettings,
  IconUsers,
} from '@tabler/icons-react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminStatsQuery } from '@/features/admin/queries/admin-query';

export default function AdminLayout() {
  const location = useLocation();
  const { isError } = useAdminStatsQuery();

  // If the stats endpoint returns 403, this user isn't an admin
  if (isError) {
    return <Navigate to="/home" replace />;
  }

  const navItems = [
    {
      label: 'Dashboard',
      icon: <IconLayoutDashboard size={16} />,
      to: '/admin',
      exact: true,
    },
    {
      label: 'Users',
      icon: <IconUsers size={16} />,
      to: '/admin/users',
    },
    {
      label: 'System',
      icon: <IconSettings size={16} />,
      to: '/admin/system',
    },
  ];

  return (
    <AppShell
      navbar={{ width: 220, breakpoint: 'sm' }}
      padding="md"
    >
      <AppShell.Navbar p="xs">
        <Group mb="md" px="xs" pt="xs" gap="xs">
          <IconServer size={18} color="var(--mantine-color-blue-6)" />
          <Text fw={700} size="sm">
            Admin Console
          </Text>
        </Group>

        {navItems.map((item) => {
          const active = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              component={Link}
              to={item.to}
              label={item.label}
              leftSection={item.icon}
              active={active}
              variant="subtle"
              style={{ borderRadius: 6, marginBottom: 2 }}
            />
          );
        })}

        <NavLink
          component={Link}
          to="/home"
          label="Back to app"
          leftSection={<IconLogout size={16} />}
          variant="subtle"
          style={{ borderRadius: 6, marginTop: 'auto' }}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
