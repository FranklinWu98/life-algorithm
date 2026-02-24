import { userAtom } from '@/features/user/atoms/current-user-atom.ts';
import { updateUser } from '@/features/user/services/user-service.ts';
import { Group, Slider, Text } from '@mantine/core';
import { useDebouncedCallback } from '@mantine/hooks';
import { useAtom } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveSettingsRow,
  ResponsiveSettingsContent,
  ResponsiveSettingsControl,
} from '@/components/ui/responsive-settings-row';

const SCALE_MARKS = [
  { value: 75, label: '75%' },
  { value: 100, label: '100%' },
  { value: 125, label: '125%' },
  { value: 150, label: '150%' },
];

export default function EditorScalePref() {
  const { t } = useTranslation();
  const [user, setUser] = useAtom(userAtom);
  const currentScale = user.settings?.preferences?.editorScale ?? 100;
  const [localScale, setLocalScale] = useState(currentScale);

  const save = useDebouncedCallback(async (value: number) => {
    const updatedUser = await updateUser({ editorScale: value } as any);
    setUser(updatedUser);
  }, 400);

  const handleChange = (value: number) => {
    setLocalScale(value);
    save(value);
  };

  return (
    <ResponsiveSettingsRow>
      <ResponsiveSettingsContent>
        <Text size="md">{t('Editor scale')}</Text>
        <Text size="sm" c="dimmed">
          {t('Adjust the overall zoom level of the editor content.')}
        </Text>
      </ResponsiveSettingsContent>

      <ResponsiveSettingsControl>
        <Group gap="sm" align="center" wrap="nowrap" style={{ width: 220 }}>
          <Slider
            style={{ flex: 1 }}
            value={localScale}
            onChange={handleChange}
            min={75}
            max={150}
            step={5}
            marks={SCALE_MARKS}
            label={(v) => `${v}%`}
          />
        </Group>
      </ResponsiveSettingsControl>
    </ResponsiveSettingsRow>
  );
}
