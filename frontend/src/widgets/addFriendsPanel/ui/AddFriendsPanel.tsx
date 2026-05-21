import type { FC } from 'react';
import { CloseButton, Drawer, Separator, VStack } from '@chakra-ui/react';

import { FriendshipRequests } from './friendRequests/FriendshipRequests';
import { UsersList } from './usersList/UsersList';
import type { AddFriendsPanelType } from '../lib/AddFriendsPanelContext';

export const AddFriendsPanel: FC<AddFriendsPanelType> = ({
    isOpen,
    onClose,
}) => {
    return (
        <Drawer.Root open={isOpen} onOpenChange={onClose} size="md">
            <Drawer.Backdrop />
            <Drawer.Positioner>
                <Drawer.Content>
                    <Drawer.CloseTrigger />
                    <Drawer.Header>
                        <Drawer.Title />
                    </Drawer.Header>
                    <Drawer.Body>
                        <VStack gap={2} w="full">
                            <FriendshipRequests />
                            <Separator />
                            <UsersList />
                        </VStack>
                    </Drawer.Body>
                    <Drawer.Footer />
                    <Drawer.CloseTrigger asChild>
                        <CloseButton size="sm" />
                    </Drawer.CloseTrigger>
                </Drawer.Content>
            </Drawer.Positioner>
        </Drawer.Root>
    );
};
