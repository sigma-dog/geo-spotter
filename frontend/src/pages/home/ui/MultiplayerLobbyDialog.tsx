import { useMemo } from 'react';
import {
    Avatar,
    Box,
    Button,
    Dialog,
    HStack,
    Portal,
    Spinner,
    Text,
    VStack,
} from '@chakra-ui/react';

import { useGetFriendsInfiniteQuery } from 'shared/api/friends';
import type { User } from 'shared/types';

type MultiplayerLobbyDialogProps = {
    isOpen: boolean;
    isStarting: boolean;
    onClose: () => void;
    onStart: (friendIds: string[]) => void;
    selectedFriendIds: string[];
    onToggleFriend: (friendId: string) => void;
};

const PAGE_SIZE = 30;

const getInitials = (user: User) => {
    const [firstLetter = 'U'] = user.username.trim().toUpperCase();

    return firstLetter;
};

export const MultiplayerLobbyDialog = ({
    isOpen,
    isStarting,
    onClose,
    onStart,
    selectedFriendIds,
    onToggleFriend,
}: MultiplayerLobbyDialogProps) => {
    const { data, isFetching, isLoading } = useGetFriendsInfiniteQuery({
        offset: 0,
        limit: PAGE_SIZE,
    });

    const friends = useMemo(() => data?.items ?? [], [data?.items]);
    const canStart = selectedFriendIds.length > 0 && !isStarting;

    return (
        <Dialog.Root
            lazyMount
            open={isOpen}
            placement="center"
            onOpenChange={({ open }) => {
                if (!open) {
                    onClose();
                }
            }}
        >
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>Лобби мультиплеера</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <VStack align="stretch" gap={4}>
                                <Box>
                                    <Text fontWeight="700" color="gray.800">
                                        Добавь друзей в матч
                                    </Text>
                                    <Text mt={1} color="gray.600">
                                        Все игроки получат одинаковый набор
                                        заданий, а победит тот, кто первым
                                        закроет всю сессию.
                                    </Text>
                                </Box>

                                {(isLoading || isFetching) && (
                                    <HStack color="gray.500">
                                        <Spinner size="sm" />
                                        <Text>Загружаем список друзей...</Text>
                                    </HStack>
                                )}

                                {!isLoading && friends.length === 0 && (
                                    <Box
                                        p={4}
                                        borderRadius="xl"
                                        bg="gray.50"
                                        borderWidth="1px"
                                        borderColor="gray.200"
                                    >
                                        <Text color="gray.600">
                                            Сначала добавь хотя бы одного друга,
                                            чтобы начать совместную игру.
                                        </Text>
                                    </Box>
                                )}

                                <VStack align="stretch" gap={2}>
                                    {friends.map((friend) => {
                                        const isSelected =
                                            selectedFriendIds.includes(
                                                friend.id
                                            );

                                        return (
                                            <Button
                                                key={friend.id}
                                                justifyContent="space-between"
                                                variant={
                                                    isSelected
                                                        ? 'solid'
                                                        : 'outline'
                                                }
                                                colorPalette={
                                                    isSelected ? 'red' : 'gray'
                                                }
                                                h="auto"
                                                py={3}
                                                onClick={() =>
                                                    onToggleFriend(friend.id)
                                                }
                                            >
                                                <HStack gap={3}>
                                                    <Avatar.Root size="sm">
                                                        <Avatar.Fallback>
                                                            {getInitials(
                                                                friend
                                                            )}
                                                        </Avatar.Fallback>
                                                        {friend.avatarUrl && (
                                                            <Avatar.Image
                                                                src={
                                                                    friend.avatarUrl
                                                                }
                                                            />
                                                        )}
                                                    </Avatar.Root>
                                                    <VStack
                                                        align="flex-start"
                                                        gap={0}
                                                    >
                                                        <Text fontWeight="700">
                                                            {friend.username}
                                                        </Text>
                                                        <Text
                                                            fontSize="sm"
                                                            color={
                                                                isSelected
                                                                    ? 'red.100'
                                                                    : 'gray.500'
                                                            }
                                                        >
                                                            {isSelected
                                                                ? 'В лобби'
                                                                : 'Нажми, чтобы добавить'}
                                                        </Text>
                                                    </VStack>
                                                </HStack>
                                                <Text fontWeight="700">
                                                    {isSelected
                                                        ? 'Убрать'
                                                        : 'Добавить'}
                                                </Text>
                                            </Button>
                                        );
                                    })}
                                </VStack>
                            </VStack>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Button variant="outline" onClick={onClose}>
                                Отмена
                            </Button>
                            <Button
                                colorPalette="red"
                                loading={isStarting}
                                disabled={!canStart}
                                onClick={() => onStart(selectedFriendIds)}
                            >
                                Стартовать матч
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
};
