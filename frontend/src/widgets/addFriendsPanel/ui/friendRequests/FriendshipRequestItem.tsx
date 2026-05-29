import type { FC } from 'react';
import { IoIosClose } from 'react-icons/io';
import { LuUserRoundPlus } from 'react-icons/lu';
import { Avatar, Flex, HStack, Spinner, Text } from '@chakra-ui/react';

import { useRespondFriendRequestMutation } from 'shared/api/friends';
import type { User } from 'shared/types';

type FriendShipRequestItemProps = {
    friendshipId: string;
    user: User;
};

export const FriendShipRequestItem: FC<FriendShipRequestItemProps> = ({
    user: { username, level, avatarUrl },
    friendshipId,
}) => {
    const [respondFriendRequest, { isLoading }] =
        useRespondFriendRequestMutation();

    const onRequestFriendship = (isAccept: boolean) => () => {
        respondFriendRequest({ friendshipId, accept: isAccept });
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

            {isLoading ? (
                <Spinner />
            ) : (
                <HStack>
                    <IoIosClose
                        size={32}
                        cursor="pointer"
                        color="red"
                        onClick={onRequestFriendship(false)}
                    />
                    <LuUserRoundPlus
                        size={16}
                        cursor="pointer"
                        onClick={onRequestFriendship(true)}
                    />
                </HStack>
            )}
        </Flex>
    );
};
