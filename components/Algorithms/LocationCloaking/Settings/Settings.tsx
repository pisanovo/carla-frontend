import {IMapView} from "@/components/MapView/MapView";
import {Group, Input, NumberInput, Switch, Text} from "@mantine/core";
import classes from "@/components/SettingsTab/SettingsTab.module.css";
import {AlgorithmSettings} from "../../../SettingsTab/SettingsTab";
import {useEffect} from "react";

export function Settings({ algo_data }: any) {

    return (
        <div>
            <Group justify="space-between" className={classes.item} wrap="nowrap" gap="xl">
                <div>
                    <Text>Location Server IP-Address</Text>
                    <Text size="xs" c="dimmed">
                        Location Server Connection
                    </Text>
                </div>
                <Input value={algo_data.settings.location_server_ip || ''}
                       onChange={(event) =>
                           algo_data.setSettings(s => ({...s, location_server_ip: event.currentTarget.value}))}
                       placeholder="LS IP-Address" />
            </Group>
            <Group justify="space-between" className={classes.item} wrap="nowrap" gap="xl">
                <div>
                    <Text>Location Server Port</Text>
                    <Text size="xs" c="dimmed">
                        Location Server Connection
                    </Text>
                </div>
                <NumberInput
                    value={algo_data.settings.location_server_port || ''}
                    onChange={(num) =>
                        algo_data.setSettings(s => ({...s, location_server_port: Number(num)}))}
                    placeholder="LS Port" hideControls />
            </Group>
            <Group justify="space-between" className={classes.item} wrap="nowrap" gap="xl">
                <div>
                    <Text>Test Switch</Text>
                    <Text size="xs" c="dimmed">
                        Hello world!
                    </Text>
                </div>
                <Switch onLabel="ON" offLabel="OFF" className={classes.switch} size="lg" />
            </Group>
        </div>
    )
}
