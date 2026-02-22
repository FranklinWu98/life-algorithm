import { Box, Group, Loader, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconFolder, IconTarget } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useGetDomainsQuery, useGetMissionsQuery } from '@/features/project/queries/project-query';
import { IDomain } from '@/features/project/types/project.types';
import { MISSION_STATUS_COLORS } from '@/features/project/hooks/use-task-filters';

function DomainCard({ domain }: { domain: IDomain }) {
  const { data: missions = [] } = useGetMissionsQuery(domain.id);
  const dotColor = domain.color ?? '#868e96';

  return (
    <Box
      p="md"
      style={{
        border: '1px solid var(--mantine-color-gray-3)',
        borderRadius: 'var(--mantine-radius-md)',
      }}
    >
      <Group gap="xs" mb="sm">
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: dotColor,
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        <Title order={5}>{domain.name}</Title>
      </Group>

      {domain.description && (
        <Text size="xs" c="dimmed" mb="sm">
          {domain.description}
        </Text>
      )}

      <Stack gap={4}>
        {missions.length === 0 && (
          <Text size="xs" c="dimmed">
            No missions yet
          </Text>
        )}
        {missions.map((m) => (
          <Link
            key={m.id}
            to={`/project/d/${domain.id}/m/${m.id}`}
            style={{ textDecoration: 'none' }}
          >
            <Group gap="xs">
              <IconTarget
                size={12}
                color={`var(--mantine-color-${MISSION_STATUS_COLORS[m.status] ?? 'gray'}-5)`}
              />
              <Text size="xs" c="dark">
                {m.name}
              </Text>
            </Group>
          </Link>
        ))}
      </Stack>
    </Box>
  );
}

export default function ProjectHomePage() {
  const { data: domains = [], isLoading } = useGetDomainsQuery();

  if (isLoading) {
    return (
      <Box p="xl" ta="center">
        <Loader size="sm" />
      </Box>
    );
  }

  if (domains.length === 0) {
    return (
      <Box p="xl" ta="center">
        <IconFolder size={48} color="var(--mantine-color-gray-4)" />
        <Text mt="md" c="dimmed">
          No domains yet. Use the sidebar to create your first domain.
        </Text>
      </Box>
    );
  }

  return (
    <Box p="xl">
      <Title order={3} mb="lg">
        Project Manager
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
        {domains.map((d) => (
          <DomainCard key={d.id} domain={d} />
        ))}
      </SimpleGrid>
    </Box>
  );
}
