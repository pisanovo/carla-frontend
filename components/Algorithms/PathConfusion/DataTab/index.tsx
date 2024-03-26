import {
    Stack,
    Tabs,
    Text,
    Group, Divider, Button
} from "@mantine/core";
import _ from "lodash";
import React, {useContext, useEffect, useMemo, useState} from "react";
import classes from './test.module.css';
import PathConfusionVehiclesDataTab from "@/components/Algorithms/PathConfusion/DataTab/VehiclesTab";
import PathConfusionParametersDataTab from "@/components/Algorithms/PathConfusion/DataTab/ParametersTab";
import PathConfusionRecordingsDataTab from "@/components/Algorithms/PathConfusion/DataTab/RecordingsTab";
import {AlgorithmDataContext} from "@/contexts/AlgorithmDataContext";
import useSWRSubscription from "swr/subscription";
import {
    MsgObserverServerGoLive,
    MsgObserverServerLoadRecording,
    MsgServerClientReleaseUpdate,
    MsgServerObserverAvailableRecordings, MsgServerObserverSettingsUpdate, MsgServerObserverVehicles,
    PathConfusionAlgorithmData
} from "@/components/Algorithms/PathConfusion/types";
import {
    MSG_AVAILABLE_RECORDINGS,
    MSG_RELEASE_SET_UPDATE,
    MSG_SETTINGS_UPDATE, MSG_VEHICLES
} from "@/components/Algorithms/PathConfusion/config";
import {useDisclosure} from "@mantine/hooks";

