import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { LuCheck, LuUserRoundPlus } from 'react-icons/lu';
import { Avatar, Flex, HStack, IconButton, Text } from '@chakra-ui/react';

import { useSendFriendRequestMutation } from 'shared/api/friends/friendsApi';
import type { User } from 'shared/types';

type UserItemProps = {
    user: User;
};

export const UserItem: FC<UserItemProps> = ({
    user: { username, level, avatarUrl, id, isFriendRequestSent = false },
}) => {
    const [isRequestSent, setIsRequestSent] = useState(isFriendRequestSent);
    const [sendFriendRequest, { isLoading }] = useSendFriendRequestMutation();

    useEffect(() => {
        setIsRequestSent(isFriendRequestSent);
    }, [isFriendRequestSent]);

    const onRequestFriendship = async () => {
        await sendFriendRequest({
            addresseeId: id,
        }).unwrap();

        setIsRequestSent(true);
    };

    return (
        <Flex
            gap={4}
            alignItems="center"
            justifyContent="space-between"
            w="full"
        >
            <HStack alignItems="center" justifyContent="space-between">
                <Avatar.Root>
                    <Avatar.Fallback />
                    <Avatar.Image src={avatarUrl ?? undefined} />
                </Avatar.Root>
                <Flex direction="column">
                    <Text textStyle="md" fontWeight="semibold">
                        {username}
                    </Text>
                    <Text textStyle="xs" color="fg.muted">
                        {level} уровень
                    </Text>
                </Flex>
            </HStack>

            <HStack>
                <IconButton
                    aria-label={
                        isRequestSent
                            ? 'Запрос в друзья отправлен'
                            : 'Добавить в друзья'
                    }
                    variant="ghost"
                    size="sm"
                    colorPalette={isRequestSent ? 'green' : 'gray'}
                    disabled={isLoading || isRequestSent}
                    loading={isLoading}
                    onClick={onRequestFriendship}
                >
                    {isRequestSent ? (
                        <LuCheck size={16} />
                    ) : (
                        <LuUserRoundPlus size={16} />
                    )}
                </IconButton>
            </HStack>
        </Flex>
    );
};
