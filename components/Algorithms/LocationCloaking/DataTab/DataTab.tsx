import {
    Center,
    Loader,
    Stack,
    Text,
    Table,
    Anchor,
    ActionIcon,
    Group,
    Tooltip,
    ColorInput,
    ScrollArea, rem
} from "@mantine/core";
import {IconAdjustments, IconChartArcs3, IconCurrentLocation} from "@tabler/icons-react";

export function DataTab({ carla_settings, algo_data }: any) {
    const rows = algo_data.data["agent_ids"]?.map((element) => (
        <Table.Tr key={element}>
            <Table.Td>
                <Anchor underline="never">
                    <Text size="sm">
                        {Number(element.replace(/^\D+/g, ''))}
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
                            swatches={['', '#868e96', '#fa5252', '#e64980', '#be4bdb', '#7950f2', '#4c6ef5',
                                '#228be6', '#15aabf', '#12b886', '#40c057', '#82c91e', '#fab005', '#fd7e14']}
                            onChangeEnd={(value) => {
                                let color = {color: value}
                                if (value === "#000000") {
                                    color = undefined;
                                }
                                algo_data.setData(
                                    s => ({...s, position_granules: {...s.position_granules, [element]: color}})
                                )
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
                            swatches={['', '#868e96', '#fa5252', '#e64980', '#be4bdb', '#7950f2', '#4c6ef5',
                                '#228be6', '#15aabf', '#12b886', '#40c057', '#82c91e', '#fab005', '#fd7e14']}
                            onChangeEnd={(value) => {
                                let color = {color: value}
                                if (value === "#000000") {
                                    color = undefined;
                                }
                                algo_data.setData(
                                    s => ({...s, vicinity_granules: {...s.vicinity_granules, [element]: color}})
                                )
                            }}
                        />
                    </Tooltip>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Stack gap="0">
            {algo_data.data["agent_ids"] === undefined &&
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
                            {/*<Table.Th>Policy Current Level</Table.Th>*/}
                            <Table.Th>Policy Current/Max Lvl</Table.Th>
                            <Table.Th style={{ width: rem(295) }}>Granule Visualization</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                    {/*<Table.Caption>Agent Data</Table.Caption>*/}
                </Table>
            </ScrollArea>
        </Stack>
    )
}
