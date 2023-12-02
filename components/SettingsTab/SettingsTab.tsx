import {Card, Group, Input, NumberInput, ScrollArea, Stack, Switch, Text} from '@mantine/core';
import classes from './SettingsTab.module.css';
import {Settings as LocationCloakingSettings} from '../Algorithms/LocationCloaking/Settings/Settings';
import {Settings as TemporalCloakingSettings} from '../Algorithms/TemporalCloaking/Settings/Settings';

export type AlgorithmSettings = {
    settings: any,
    setSettings: (arg0: object) => void
}

export function SettingsTab(props: any) {
    return (
        <ScrollArea  scrollbarSize={4} h="calc(100vh - 16rem)" type="scroll">
            <Stack gap="md">
                <Card withBorder radius="md" p="xl" className={classes.card}>
                    <Text fz="lg" className={classes.title} fw={500}>
                        Carla
                    </Text>
                    <Text fz="xs" c="dimmed" mt={3} mb="xl">
                        Carla configuration settings
                    </Text>
                    <Group justify="space-between" className={classes.item} wrap="nowrap" gap="xl">
                        <div>
                            <Text>Carla IP-Address</Text>
                            <Text size="xs" c="dimmed">
                                Carla Connection
                            </Text>
                        </div>
                        <Input
                            value={props.carlaSettings.ip}
                            onChange={(event) =>
                                props.setCarlaSettings({ip: event.currentTarget.value, port: props.carlaSettings.port})}
                            placeholder="Carla IP-Address" />
                    </Group>
                    <Group justify="space-between" className={classes.item} wrap="nowrap" gap="xl">
                        <div>
                            <Text>Carla Port</Text>
                            <Text size="xs" c="dimmed">
                                Carla Connection
                            </Text>
                        </div>
                        <NumberInput
                            value={props.carlaSettings.port}
                            onChange={(num) =>
                                props.setCarlaSettings({ip: props.carlaSettings.ip, port: Number(num)})}
                            placeholder="Carla Port"
                            hideControls />
                    </Group>
                </Card>

                <Card withBorder radius="md" p="xl" className={classes.card}>
                    <Text fz="lg" className={classes.title} fw={500}>
                        Spatial-location cloaking
                    </Text>
                    <Text fz="xs" c="dimmed" mt={3} mb="xl">
                        Implementation related configuration settings
                    </Text>
                    <LocationCloakingSettings
                        algo_data={props.algorithmData.locationCloakingSettings}
                    />
                </Card>


                <Card withBorder radius="md" p="xl" className={classes.card}>
                    <Text fz="lg" className={classes.title} fw={500}>
                        Temporal Cloaking
                    </Text>
                    <Text fz="xs" c="dimmed" mt={3} mb="xl">
                        Implementation related configuration settings
                    </Text>
                    <TemporalCloakingSettings
                        algo_data={props.algorithmData.temporalCloakingSettings}
                    />
                </Card>


                <Card withBorder radius="md" p="xl" className={classes.card}>
                    <Text fz="lg" className={classes.title} fw={500}>
                        Redundant dummy locations
                    </Text>
                    <Text fz="xs" c="dimmed" mt={3} mb="xl">
                        Implementation related configuration settings
                    </Text>
                    TBD
                </Card>


                <Card withBorder radius="md" p="xl" className={classes.card}>
                    <Text fz="lg" className={classes.title} fw={500}>
                        Path confusion
                    </Text>
                    <Text fz="xs" c="dimmed" mt={3} mb="xl">
                        Implementation related configuration settings
                    </Text>
                    TBD
                </Card>
            </Stack>
        </ScrollArea>
    );
}
