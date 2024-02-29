import {useContext, useEffect, useState} from "react";
import {AlgorithmDataContext} from "@/contexts/AlgorithmDataContext";
import useSWRSubscription from "swr/subscription";
import {MSG_INCREMENTAL_UPDATE, MSG_INIT_COMPLETE, MSG_SYNC} from "@/components/Algorithms/LocationCloaking/config";
import {
    LocationCloakingAlgorithmData,
    MsgPartLSClientInitComplete,
    MsgPartLSObserverIncUpd,
    MsgPartLSObserverSync
} from "@/components/Algorithms/LocationCloaking/types";
import {Anchor, Center, ColorInput, Group, Loader, rem, ScrollArea, Stack, Table, Text, Tooltip} from "@mantine/core";
import {IconChartArcs3, IconCurrentLocation} from "@tabler/icons-react";

export default function () {
    const {
        mapAgentsData,
        locationCloakingData,
        setLocationCloakingData
    } = useContext(AlgorithmDataContext);

    /** Reconnect timeout to location server in ms */
    const LOCATION_SERVER_CONN_TIMEOUT = 4000;
    /** Available tile colors */
    const TILE_COLORS = ['', '#868e96', '#fa5252', '#e64980', '#be4bdb', '#7950f2', '#4c6ef5',
        '#228be6', '#15aabf', '#12b886', '#40c057', '#82c91e', '#fab005', '#fd7e14'];
    /** Save the current websocket connection and create a new one on timeout */
    const [lsWebsocket, setLsWebsocket] = useState<WebSocket>();
    const [isLsWebsocketCon, setIsLsWebsocketCon] = useState<boolean>(false);

    /** Manage algorithm data */

    // Function handling initialization messages from the location server
    const handle_msg_ls_init = (part: MsgPartLSClientInitComplete, prev: LocationCloakingAlgorithmData["data"]) => {
            prev.gridPlane = {
                longitude: {
                    min: part.planeData.lonMin,
                    max: part.planeData.lonMax
                },
                latitude: {
                    min: part.planeData.latMin,
                    max: part.planeData.latMax
                }
            };
            return prev;
    }

    // Function handling state synchronization, i.e., full updates on connection to the location server
    const handle_msg_sync = (part: MsgPartLSObserverSync, prev: LocationCloakingAlgorithmData["data"]) => {
        part.users.forEach(function (user) {
            const agent_alias = user.alias[0];

            // Extract the vicinity granules stack
            const gs_stack_vicinity_granules = user.granularities.reduce((acc, gs_level) => {
                return [...acc, gs_level.encryptedVicinity.granules];
            }, [] as number[][]);

            // Update agent data
            prev.gridAgentData = {...prev.gridAgentData, [agent_alias]: {
                level: user.level,
                position_granule: user.granularities[user.granularities.length - 1].encryptedLocation.granule,
                vicinity_granules: gs_stack_vicinity_granules,
                vicinity_radius: user.vicinityShape.radius
            }};
        });
        return prev;
    }

    // Function handling incremental update messages from the location server
    const handle_msg_inc_upd = (part: MsgPartLSObserverIncUpd, prev: LocationCloakingAlgorithmData["data"]) => {
        const agent_alias = part.alias[0];

        const existing_vicinity_granules = prev.gridAgentData[agent_alias];
        // New granularity stack containing vicinity granules at different levels
        let new_vicinity_granules: number[][] = [];

        // Truncate existing vicinity granules to level matching the update
        if (agent_alias in prev.gridAgentData) {
            new_vicinity_granules = existing_vicinity_granules.vicinity_granules.slice(0, part.level + 1);
        }

        // If level increased by one insert all new granules, no granules to delete
        // since it is a new empty level
        if (part.level == new_vicinity_granules.length) {
            new_vicinity_granules.push(part.vicinityInsert.granules);
        } else {
            // console.log("vc", agent_alias, part.level, prev.gridAgentData);
            const level_vc_granules = new_vicinity_granules[part.level];
            const remaining_level_vc_granules = level_vc_granules.filter((el) =>
                !(part.vicinityDelete.granules.includes(el)));
            const mergedGranules = [...remaining_level_vc_granules, ...part.vicinityInsert.granules];
            new_vicinity_granules[part.level] = Array.from(new Set(mergedGranules));

        }

        const upd = {
                level: part.level,
                position_granule: part.newLocation.granule,
                vicinity_granules: new_vicinity_granules,
                vicinity_radius: part.vicinityShape.radius
        };

        if (JSON.stringify(prev.gridAgentData[agent_alias]) !== JSON.stringify(upd)) {
            prev.gridAgentData = {...prev.gridAgentData, [agent_alias]: upd};
        }

        return prev;
    }

    const handle_msg = (data: any, prev: LocationCloakingAlgorithmData["data"]) => {
        const eventJson = JSON.parse(data);
        // Receive message after initialization and update grid plane
        if (eventJson["type"] == MSG_INIT_COMPLETE) {
            return handle_msg_ls_init(eventJson, prev);
            // Receive message containing full state (only sent once on each new connection)
        } else if (eventJson["type"] == MSG_SYNC) {
            return handle_msg_sync(eventJson, prev);
            // Receive newest update
        } else if (eventJson["type"] == MSG_INCREMENTAL_UPDATE) {
            return handle_msg_inc_upd(eventJson, prev);
        }

        return prev;
    }

    // Wrapper for the location server websocket connection adding reconnect
    const ls_sub_reconnect = function (url: string, next: any) {
        let socket = new WebSocket(url);
        setLsWebsocket(socket);
        socket.onclose = () => {
            setIsLsWebsocketCon(false);
            setTimeout(() => {
                ls_sub_reconnect(url, next)
            }, LOCATION_SERVER_CONN_TIMEOUT);
        }

        // Receive messages from the location server
        socket.addEventListener('message', (event) => next(null, (prev: any) => {
            setIsLsWebsocketCon(true);
            if(!prev) prev = structuredClone(locationCloakingData);
            return handle_msg(event.data, prev);
        }))
    }

    // Listens to stream of updates from the location server
    const {data} = useSWRSubscription(
        'ws://'+locationCloakingData.locationServer.ip+":"+locationCloakingData.locationServer.port+"/observe",
        (key, { next }) => {
            ls_sub_reconnect(key, next);
            return () => {
                lsWebsocket?.close();
            }
        }
    );

    useEffect(() => {
        if (data) {
            const a = {
                ...locationCloakingData,
                gridPlane: data.gridPlane,
                gridAgentData: {...data.gridAgentData}
            };
            a.gridAgentData = data.gridAgentData;
            a.gridPlane = data.gridPlane;
            setLocationCloakingData(a)
        }
    }, [data?.gridPlane, data?.gridAgentData]);

    useEffect(() => {
        console.log("STATUS", isLsWebsocketCon)
        if (isLsWebsocketCon) {
            setLocationCloakingData({...locationCloakingData, connectionStatus: {locationServer: true}})
        } else {
            setLocationCloakingData({...locationCloakingData, connectionStatus: {locationServer: false}})
        }
    }, [isLsWebsocketCon]);


    /** Algorithm Data Tab */

    const rows = mapAgentsData.activeAgents.map((agentId: string) => (
        <Table.Tr key={agentId}>
            <Table.Td>
                <Anchor underline="never">
                    <Text size="sm">
                        {Number(agentId.replace(/^\D+/g, ''))}
                    </Text>
                </Anchor>
            </Table.Td>
            <Table.Td>
                1/3
            </Table.Td>
            <Table.Td>
                <Group gap="xs">
                    <Tooltip label="Show Position Granules">
                        <ColorInput w={130}
                                    placeholder="Hidden"
                                    rightSection={
                                        <IconCurrentLocation style={{ width: '70%', height: '70%' }} stroke={1.5} />
                                    }
                                    swatchesPerRow={7}
                                    swatches={TILE_COLORS}
                                    onChangeEnd={(color) => {
                                        const newColor = color === "#000000" ? undefined : color;
                                        const tileColors = structuredClone(locationCloakingData.tileColors);
                                        if (!tileColors[agentId]) tileColors[agentId] = {vicinityGranules: {color: undefined}, positionGranule: {color: undefined}}
                                        tileColors[agentId] = {...tileColors[agentId], positionGranule: {color: newColor}};
                                        setLocationCloakingData({...locationCloakingData, tileColors})
                                    }}
                        />
                    </Tooltip>
                    <Tooltip label="Show Vicinity Granules">
                        <ColorInput w={130}
                                    placeholder="Hidden"
                                    rightSection={
                                        <IconChartArcs3 style={{ width: '70%', height: '70%' }} stroke={1.5} />
                                    }
                                    swatchesPerRow={7}
                                    swatches={TILE_COLORS}
                                    onChangeEnd={(color) => {
                                        const newColor = color === "#000000" ? undefined : color;
                                        const tileColors = structuredClone(locationCloakingData.tileColors);
                                        if (!tileColors[agentId]) tileColors[agentId] = {vicinityGranules: {color: undefined}, positionGranule: {color: undefined}}
                                        tileColors[agentId] = {...tileColors[agentId], vicinityGranules: {color: newColor}};
                                        setLocationCloakingData({...locationCloakingData, tileColors})
                                    }}
                        />
                    </Tooltip>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Stack gap="0">
            {mapAgentsData.activeAgents.length === 0 &&
                <Center h="calc(100vh - 15rem)">
                    <Stack gap="4">
                        <Center>
                            <Loader size={40}/>
                        </Center>
                        <Text size="xs">Waiting for connection...</Text>
                    </Stack>
                </Center>
            }
            <ScrollArea  scrollbarSize={4} h="calc(100vh - 16rem)" type="scroll">
                <Table highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>ID</Table.Th>
                            <Table.Th>Policy Current/Max Lvl</Table.Th>
                            <Table.Th style={{ width: rem(295) }}>Granule Visualization</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            </ScrollArea>
        </Stack>
    )
}
