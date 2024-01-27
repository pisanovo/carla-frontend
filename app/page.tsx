"use client";

import {ActionIcon, Affix, Button, Container, Flex, Overlay, Pill, Text} from '@mantine/core';
import { MapView } from '@/components/MapView/MapView'
import {
    AppShell,
    Card,
    Center,
    Chip,
    Grid,
    Group, Loader,
    NativeSelect,
    rem,
    Space,
    Stack,
    Tabs
} from "@mantine/core";
import {HeaderIndex} from "@/components/Header/HeaderIndex";
import {
    Icon123,
    IconAdjustments,
    IconNavigationCode,
    IconSettings,
    IconX
} from "@tabler/icons-react";
import {SettingsTab} from "@/components/SettingsTab/SettingsTab";
import {useRef, useState} from "react";
import {DataTab as LocationCloakingDataTab} from "@/components/Algorithms/LocationCloaking/DataTab/DataTab";
import {MapBar as LocationCloakingMapBar} from "@/components/Algorithms/LocationCloaking/MapBar/MapBar";
import RedundantDummyLocationsDataTab from "@/components/Algorithms/RedundantDummyLocations/DataTab";
import {REDUNDANT_DUMMY_LOCATIONS_ID} from '@/components/Algorithms/RedundantDummyLocations/config';
import { RedundantDummLocationsAlgorithmData } from '@/components/Algorithms/RedundantDummyLocations/types';

type CarlaSettings = {
    ip: string;
    port: number;
}


export default function HomePage() {
    const iconStyle = { width: rem(12), height: rem(12) };
    const [algorithm, setAlgorithm] = useState('');

    const [carlaSettings, setCarlaSettings] = useState<CarlaSettings>({ip: "127.0.0.1", port: 8200});
    const [locationCloakingSettings, setLocationCloakingSettings] = useState({});
    const [locationCloakingData, setLocationCloakingData] = useState({});
    const [temporalCloakingSettings, setTemporalCloakingSettings] = useState({});
    const [temporalCloakingData, setTemporalCloakingData] = useState({});
    const [showVehicleLabels, setShowVehicleLabels] = useState(false);
    const [redundantDummyLocationsData, setRedundantDummyLocationsData] =
        useState<RedundantDummLocationsAlgorithmData["data"]>({
            locationServerLogs: [],
            showLocationServerLogs: false,
            userMovementStorageDump: [],
            showUserMovementStorageDump: false,
            dummyStorageDump: [],
            showDummyStorageDump: false,
        })

    const algorithmData  = {
        locationCloakingSettings: {
            settings: locationCloakingSettings,
            setSettings: setLocationCloakingSettings,
            data: locationCloakingData,
            setData: setLocationCloakingData
        },
        temporalCloakingSettings: {
            settings: temporalCloakingSettings,
            setSettings: setTemporalCloakingSettings,
            data: temporalCloakingData,
            setData: setTemporalCloakingData
        },
        redundantDummyLocationsSettings: {
            data: redundantDummyLocationsData,
            setData: setRedundantDummyLocationsData,
        }
    };

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
                        <Card h="calc(100vh - 11.5rem)" padding="sm">
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
                                    {algorithm == "Spatial-location cloaking" &&
                                        <LocationCloakingDataTab
                                            carla_settings={carlaSettings}
                                            algo_data={algorithmData.locationCloakingSettings} />
                                    }
                                    {
                                        algorithm == REDUNDANT_DUMMY_LOCATIONS_ID &&
                                            <RedundantDummyLocationsDataTab
                                                algo_data={algorithmData.redundantDummyLocationsSettings} />
                                    }

                                </Tabs.Panel>

                                <Tabs.Panel value="settings">
                                    <Space h="md"/>
                                    <Stack>
                                        <SettingsTab carlaSettings={carlaSettings} setCarlaSettings={setCarlaSettings} algorithmData={algorithmData} />
                                    </Stack>
                                </Tabs.Panel>
                            </Tabs>
                        </Card>
                    </Grid.Col>
                    <Grid.Col span={{base: 12, lg: 8}}>
                        <Card h={{base: "calc(100vh - 11.5rem)"}} mb={{base: 140, lg: 0}} padding="sm">
                            <Overlay ml={90} mr={90} h={30} mt={19} zIndex={1} color="#000" backgroundOpacity={0.00} fixed={false}>
                                {algorithm == "Spatial-location cloaking" &&
                                    <LocationCloakingMapBar
                                        carla_settings={carlaSettings}
                                        algo_data={algorithmData.locationCloakingSettings}/>
                                }
                            </Overlay>

                                <Overlay ml={20} mr={90} mb={20} w={35} zIndex={1} fixed={false} color="#000"
                                         backgroundOpacity={0.00}
                                         styles={{
                                            root: { display: "flex", top: "calc(95%)" }
                                         }}
                                >
                                    <ActionIcon
                                        variant="default"
                                        color="gray"
                                        aria-label="Settings"
                                        onClick={(event) => setShowVehicleLabels(!showVehicleLabels)}
                                        styles={{
                                            root: { alignSelf: "flex-end" }
                                        }}
                                    >
                                        <Icon123 style={{ width: '70%', height: '70%' }} stroke={1.5} />
                                    </ActionIcon>
                                </Overlay>

                            <MapView algorithm={algorithm} algo={algorithmData} carlaSettings={carlaSettings} showLabels={showVehicleLabels} />
                        </Card>
                    </Grid.Col>
                </Grid>
            </AppShell.Main>
            <AppShell.Footer>
                <Group justify="space-between" mb={15} mr={30} mt={15} ml={30}>
                    <Group>
                        <NativeSelect
                            w={300}
                            value={algorithm}
                            onChange={(event)=> setAlgorithm(event.currentTarget.value)}
                            data={['Spatial-location cloaking', 'Temporal cloaking []', 'Redundant dummy locations []', "Path confusion []"]}
                        />
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
