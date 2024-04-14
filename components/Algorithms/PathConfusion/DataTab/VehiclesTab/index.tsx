import {
    Alert,
    Badge, Button,
    Card,
    Checkbox,
    ColorInput,
    Group,
    HoverCard,
    rem,
    ScrollArea, SegmentedControl,
    Space,
    Stack, Switch,
    Table,
    Text
} from "@mantine/core";
import classes from "@/components/Algorithms/PathConfusion/DataTab/test.module.css";
import React, {useContext, useMemo} from "react";
import {AlgorithmDataContext} from "@/contexts/AlgorithmDataContext";
import {Feature} from "ol";
import {PathConfusionAlgorithmData} from "@/components/Algorithms/PathConfusion/types";
import {IconCircleFilled, IconInfoCircle} from "@tabler/icons-react";
import {Input, NumberInput} from "@mantine/core/lib";

export default function () {
    const {pathConfusionData, setPathConfusionData} = useContext(AlgorithmDataContext);

    const getTTC = useMemo(() => function (pad: PathConfusionAlgorithmData["data"]) {
        const lct = pathConfusionData.selected_entry?.vehicleEntry.lastConfusionTime;
        const ct = pathConfusionData.algorithmSettings?.confusionTimeout;
        const cat = pathConfusionData.selected_entry?.createdAtTime;
        if (lct && ct && cat) {
            return (lct + ct) - cat;
        } else {
            return "-/- ";
        }
    }, [pathConfusionData]);

    const getEntryNumber = useMemo(() => function (pad: PathConfusionAlgorithmData["data"]) {
        const n =  pad.releaseEntries
            .filter((e) => e.vehicleEntry.id === pad.selected_entry?.vehicleEntry.id)
            .findIndex((e) =>
                e.vehicleEntry.id === pad.selected_entry?.vehicleEntry.id && e.createdAtTime === pad.selected_entry.createdAtTime);

        if (n == -1) return "-/-";
        return n;
    }, [])

    return (
        <>
            <Space h="md"/>
            <ScrollArea  scrollbarSize={4} h={pathConfusionData.is_live ? "calc(100vh - 19.5rem)" : "calc(100vh - 23.2rem)"} type="scroll">
                {
                    pathConfusionData.is_live &&
                    <Stack gap="0">
                        <Alert variant="light" color="yellow" title="Issues with Carla slowdowns" icon={<IconInfoCircle />}>
                            If you experience cars moving slower/stopping restart the traffic generation script.
                            Slowdowns due to Carla lead to inaccurate position predictions.
                        </Alert>
                        <Space h="6"/>
                    </Stack>
                }


                <Card withBorder radius="md" padding="lg" className={classes.card}>
                    <Group justify="space-between">
                        <Stack gap="0">
                            <Text fz="md" className={classes.title}>
                                Vehicle Information
                            </Text>
                            <Text fz="xs" c="dimmed" mt={3} mb="xl">
                                Select a data point (release entry) on the map to view detailed information
                            </Text>
                        </Stack>
                    </Group>

                    <Group gap="xs">
                        <Badge color="indigo">ID: {pathConfusionData.selected_entry?.vehicleEntry.id || "-/-"}</Badge>
                        <Badge color="indigo">Entry number: {getEntryNumber(pathConfusionData)}</Badge>
                        <Badge color="blue">Released: {pathConfusionData.selected_entry === null ? "-/-" : (pathConfusionData.selected_entry?.isInReleaseSet ? "YES" : "NO")}</Badge>
                        <Badge color="blue">TTC in: {getTTC(pathConfusionData)}s</Badge>
                    </Group>
                </Card>
                <Space h="6"/>
                <Card withBorder radius="md" padding="lg" className={classes.card}>
                    <Group justify="space-between">
                        <Stack gap="0">
                            <Text fz="md" className={classes.title}>
                                Uncertainty Information
                            </Text>
                            <Text fz="xs" c="dimmed" mt={3} mb="xl">
                                Select a data point on the map to view detailed information
                            </Text>
                        </Stack>
                    </Group>

                    <Group justify="space-between" className={classes.item} wrap="nowrap" gap="xl">
                        <div>
                            <Text>Toggle map display</Text>
                            <Text size="xs" c="dimmed">
                                Choose whether to show dependencies or neighbors
                            </Text>
                        </div>
                        <SegmentedControl
                            onChange={(event) => {
                                const b = event === "Dependencies";
                                setPathConfusionData({...pathConfusionData, isDisplayDependenciesSelected: b})
                            }}
                            value={pathConfusionData.isDisplayDependenciesSelected ? "Dependencies": "Neighbors"}
                            data={['Dependencies', 'Neighbors']}
                        />
                    </Group>

                    <Group justify="space-between" className={classes.item} wrap="nowrap" gap="xl">
                        <div>
                            <Text>[Dependencies] Interval uncertainty</Text>
                            <Text size="xs" c="dimmed">
                                Decide if vehicle is part of the release candidates set
                            </Text>
                        </div>
                        <Badge color="gray">Uncertainty: {pathConfusionData.selected_entry?.uncertaintyInterval || "-/-"} / {pathConfusionData.algorithmSettings?.uncertaintyThreshold || "-/-"}</Badge>
                    </Group>

                    <Group justify="space-between" className={classes.item} wrap="nowrap" gap="xl">
                        <div>
                            <Text>[Neighbors] Release interval uncertainty</Text>
                            <Text size="xs" c="dimmed">
                                Decide if vehicle time to confusion (TTC) should be reset
                            </Text>
                        </div>
                        <Badge color="gray">Uncertainty: {pathConfusionData.selected_entry?.uncertaintyReleaseSet || "-/-"} / {pathConfusionData.algorithmSettings?.uncertaintyThreshold || "-/-"}</Badge>
                    </Group>
                </Card>
                <Space h="md"/>
                <Table highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th style={{ width: rem(40) }}>Active</Table.Th>
                            <Table.Th style={{ width: rem(300) }}>Vehicle ID</Table.Th>
                            <Table.Th style={{ width: rem(140) }}>

                            </Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        <Table.Tr>
                            <Table.Th>
                                <Checkbox
                                    defaultChecked
                                />
                            </Table.Th>
                            <Table.Th>140</Table.Th>
                            <Table.Th>
                                <ColorInput defaultValue="#C5D899" />
                            </Table.Th>
                        </Table.Tr>
                        <Table.Tr>
                            <Table.Th>
                                <Checkbox
                                    defaultChecked
                                />
                            </Table.Th>
                            <Table.Th>141</Table.Th>
                            <Table.Th>
                                <ColorInput defaultValue="#C5D899" />
                            </Table.Th>
                        </Table.Tr>
                    </Table.Tbody>
                </Table>
                <Space h="md"/>
                <Group justify="flex-end">
                    <HoverCard shadow="md" withArrow position="left">
                        <HoverCard.Target>
                            <Button variant="default" >
                                Apply
                            </Button>
                        </HoverCard.Target>
                        <HoverCard.Dropdown h={30}>
                            <Text size="xs" mt={-5}>
                                Change the active set of vehicles
                            </Text>
                        </HoverCard.Dropdown>
                    </HoverCard>
                </Group>
                {/*<Text>*/}
                {/*    {*/}
                {/*        getSpeed(pathConfusionData) + " km/h"*/}
                {/*    }*/}
                {/*</Text>*/}
                <Space h="xl"/>
            </ScrollArea>
        </>
    )
}
