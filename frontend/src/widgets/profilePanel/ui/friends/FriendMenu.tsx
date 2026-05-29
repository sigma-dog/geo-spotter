import type { FC } from 'react';
import { GiHamburgerMenu } from 'react-icons/gi';
import { IoChatbubbleOutline, IoPersonRemoveOutline } from 'react-icons/io5';
import { IconButton, Menu, Portal, Spinner } from '@chakra-ui/react';

import { useDeleteFriendMutation } from 'shared/api/friends';

type FriendMenuProps = {
    friendId: string;
};

export const FriendMenu: FC<FriendMenuProps> = ({ friendId }) => {
    const [deleteFriend, { isLoading }] = useDeleteFriendMutation();

    const handleDeleteFriend = () => {
        deleteFriend({ friendId });
    };

    return (
        <Menu.Root>
            <Menu.Trigger asChild>
                <IconButton variant="plain" size="sm">
                    <GiHamburgerMenu />
                </IconButton>
            </Menu.Trigger>
            <Portal>
                <Menu.Positioner>
                    <Menu.Content>
                        <Menu.Item value="edit">
                            <IoChatbubbleOutline />
                            Написать сообщение
                        </Menu.Item>
                        <Menu.Item
                            value="logout"
                            color="red"
                            onClick={handleDeleteFriend}
                        >
                            <IoPersonRemoveOutline />
                            Удалить из друзей
                            {isLoading && <Spinner />}
                        </Menu.Item>
                    </Menu.Content>
                </Menu.Positioner>
            </Portal>
        </Menu.Root>
    );
};
