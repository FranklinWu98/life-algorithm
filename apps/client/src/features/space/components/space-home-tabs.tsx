import { Container, Space, Tabs, Text } from "@mantine/core";
import { IconClockHour3, IconLayoutGrid, IconList } from "@tabler/icons-react";
import RecentChanges from "@/components/common/recent-changes.tsx";
import { useParams } from "react-router-dom";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query.ts";
import { useTranslation } from "react-i18next";
import AllTasksView from "@/pages/project/all-tasks.tsx";
import ProjectsGalleryView from "@/pages/project/projects-gallery.tsx";

export default function SpaceHomeTabs() {
  const { t } = useTranslation();
  const { spaceSlug } = useParams();
  const { data: space } = useGetSpaceBySlugQuery(spaceSlug);

  return (
    <Tabs defaultValue="all-tasks">
      <Container size={800} pt="xl">
        <Tabs.List>
          <Tabs.Tab value="all-tasks" leftSection={<IconList size={16} />}>
            <Text size="sm" fw={500}>All Tasks</Text>
          </Tabs.Tab>
          <Tabs.Tab value="domains" leftSection={<IconLayoutGrid size={16} />}>
            <Text size="sm" fw={500}>Domains</Text>
          </Tabs.Tab>
          <Tabs.Tab value="recent" leftSection={<IconClockHour3 size={16} />}>
            <Text size="sm" fw={500}>{t("Recently updated")}</Text>
          </Tabs.Tab>
        </Tabs.List>
      </Container>

      <Tabs.Panel value="all-tasks">
        <AllTasksView />
      </Tabs.Panel>

      <Tabs.Panel value="domains">
        <ProjectsGalleryView />
      </Tabs.Panel>

      <Tabs.Panel value="recent">
        <Container size={800}>
          <Space my="md" />
          {space?.id && <RecentChanges spaceId={space.id} />}
        </Container>
      </Tabs.Panel>
    </Tabs>
  );
}
