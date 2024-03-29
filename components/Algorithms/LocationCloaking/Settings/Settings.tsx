import {
    Button,
    Group,
    Input,
    JsonInput,
    NumberInput,
    Space,
    Stack,
    Text,
    rem,
} from "@mantine/core";
import classes from "@/components/SettingsTab/SettingsTab.module.css";
import {useContext, useMemo, useState} from "react";
import useSWRSubscription from "swr/subscription";
import {AlgorithmDataContext} from "@/contexts/AlgorithmDataContext";
import {IconAlertTriangle, IconCircleFilled} from "@tabler/icons-react";

export function Settings() {
    const { locationCloakingData, setLocationCloakingData } = useContext(AlgorithmDataContext);

    const [websocket, setWebsocket] = useState<WebSocket>();
    const [savedConfigData, setSavedConfigData] = useState<any>("");
    const [configData, setConfigData] = useState<any>("");

    /** Reconnect timeout in ms */
    const SERVER_CONN_TIMEOUT = 4000;

    const sendConfigUpdate = useMemo(() => function (data: any) {
        const ws = new WebSocket("ws://127.0.0.1:8200/carla/update-client-config");
        ws.onopen = function () {
            ws.send('{"type": "ConfigUpdate", "data": '+JSON.stringify(data)+'}');
        };
        setSavedConfigData(configData);
    }, []);

    const ls_sub_reconnect = function (url: string, next: any) {
        let socket = new WebSocket(url);
        setWebsocket(socket);
        socket.onclose = () => {
            setTimeout(() => {
                ls_sub_reconnect(url, next)
            }, SERVER_CONN_TIMEOUT);
        }

        // Receive messages from the server
        socket.addEventListener('message', (event) => next(
            null, () => {
                const eventJson = JSON.parse(event.data);
                setSavedConfigData(eventJson.data);
                setConfigData(eventJson.data);
            }
        ))
    }

    useSWRSubscription(
        'ws://127.0.0.1:8200/carla/client-config-stream',
        (key, { next }) => {
            ls_sub_reconnect(key, next);
            return () => websocket?.close();
        }
    );

    return (
        <div>
            <Group justify="space-between" className={classes.item} wrap="nowrap" gap="xl">
                <div>
                    <Text>Status</Text>
                    <Text size="xs" c="dimmed">
                        Shows active connections
                    </Text>
                </div>
                {locationCloakingData.connectionStatus.locationServer &&
                    <Group gap="4">
                        <IconCircleFilled style={{color: "green", width: rem(6), height: rem(6) }} />
                        <Text size="xs">Location Server (online)</Text>
                    </Group>
                }
                {!locationCloakingData.connectionStatus.locationServer &&
                    <Group gap="4">
                        <IconCircleFilled style={{color: "red", width: rem(6), height: rem(6) }} />
                        <Text size="xs">Location Server (offline)</Text>
                    </Group>
                }
            </Group>
            <Group justify="space-between" className={classes.item} wrap="nowrap" gap="xl">
                <div>
                    <Text>Location Server IP-Address</Text>
                    <Text size="xs" c="dimmed">
                        Location Server Connection
                    </Text>
                </div>
                <Input value={locationCloakingData.locationServer.ip || ''}
                       onChange={(event) =>
                           setLocationCloakingData({
                               ...locationCloakingData,
                               locationServer: {
                                   ip: event.currentTarget.value,
                                   port: locationCloakingData.locationServer.port
                               }
                           })}
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
                    value={locationCloakingData.locationServer.port || ''}
                    onChange={(port: number) =>
                        setLocationCloakingData({
                            ...locationCloakingData,
                            locationServer: {
                                ip: locationCloakingData.locationServer.ip,
                                port: port
                            }
                        })}
                    placeholder="LS Port" hideControls />
            </Group>
            <Group justify="space-between" className={classes.item} wrap="nowrap" gap="xl">
                <Stack>
                    <div>
                        <Text>Client Configuration</Text>
                        <Text size="xs" c="dimmed">
                            Change the algorithm client configuration
                        </Text>
                    </div>

                </Stack>
                <Button
                    variant="default"
                    onClick={() => sendConfigUpdate(configData)}
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
                label={
                    <Group gap="0">
                        <Text size="sm">client_config.json</Text>
                        <Space w="9"/>
                        {
                            configData !== savedConfigData &&
                            <Group gap="4">
                                <Text size="sm">|</Text>
                                <Space w="2"/>
                                <IconAlertTriangle style={{color: "orange", width: rem(14), height: rem(14) }} />
                                <Text size="xs">Unsaved changes</Text>
                            </Group>

                        }
                    </Group>
                }
                placeholder="Loading..."
                validationError="Invalid JSON"
                formatOnBlur
                autosize
                minRows={4}
                maxRows={14}
            />

        </div>
    )
}
