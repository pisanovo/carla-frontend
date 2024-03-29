import {
    Button,
    Group,
    NumberInput,
    rem,
    ScrollArea,
    Space,
    Switch,
    Table,
    Text,
    Stack,
    Card
} from "@mantine/core";
import React, {useContext, useEffect, useMemo, useState} from "react";
import {AlgorithmDataContext} from "@/contexts/AlgorithmDataContext";
import {
    AlgorithmSettings,
    MsgObserverServerReset
} from "@/components/Algorithms/PathConfusion/types";
import classes from "@/components/Algorithms/PathConfusion/DataTab/test.module.css";
import {useDisclosure} from "@mantine/hooks";

export default function () {
    const {
        pathConfusionData
    } = useContext(AlgorithmDataContext);

    /** Text shown when no connection to location server is established */
    const DEFAULT_TXT = "Loading... (waiting for server)";

    /** Used to detect whenever the user is currently requesting to reset all algorithm data */
    const [isSendingRequest, setIsSendingRequest] = useDisclosure();
    /** Stores unsaved changes the user made to the algorithm settings */
    const [cachedSettings, setCachedSettings] = useState<AlgorithmSettings|null>(null);

    const sendResetRequest = useMemo(() => function () {
        const ws = new WebSocket("ws://127.0.0.1:8765/command");
        const msg: MsgObserverServerReset = {
            type: "MsgObserverServerReset"
        }
        ws.onmessage = function (msg) {
            setIsSendingRequest.close();
        }
        ws.onopen = function () {
            setIsSendingRequest.open();
            ws.send(JSON.stringify(msg));
        };
    }, []);

    // Whenever new settings are received from the location server override cached settings to alert the user that
    // a change occured
    useEffect(() => {
        setCachedSettings(pathConfusionData.algorithmSettings)
    }, [pathConfusionData.algorithmSettings]);

    return (
        <>
            <Space h="md"/>
            <ScrollArea  scrollbarSize={4} h={pathConfusionData.is_live ? "calc(100vh - 19.5rem)" : "calc(100vh - 23.2rem)"} type="scroll" offsetScrollbars>
                {pathConfusionData.is_live &&
                    <Card withBorder radius="md" padding="lg" className={classes.card}>
                        <Group justify="space-between">
                            <Stack gap="0">
                                <Text fz="md" className={classes.title}>
                                    Reset Data
                                </Text>
                                <Text fz="xs" c="dimmed" mt={3} mb={-2}>
                                    Empty algorithm data and the store
                                </Text>
                            </Stack>
                            <Button
                                variant="light"
                                color="yellow"
                                size="xs"
                                mt={0}
                                onClick={(event) => sendResetRequest()}
                                loading={isSendingRequest}
                            >Reset</Button>
                        </Group>
                    </Card>
                }

                <Space h="md"/>
                <Table highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th style={{ width: rem(250) }}>Property </Table.Th>
                            <Table.Th>

                            </Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        <Table.Tr>
                            <Table.Th>Vehicle update rate</Table.Th>
                            <Table.Th>
                                <NumberInput
                                    value={cachedSettings?.updateRate || ""}
                                    onChange={(value) => {
                                        if (!cachedSettings) return;
                                        if (Number(value) > cachedSettings.timeInterval) {
                                            setCachedSettings({...cachedSettings, timeInterval: Number(value), updateRate: Number(value)});
                                        } else {
                                            setCachedSettings({...cachedSettings, updateRate: Number(value)});
                                        }
                                    }}
                                    allowNegative={false}
                                    suffix="s"
                                    disabled={!pathConfusionData.connectionStatus.server}
                                    placeholder={DEFAULT_TXT}/>
                            </Table.Th>
                        </Table.Tr>
                        <Table.Tr>
                            <Table.Th>Time interval</Table.Th>
                            <Table.Th>
                                <NumberInput
                                    value={cachedSettings?.timeInterval || ""}
                                    onChange={(value) => {
                                        if (!cachedSettings) return;
                                        setCachedSettings({...cachedSettings, timeInterval: Number(value)});
                                    }}
                                    step={5}
                                    allowNegative={false}
                                    suffix="s"
                                    min={cachedSettings?.updateRate}
                                    disabled={!pathConfusionData.connectionStatus.server}
                                    placeholder={DEFAULT_TXT}/>
                            </Table.Th>
                        </Table.Tr>
                        <Table.Tr>
                            <Table.Th>Time to confusion</Table.Th>
                            <Table.Th>
                                <NumberInput
                                    value={cachedSettings?.confusionTimeout || ""}
                                    onChange={(value) => {
                                        if (!cachedSettings) return;
                                        setCachedSettings({...cachedSettings, confusionTimeout: Number(value)});
                                    }}
                                    step={5}
                                    allowNegative={false}
                                    suffix="s"
                                    disabled={!pathConfusionData.connectionStatus.server}
                                    placeholder={DEFAULT_TXT}/>
                            </Table.Th>
                        </Table.Tr>
                        <Table.Tr>
                            <Table.Th>Reacquisition time window</Table.Th>
                            <Table.Th>
                                <NumberInput
                                    value={cachedSettings?.tGuard || ""}
                                    onChange={(value) => {
                                        if (!cachedSettings) return;
                                        setCachedSettings({...cachedSettings, tGuard: Number(value)});
                                    }}
                                    step={5}
                                    allowNegative={false}
                                    suffix="s"
                                    disabled={!pathConfusionData.connectionStatus.server}
                                    placeholder={DEFAULT_TXT}/>
                            </Table.Th>
                        </Table.Tr>
                        <Table.Tr>
                            <Table.Th>µ (Mue)</Table.Th>
                            <Table.Th>
                                <NumberInput
                                    value={cachedSettings?.mue || ""}
                                    onChange={(value) => {
                                        if (!cachedSettings) return;
                                        setCachedSettings({...cachedSettings, mue: Number(value)});
                                    }}
                                    allowNegative={false}
                                    disabled={!pathConfusionData.connectionStatus.server}
                                    placeholder={DEFAULT_TXT}/>
                            </Table.Th>
                        </Table.Tr>
                        <Table.Tr>
                            <Table.Th>k Anonymity</Table.Th>
                            <Table.Th>
                                <NumberInput
                                    value={cachedSettings?.kAnonymity || ""}
                                    onChange={(value) => {
                                        if (!cachedSettings) return;
                                        setCachedSettings({...cachedSettings, kAnonymity: Number(value)});
                                    }}
                                    allowDecimal={false}
                                    allowNegative={false}
                                    disabled={!pathConfusionData.connectionStatus.server}
                                    placeholder={DEFAULT_TXT}/>
                            </Table.Th>
                        </Table.Tr>
                        <Table.Tr>
                            <Table.Th>Trip timeout</Table.Th>
                            <Table.Th>
                                <NumberInput
                                    value={cachedSettings?.tripTimeout || ""}
                                    onChange={(value) => {
                                        if (!cachedSettings) return;
                                        setCachedSettings({...cachedSettings, tripTimeout: Number(value)});
                                    }}
                                    step={5}
                                    suffix="s"
                                    allowNegative={false}
                                    disabled={!pathConfusionData.connectionStatus.server}
                                    placeholder={DEFAULT_TXT}/>
                            </Table.Th>
                        </Table.Tr>
                        <Table.Tr>
                            <Table.Th>Uncertainty threshold</Table.Th>
                            <Table.Th>
                                <NumberInput
                                    value={cachedSettings?.uncertaintyThreshold || ""}
                                    onChange={(value) => {
                                        if (!cachedSettings) return;
                                        setCachedSettings({...cachedSettings, uncertaintyThreshold: Number(value)});
                                    }}
                                    decimalScale={2}
                                    fixedDecimalScale
                                    step={0.05}
                                    min={0}
                                    disabled={!pathConfusionData.connectionStatus.server}
                                    placeholder={DEFAULT_TXT}/>
                            </Table.Th>
                        </Table.Tr>
                    </Table.Tbody>
                </Table>
                <Space h="md"/>
                <Table highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Extensions</Table.Th>
                            <Table.Th style={{ width: rem(40) }}>

                            </Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        <Table.Tr>
                            <Table.Th>Apply location cloaking extension</Table.Th>
                            <Table.Th>
                                <Switch
                                    onChange={(event) => {
                                        if (!cachedSettings) return;
                                        setCachedSettings({...cachedSettings, applySensitiveLocationCloakingExtension: event.currentTarget.checked})
                                    }}
                                    disabled={!pathConfusionData.connectionStatus.server}
                                    mt={10}
                                    mb={10}
                                    color="indigo"
                                    checked={cachedSettings?.applySensitiveLocationCloakingExtension || false}/>
                            </Table.Th>
                        </Table.Tr>
                        <Table.Tr>
                            <Table.Th>Apply windowing extension</Table.Th>
                            <Table.Th>
                                <Switch
                                    onChange={(event) => {
                                        if (!cachedSettings) return;
                                        setCachedSettings({...cachedSettings, applyWindowingExtension: event.currentTarget.checked})
                                    }}
                                    disabled={!pathConfusionData.connectionStatus.server}
                                    mt={10}
                                    mb={10}
                                    color="indigo"
                                    checked={cachedSettings?.applyWindowingExtension || false}/>
                            </Table.Th>
                        </Table.Tr>
                    </Table.Tbody>
                </Table>
                <Space h="md"/>
                <Group justify="flex-end">
                    <Button
                        disabled={!pathConfusionData.connectionStatus.server}
                        variant="default" >
                        Apply
                    </Button>
                </Group>
                <Space h="xl"/>
            </ScrollArea>
        </>
    )
}
