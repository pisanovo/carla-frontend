import {Card, Group, Input, NumberInput, ScrollArea, Stack, Switch, Text} from '@mantine/core';
import classes from './Settings.module.css';

const data = [
    { title: 'Messages', description: 'Direct messages you have received from other users' },
    { title: 'Review requests', description: 'Code review requests from your team members' },
    { title: 'Comments', description: 'Daily digest with comments on your posts' },
    {
        title: 'Recommendations',
        description: 'Digest with best community posts from previous week',
    },
];

export function Settings() {
    return (
        <ScrollArea  scrollbarSize={4} h="calc(100vh - 16rem)" type="scroll">
            <Stack gap="md">
                <Card withBorder radius="md" p="xl" className={classes.card}>
                    <Text fz="lg" className={classes.title} fw={500}>
                        Spatial-location cloaking
                    </Text>
                    <Text fz="xs" c="dimmed" mt={3} mb="xl">
                        Implementation related configuration settings
                    </Text>
                    <Group justify="space-between" className={classes.item} wrap="nowrap" gap="xl">
                        <div>
                            <Text>Location Server IP-Address</Text>
                            <Text size="xs" c="dimmed">
                                Location Server Connection
                            </Text>
                        </div>
                        <Input placeholder="LS IP-Address" />
                    </Group>
                    <Group justify="space-between" className={classes.item} wrap="nowrap" gap="xl">
                        <div>
                            <Text>Location Server Port</Text>
                            <Text size="xs" c="dimmed">
                                Location Server Connection
                            </Text>
                        </div>
                        <NumberInput placeholder="LS Port" hideControls />
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
                </Card>


                <Card withBorder radius="md" p="xl" className={classes.card}>
                    <Text fz="lg" className={classes.title} fw={500}>
                        Temporal Cloacking
                    </Text>
                    <Text fz="xs" c="dimmed" mt={3} mb="xl">
                        Implementation related configuration settings
                    </Text>
                    TBD
                </Card>


                <Card withBorder radius="md" p="xl" className={classes.card}>
                    <Text fz="lg" className={classes.title} fw={500}>
                        Redundant dummy locations
                    </Text>
                    <Text fz="xs" c="dimmed" mt={3} mb="xl">
                        Implementation related configuration settings
                    </Text>
                    TBD
                </Card>


                <Card withBorder radius="md" p="xl" className={classes.card}>
                    <Text fz="lg" className={classes.title} fw={500}>
                        Path confusion
                    </Text>
                    <Text fz="xs" c="dimmed" mt={3} mb="xl">
                        Implementation related configuration settings
                    </Text>
                    TBD
                </Card>
            </Stack>
        </ScrollArea>
    );
}
