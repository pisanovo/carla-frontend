import {
    ActionIcon,
    Card,
    Group,
    rem,
    ScrollArea,
    Space,
    Stack,
    Table,
    Text,
    TextInput,
} from "@mantine/core";
import classes from "@/components/Algorithms/PathConfusion/DataTab/test.module.css";
import {IconDeviceFloppy, IconPlayerPlay, IconTrash} from "@tabler/icons-react";
import React, {useContext, useMemo, useState} from "react";
import {
    MsgObserverServerAddRecording, MsgObserverServerDeleteRecording,
    MsgObserverServerLoadRecording
} from "@/components/Algorithms/PathConfusion/types";
import {AlgorithmDataContext} from "@/contexts/AlgorithmDataContext";
import {useDisclosure} from "@mantine/hooks";

export default function () {
    const {pathConfusionData, setPathConfusionData} = useContext(AlgorithmDataContext);

    /** Used to detect whenever the user is currently requesting to play a recording */
    const [isSendingRecRequest, setIsSendingRecRequest] = useDisclosure();
    /** Used to detect whenever the user is currently requesting to add or delete a recording */
    const [isSendingLoadDelRecRequest, setIsSendingLoadDelRecRequest] = useDisclosure();
    /** Stores the user chosen file name when saving a new recording */
    const [fileName, setFileName] = useState('');

    const sendAddRecordingRequest = useMemo(() => function (name: string) {
        const ws = new WebSocket("ws://127.0.0.1:8765/command");
        const msg: MsgObserverServerAddRecording = {
            name: name,
            type: "MsgObserverServerAddRecording"
        }
        ws.onmessage = function (msg) {
            setIsSendingRecRequest.close();
            setFileName("");
        }
        ws.onopen = function () {
            setIsSendingRecRequest.open();
            ws.send(JSON.stringify(msg));
        };
    }, []);

    const sendRecordingRequest = useMemo(() => function (fileName: string, mode: "load" | "del") {
        const ws = new WebSocket("ws://127.0.0.1:8765/command");
        let msg: MsgObserverServerLoadRecording | MsgObserverServerDeleteRecording = {
            recording_file_name: fileName,
            type: "MsgObserverServerDeleteRecording"
        };
        if (mode === "load") {
            msg = {
                recording_file_name: fileName,
                type: "MsgObserverServerLoadRecording"
            }
        }
        console.log(fileName);
        ws.onmessage = function (msg) {
            setIsSendingLoadDelRecRequest.close();
            setFileName("");
        }
        ws.onopen = function () {
            setIsSendingLoadDelRecRequest.open();
            ws.send(JSON.stringify(msg));
        };
    }, []);

    // Rows displaying available recordings with delete and play buttons
    const rows = pathConfusionData.available_recordings.map((fileName: string) => (
        <Table.Tr key={fileName}>
            <Table.Th>{fileName}</Table.Th>
            <Table.Th>
                <Group>
                    <ActionIcon
                        onClick={(event) => sendRecordingRequest(fileName, "del")}
                        loading={isSendingLoadDelRecRequest}
                        variant="transparent"
                        color="gray">
                        <IconTrash style={{ width: rem(19), height: rem(19) }}/>
                    </ActionIcon>
                    <ActionIcon
                        onClick={(event) => sendRecordingRequest(fileName, "load")}
                        loading={isSendingLoadDelRecRequest}
                        variant="transparent"
                        color="gray">
                        <IconPlayerPlay style={{ width: rem(20), height: rem(20) }}/>
                    </ActionIcon>
                </Group>
            </Table.Th>
        </Table.Tr>
    ));

    return (
        <>
            <Space h="md"/>
            <ScrollArea  scrollbarSize={4} h={pathConfusionData.is_live ? "calc(100vh - 19.5rem)" : "calc(100vh - 23.2rem)"} type="scroll">
                <Card withBorder radius="md" padding="lg" className={classes.card}>
                    <Group justify="space-between">
                        <Stack gap="0">
                            <Text fz="md" className={classes.title}>
                                Save Recording
                            </Text>
                            <Text fz="xs" c="dimmed" mt={3} mb="xl">
                                Store the algorithm state to disk
                            </Text>
                        </Stack>
                        <ActionIcon
                            onClick={(event) => fileName.length > 0 ? sendAddRecordingRequest(fileName) : null}
                            loading={isSendingRecRequest}
                            variant="default"
                            size="lg"
                            disabled={!pathConfusionData.is_live}
                            mt={-35}>
                            <IconDeviceFloppy stroke={1.25} style={{ width: rem(20), height: rem(20)}} />
                        </ActionIcon>
                    </Group>

                    <TextInput
                        placeholder="Recording name"
                        value={fileName}
                        disabled={!pathConfusionData.is_live}
                        onChange={(event) => setFileName(event.currentTarget.value)}
                    />
                </Card>
                <Space h="md"/>
                <Table highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Recording Name</Table.Th>
                            <Table.Th style={{ width: rem(92) }}></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {rows}
                    </Table.Tbody>
                </Table>
            </ScrollArea>
        </>
    )
}
