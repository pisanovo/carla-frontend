import {Container, Group, ActionIcon, rem, Affix} from '@mantine/core';
import { IconBrandTwitter, IconBrandYoutube, IconBrandInstagram } from '@tabler/icons-react';
import { MantineLogo } from '@mantine/ds';
import classes from './Footer.module.css';

export function FooterSocial() {
    return (
        <div className={classes.footer}>
            <Container className={classes.inner}>
                <MantineLogo size={28} />
                <Group gap={0} className={classes.links} justify="flex-end" wrap="nowrap">
                    <ActionIcon size="lg" color="gray" variant="subtle">
                        <IconBrandTwitter  />
                    </ActionIcon>
                </Group>
            </Container>
        </div>
    );
}
