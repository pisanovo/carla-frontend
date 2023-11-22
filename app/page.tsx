"use client";

import { Welcome } from '../components/Welcome/Welcome';
import { ColorSchemeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import {Overlay, Pill, Text} from '@mantine/core';
import { MapView } from '@/components/MapView/MapView'
import {
    AppShell,
    Card,
    Center,
    Chip,
    Container,
    Grid,
    Group, Loader,
    NativeSelect,
    rem,
    Space,
    Stack,
    Tabs
} from "@mantine/core";
import {HeaderIndex} from "@/components/Header/HeaderIndex";
import {FooterSocial} from "@/components/Footer/Footer";
import {Affix} from "@mantine/core";
import {
    IconCircleDashed,
    IconMessageCircle,
    IconNavigationCode,
    IconPhoto,
    IconSettings,
    IconX
} from "@tabler/icons-react";
import {Settings} from "@/components/Settings/Settings";
import {useState} from "react";

export default function HomePage() {
    const iconStyle = { width: rem(12), height: rem(12) };
  return (
    <>
        <AppShell
            header={{ height: 60 }}
        >
            <AppShell.Header>
                <HeaderIndex/>
            </AppShell.Header>
            <AppShell.Main>
                <Grid mt={30} mr={30} ml={30}>
                    <Grid.Col span={{base: 12, lg: 4}}>
                        <Card h="calc(100vh - 11rem)" padding="sm">
                            <Tabs defaultValue="settings">
                                <Tabs.List>
                                    <Tabs.Tab value="data" leftSection={<IconNavigationCode style={iconStyle} />}>
                                        Data
                                    </Tabs.Tab>
                                    <Tabs.Tab value="settings" leftSection={<IconSettings style={iconStyle} />}>
                                        Settings
                                    </Tabs.Tab>
                                </Tabs.List>

                                <Tabs.Panel value="data">
                                    <Space h="md"/>
                                    <Stack gap="0">
                                        <Center h="calc(100vh - 15rem)">
                                            <Stack gap="4">
                                                <Center>
                                                    <Loader size={40}/>
                                                </Center>
                                                <Text size="xs">Waiting for connection...</Text>
                                            </Stack>
                                        </Center>


                                    </Stack>

                                </Tabs.Panel>


                                <Tabs.Panel value="settings">
                                    <Space h="md"/>
                                    <Stack>
                                        <Settings/>
                                    </Stack>


                                </Tabs.Panel>
                            </Tabs>
                        </Card>
                    </Grid.Col>
                    <Grid.Col span={{base: 12, lg: 8}}>
                        <Card h={{base: "calc(100vh - 11rem)"}} mb={{base: 140, lg: 0}} padding="sm">
                            <Grid justify="center">
                                {/*<IconCircleDashed style={{ width: rem(14), height: rem(14) }} />*/}
                                <Overlay ml={90} mr={90} h={30} mt={18} zIndex={1} center={true} color="#000" backgroundOpacity={0.00} fixed={false}>
                                    <Pill size="sm"><Group gap="xs">Following ID 0</Group></Pill>
                                </Overlay>
                            </Grid>
                            <MapView />


                        </Card>
                    </Grid.Col>
                </Grid>
            </AppShell.Main>
            <AppShell.Footer>
                <Group justify="space-between" mb={15} mr={30} mt={15} ml={30}>
                    <Group>
                        <NativeSelect w={300} data={['Spatial-location cloaking [ŠTŠ+10]', 'Temporal cloaking []', 'Redundant dummy locations []', "Path confusion []"]} />
                    </Group>
                    <Group >
                        <Chip
                            icon={<IconX style={{ width: rem(16), height: rem(16) }} />}
                            color="red"
                            variant="filled"
                            size="xs"
                            defaultChecked
                        >
                            Status: Not connected to Carla
                        </Chip>
                    </Group>
                </Group>
                {/*IconNavigationCode*/}
            </AppShell.Footer>
        </AppShell>
    </>
  );
}
