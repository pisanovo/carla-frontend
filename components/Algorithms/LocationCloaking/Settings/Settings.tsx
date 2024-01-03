import {IMapView} from "@/components/MapView/MapView";
import {Button, Group, Input, JsonInput, NumberInput, Space, Stack, Switch, Text} from "@mantine/core";
import classes from "@/components/SettingsTab/SettingsTab.module.css";
import {AlgorithmSettings} from "../../../SettingsTab/SettingsTab";
import io from 'socket.io-client';
import {useEffect, useState} from "react";
import useSWRSubscription from "swr/subscription";

export function Settings({ algo_data }: any) {
    const [configData, setConfigData] = useState<any>("");

    useSWRSubscription(
        'ws://127.0.0.1:8200/carla/client-config-stream',
        (key, { next }) => {
            const socket = new WebSocket(key)
            socket.addEventListener('message', (event) => next(
                null,
                prev => {
                    var event_json = JSON.parse(event.data);
                    setConfigData(event_json.data);
                })
            )
            return () => socket.close()
    })

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
            {/*<Group justify="space-between" className={classes.item} wrap="nowrap" gap="xl">*/}
            {/*    <div>*/}
            {/*        <Text>Test Switch</Text>*/}
            {/*        <Text size="xs" c="dimmed">*/}
            {/*            Hello world!*/}
            {/*        </Text>*/}
            {/*    </div>*/}
            {/*    <Switch onLabel="ON" offLabel="OFF" className={classes.switch} size="lg" />*/}
            {/*</Group>*/}
            <Group justify="space-between" className={classes.item} wrap="nowrap" gap="xl">
                <Stack>
                    <div>
                        <Text>Client Configuration</Text>
                        <Text size="xs" c="dimmed">
                            Hello world!
                        </Text>
                    </div>

                </Stack>
                <Button
                    variant="default"
                    onClick={() => {
                        const ws = new WebSocket("ws://127.0.0.1:8200/carla/update-client-config");
                        ws.onopen = function () {
                            ws.send('{"type": "ConfigUpdate", "data": '+JSON.stringify(configData)+'}');
                        };
                    }}
                >
                    Apply
                </Button>
            </Group>
            <Space h={5}/>
            <JsonInput
                value={configData}
                onChange={(value) => {
                    setConfigData(value);
                }}
                label="client_config.json"
                placeholder="Loading..."
                validationError="Invalid JSON"
                formatOnBlur
                // w={400}
                autosize
                minRows={4}
                maxRows={14}
            />

        </div>
    )
}
