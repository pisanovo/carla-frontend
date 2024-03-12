import {useContext} from "react";
import {AlgorithmDataContext} from "@/contexts/AlgorithmDataContext";
import {
    ActionIcon,
    AppShell,
    Card,
    Chip,
    Grid,
    Group,
    NativeSelect,
    Overlay,
    rem,
    Space,
    Stack,
    Tabs
} from "@mantine/core";
import {HeaderIndex} from "@/components/Header/HeaderIndex";
import {Icon123, IconNavigationCode, IconSettings, IconX} from "@tabler/icons-react";
import LocationCloakingDataTab from "@/components/Algorithms/LocationCloaking/DataTab";
import TemporalCloakingDataTab from "@/components/Algorithms/TemporalCloaking/DataTab";
import {REDUNDANT_DUMMY_LOCATIONS_ID} from "@/components/Algorithms/RedundantDummyLocations/config";
import RedundantDummyLocationsDataTab from "@/components/Algorithms/RedundantDummyLocations/DataTab";
import {SettingsTab} from "@/components/SettingsTab/SettingsTab";
import {MapView} from "@/components/MapView/MapView";
import {LOCATION_CLOAKING_ID} from "@/components/Algorithms/LocationCloaking/config";
import {TEMPORAL_CLOAKING_ID} from "@/components/Algorithms/TemporalCloaking/config";

export function Root() {
    const { settings } = useContext(AlgorithmDataContext);
    const iconStyle = { width: rem(12), height: rem(12) };
    return (
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
                                    {
                                        settings.selectedAlgorithm == LOCATION_CLOAKING_ID &&
                                        <LocationCloakingDataTab />
                                    }
                                    {
                                        settings.selectedAlgorithm == TEMPORAL_CLOAKING_ID &&
                                        <TemporalCloakingDataTab />
                                    }
                                    {
                                        settings.selectedAlgorithm == REDUNDANT_DUMMY_LOCATIONS_ID &&
                                        <RedundantDummyLocationsDataTab />
                                    }

                                </Tabs.Panel>

                                <Tabs.Panel value="settings">
                                    <Space h="md"/>
                                    <Stack>
                                        <SettingsTab />
                                    </Stack>
                                </Tabs.Panel>
                            </Tabs>
                        </Card>
                    </Grid.Col>
                    <Grid.Col span={{base: 12, lg: 8}}>
                        <Card h={{base: "calc(100vh - 11.5rem)"}} mb={{base: 140, lg: 0}} padding="sm">
                            <Overlay ml={90} mr={90} h={30} mt={19} zIndex={1} color="#000" backgroundOpacity={0.00} fixed={false}>
                                 {/*Per Algorithm MapBar if needed*/}
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
                                    onClick={(event) =>
                                        settings.setShowAgentIDLabels(!settings.showAgentIDLabels)}
                                    styles={{
                                        root: { alignSelf: "flex-end" }
                                    }}
                                >
                                    <Icon123 style={{ width: '70%', height: '70%' }} stroke={1.5} />
                                </ActionIcon>
                            </Overlay>

                            <MapView />
                        </Card>
                    </Grid.Col>
                </Grid>
            </AppShell.Main>
            <AppShell.Footer>
                <Group justify="space-between" mb={15} mr={30} mt={15} ml={30}>
                    <Group>
                        <NativeSelect
                            w={360}
                            value={"Algorithm: " + settings.selectedAlgorithm}
                            onChange={(event) =>
                                settings.setSelectedAlgorithm(event.currentTarget.value.split(":")[1].trim())}
                            data={[
                                "Algorithm: " + LOCATION_CLOAKING_ID,
                                "Algorithm: " + TEMPORAL_CLOAKING_ID,
                                "Algorithm: " + REDUNDANT_DUMMY_LOCATIONS_ID,
                                "Algorithm: " + "Path confusion []"
                            ]}
                        />
                    </Group>
                    <Group >
                        <Chip
                            icon={<IconX style={{ width: rem(16), height: rem(16) }} />}
                            color="red"
                            variant="filled"
                            size="xs"
                            checked={false}
                            onChange={(c) => null}
                        >
                            Data Intensive Computing WS 23/24
                        </Chip>
                    </Group>
                </Group>
                {/*IconNavigationCode*/}
            </AppShell.Footer>
        </AppShell>
    );
}
