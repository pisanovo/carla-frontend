'use client';

import {
  Group,
  Container,
  ActionIcon,
  useComputedColorScheme, useMantineColorScheme, Space, rem, Kbd,
} from '@mantine/core';
import {IconCar, IconLocationFilled, IconMapCog, IconMoon, IconSun} from '@tabler/icons-react';
import { MantineLogo, DiscordIcon } from '@mantine/ds';
import cx from 'clsx';
import classes from './HeaderIndex.module.css';

export function HeaderIndex() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('dark', { getInitialValueInEffect: true });

  return (
    <header className={classes.header}>
      <Container size="xl" px="sm">
        <div className={classes.inner}>
          <Group gap="sm">
            <Group mb={4}>
              <IconMapCog style={{ width: rem(32), height: rem(32) }} stroke={1.5}/>
            </Group>
            <Kbd mt={0}>Visualization Tool</Kbd>
          </Group>


          <Group gap={10}>
            <ActionIcon
              onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
              variant="default"
              size="lg"
              radius="md"
              aria-label="Toggle color scheme"
            >
              <IconSun className={cx(classes.icon, classes.light)} stroke={1.5} />
              <IconMoon className={cx(classes.icon, classes.dark)} stroke={1.5} />
            </ActionIcon>
          </Group>
        </div>
      </Container>
    </header>
  );
}
