import {
    Space,
    Stack,
    Tabs,
    rem,
    ScrollArea,
    Table,
    ActionIcon,
    Card,
    Text,
    TextInput,
    Group, Divider, Button, Switch, Checkbox, ColorInput, Pill, Badge, HoverCard
} from "@mantine/core";
import React from "react";
import classes from './test.module.css';
import {IconCurrentLocation, IconDeviceFloppy, IconPlayerPlay} from "@tabler/icons-react";

export default function () {
    return (
        <>
            <Stack>
                <Tabs color="gray" variant="unstyled" defaultValue="recordings" classNames={classes} mb={0}>
                    <Tabs.List grow>
                        <Tabs.Tab value="data">
                            Vehicles
                        </Tabs.Tab>
                        <Tabs.Tab value="settings">
                            Parameters
                        </Tabs.Tab>
                        <Tabs.Tab value="recordings">
                            Recordings
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="data">
                        <Space h="md"/>
                        <ScrollArea  scrollbarSize={4} h="calc(100vh - 23.2rem)" type="scroll">
                            <Card withBorder radius="md" padding="lg" className={classes.card}>
                                <Group justify="space-between">
                                    <Stack gap="0">
                                        <Text fz="md" className={classes.title}>
                                            Vehicle Information
                                        </Text>
                                        <Text fz="xs" c="dimmed" mt={3} mb="xl">
                                            Select a release entry on the map to view detailed information
                                        </Text>
                                    </Stack>
                                    {/*<ActionIcon variant="default" size="lg" mt={-35}>*/}
                                    {/*    <IconDeviceFloppy stroke={1.25} style={{ width: rem(20), height: rem(20)}} />*/}
                                    {/*</ActionIcon>*/}
                                </Group>

                                <Group gap="xs">
                                    <Badge color="indigo">ID: 140</Badge>
                                    <Badge color="blue">Uncertainty: 0.22 / 0.3</Badge>
                                    <Badge color="blue">TTC in: 144s</Badge>
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
                            <Space h="xl"/>
                        </ScrollArea>
                    </Tabs.Panel>

                    <Tabs.Panel value="settings">
                        <Space h="md"/>
                        <ScrollArea  scrollbarSize={4} h="calc(100vh - 23.2rem)" type="scroll" offsetScrollbars>
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
                                            <TextInput placeholder="Loading... (waiting for server)"/>
                                        </Table.Th>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Th>Time interval</Table.Th>
                                        <Table.Th>
                                            <TextInput placeholder="Loading... (waiting for server)"/>
                                        </Table.Th>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Th>Time to confusion</Table.Th>
                                        <Table.Th>
                                            <TextInput placeholder="Loading... (waiting for server)"/>
                                        </Table.Th>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Th>Reacquisition time window</Table.Th>
                                        <Table.Th>
                                            <TextInput placeholder="Loading... (waiting for server)"/>
                                        </Table.Th>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Th>µ (Mue)</Table.Th>
                                        <Table.Th>
                                            <TextInput placeholder="Loading... (waiting for server)"/>
                                        </Table.Th>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Th>k Anonymity</Table.Th>
                                        <Table.Th>
                                            <TextInput placeholder="Loading... (waiting for server)"/>
                                        </Table.Th>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Th>Trip timeout</Table.Th>
                                        <Table.Th>
                                            <TextInput placeholder="Loading... (waiting for server)"/>
                                        </Table.Th>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Th>Uncertainty threshold</Table.Th>
                                        <Table.Th>
                                            <TextInput placeholder="Loading... (waiting for server)"/>
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
                                            <Switch mt={10} mb={10} color="indigo"/>
                                        </Table.Th>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Th>Apply windowing extension</Table.Th>
                                        <Table.Th>
                                            <Switch mt={10} mb={10} color="indigo"/>
                                        </Table.Th>
                                    </Table.Tr>
                                </Table.Tbody>
                            </Table>
                            <Space h="md"/>
                            <Group justify="flex-end">
                                <Button variant="default" >
                                    Apply
                                </Button>
                            </Group>
                            <Space h="xl"/>

                        </ScrollArea>
                    </Tabs.Panel>

                    <Tabs.Panel value="recordings">
                        <Space h="md"/>
                        <ScrollArea  scrollbarSize={4} h="calc(100vh - 23.2rem)" type="scroll">
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
                                    <ActionIcon variant="default" size="lg" mt={-35}>
                                        <IconDeviceFloppy stroke={1.25} style={{ width: rem(20), height: rem(20)}} />
                                    </ActionIcon>
                                </Group>

                                <TextInput
                                    placeholder="Recording name"
                                />
                            </Card>
                            <Space h="md"/>
                            <Table highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Recording Name</Table.Th>
                                        <Table.Th style={{ width: rem(30) }}></Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    <Table.Tr>
                                        <Table.Th>1711135813_Presentation_Scenario_A.dump</Table.Th>
                                        <Table.Th>
                                            <ActionIcon variant="transparent" color="gray">
                                                <IconPlayerPlay style={{ width: rem(20), height: rem(20) }}/>
                                            </ActionIcon>
                                        </Table.Th>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Th>1711135656_Presentation_Scenario_B.dump</Table.Th>
                                        <Table.Th>
                                            <ActionIcon variant="transparent" color="gray">
                                                <IconPlayerPlay style={{ width: rem(20), height: rem(20) }}/>
                                            </ActionIcon>
                                        </Table.Th>
                                    </Table.Tr>
                                </Table.Tbody>
                            </Table>
                        </ScrollArea>
                    </Tabs.Panel>
                </Tabs>
                <Stack mt={0} ml={6}>
                    <Divider my="xs" mb={0} mt={0}  />
                    <Group justify="space-between" mt={-4}>
                        <Group>
                            <Divider size="xl" orientation="vertical" color="#453328" h={20} />
                            <Text fz="sm" className={classes.title}>
                                You are currently viewing a recording
                            </Text>
                        </Group>
                        <Button variant="light" color="orange" size="xs">Exit recording</Button>
                    </Group>
                </Stack>

            </Stack>

        </>
    )
}
