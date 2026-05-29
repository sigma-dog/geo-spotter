import type { FC } from 'react';
import { Flex } from '@chakra-ui/react';

import { Friends } from '../friends/Friends';
import { ProfileInfo } from '../ProfileIInfo';

type ProfilePanelProps = {
    openEditProfilePanel: () => void;
    openAddFriendsPanel: () => void;
};

export const ProfilePanel: FC<ProfilePanelProps> = ({
    openEditProfilePanel,
    openAddFriendsPanel,
}) => {
    return (
        <Flex
            w="full"
            direction="column"
            gap={4}
            maxH={{ base: 'none', xl: 'calc(100dvh - 48px)' }}
            minH={0}
        >
            <ProfileInfo openEditProfilePanel={openEditProfilePanel} />
            <Friends openAddFriendsPanel={openAddFriendsPanel} />
        </Flex>
    );
};