export default function () {
    const {
        pathConfusionData,
        setPathConfusionData
    } = useContext(AlgorithmDataContext);

    /** Reconnect timeout to server in ms */
    const SERVER_CONN_TIMEOUT = 4000;
    /** Save the current websocket connection and create a new one on timeout */
    const [serverWebsocket, setServerWebsocket] = useState<WebSocket>();
    const [isServerWebsocketCon, setIsServerWebsocketCon] = useState<boolean>(false);
    const [isSendingGoLiveRequest, setIsSendingGoLiveRequest] = useDisclosure();

    const sendGoLiveRequest = useMemo(() => function () {
        const ws = new WebSocket("ws://127.0.0.1:8765/command");
        const msg: MsgObserverServerGoLive = {
            type: "MsgObserverServerGoLive"
        }
        console.log(msg);
        ws.onmessage = function (msg) {
            setIsSendingGoLiveRequest.close();
        }
        ws.onopen = function () {
            setIsSendingGoLiveRequest.open();
            ws.send(JSON.stringify(msg));
        };
    }, []);

    const handle_msg_recordings = (part: MsgServerObserverAvailableRecordings, prev: PathConfusionAlgorithmData["data"]) => {
        console.log("REC", part.fileNames);
        prev.available_recordings = part.fileNames;
        return prev;
    }

    const handle_msg_settings = (part: MsgServerObserverSettingsUpdate, prev: PathConfusionAlgorithmData["data"]) => {
        if(!_.isEqual(prev.algorithmSettings, part.settings)) {
            prev.algorithmSettings = part.settings;
        }
        if(prev.is_live !== part.isLive) {
            prev.is_live = part.isLive
        }
        return prev;
    }

    const handle_msg_release_set = (part: MsgServerClientReleaseUpdate, prev: PathConfusionAlgorithmData["data"]) => {
        if(!_(part.releaseStore).xorWith(prev.releaseEntries, _.isEqual).isEmpty()) {
            prev.releaseEntries = [...part.releaseStore];
        }
        return prev;
    }

    const handle_msg_vehicles = (part: MsgServerObserverVehicles, prev: PathConfusionAlgorithmData["data"]) => {
        prev.vehiclesData.available_vehicles = part.availableVehicles;
        prev.vehiclesData.relevant_vehicles = part.relevantVehicles;
        return prev;
    }

    const handle_msg = (data: any, prev: PathConfusionAlgorithmData["data"]) => {
        const eventJson = JSON.parse(data);

        // Receive message after initialization and update grid plane
        if (eventJson["type"] == MSG_AVAILABLE_RECORDINGS) {
            return handle_msg_recordings(eventJson, prev);
            // Receive message containing full state (only sent once on each new connection)
        } else if (eventJson["type"] == MSG_SETTINGS_UPDATE) {
            // return handle_msg_sync(eventJson, prev);
            return handle_msg_settings(eventJson, prev);
            // Receive newest update
        } else if (eventJson["type"] == MSG_RELEASE_SET_UPDATE) {
            return handle_msg_release_set(eventJson, prev);
        } else if (eventJson["type"] == MSG_VEHICLES) {
            // return handle_msg_vehicles(eventJson, prev);
        }

        return prev;
    }

    // Wrapper for the location server websocket connection adding reconnect
    const server_sub_reconnect = function (url: string, next: any) {
        let socket = new WebSocket(url);
        setServerWebsocket(socket);
        socket.onclose = () => {
            setIsServerWebsocketCon(false);
            setTimeout(() => {
                server_sub_reconnect(url, next)
            }, SERVER_CONN_TIMEOUT);
        }

        // Receive messages from the location server
        socket.addEventListener('message', (event) => next(null, (prev: any) => {
            setIsServerWebsocketCon(true);
            if(!prev) prev = structuredClone(pathConfusionData);
            return handle_msg(event.data, prev);
        }))
    }

    // Listens to stream of updates from the location server
    const {data} = useSWRSubscription(
        'ws://'+pathConfusionData.server.ip+":"+pathConfusionData.server.port+"/observe",
        (key, { next }) => {
            server_sub_reconnect(key, next);
            return () => {
                serverWebsocket?.close();
            }
        }
    );

    useEffect(() => {
        if (isServerWebsocketCon) {
            setPathConfusionData({...pathConfusionData, connectionStatus: {server: true}})
        } else {
            setPathConfusionData({...pathConfusionData, connectionStatus: {server: false}})
        }
    }, [isServerWebsocketCon]);

    useEffect(() => {
        if(data) {
            setPathConfusionData({
                ...pathConfusionData,
                algorithmSettings: data.algorithmSettings,
                releaseEntries: data.releaseEntries,
                available_recordings: data.available_recordings,
                is_live: data.is_live
            })
        }
    }, [data?.algorithmSettings, data?.releaseEntries, data?.available_recordings, data?.is_live]);

    return (
        <>
            <Stack>
                <Tabs color="gray" variant="unstyled" defaultValue="recordings" classNames={classes} mb={0}>
                    <Tabs.List grow>
                        <Tabs.Tab value="vehicles">
                            Vehicles
                        </Tabs.Tab>
                        <Tabs.Tab value="parameters">
                            Parameters
                        </Tabs.Tab>
                        <Tabs.Tab value="recordings">
                            Recordings
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="vehicles">
                        <PathConfusionVehiclesDataTab />
                    </Tabs.Panel>

                    <Tabs.Panel value="parameters">
                        <PathConfusionParametersDataTab />
                    </Tabs.Panel>

                    <Tabs.Panel value="recordings">
                        <PathConfusionRecordingsDataTab />
                    </Tabs.Panel>
                </Tabs>
                {
                    !pathConfusionData.is_live && <Stack mt={0} ml={6}>
                        <Divider my="xs" mb={0} mt={0}  />
                        <Group justify="space-between" mt={-4}>
                            <Group>
                                <Divider size="xl" orientation="vertical" color="#453328" h={20} />
                                <Text fz="sm" className={classes.title}>
                                    You are currently viewing a recording
                                </Text>
                            </Group>
                            <Button
                                variant="light"
                                color="orange"
                                size="xs"
                                onClick={(event) => sendGoLiveRequest()}
                                loading={isSendingGoLiveRequest}
                            >Exit recording</Button>
                        </Group>
                    </Stack>
                }
            </Stack>
        </>
    )
}
