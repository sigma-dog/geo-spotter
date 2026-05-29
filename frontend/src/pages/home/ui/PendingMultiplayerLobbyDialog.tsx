import { Badge, Box, Dialog, Portal, Text, VStack } from '@chakra-ui/react';

import type { MultiplayerLobby } from 'pages/game/lib/types';

type PendingMultiplayerLobbyDialogProps = {
    isOpen: boolean;
    lobby: MultiplayerLobby | null;
};

const STATUS_LABELS: Record<
    MultiplayerLobby['participants'][number]['status'],
    string
> = {
    ACCEPTED: 'Готов',
    DECLINED: 'Отклонил',
    PENDING: 'Ждём ответ',
};

const STATUS_COLORS: Record<
    MultiplayerLobby['participants'][number]['status'],
    string
> = {
    ACCEPTED: 'green',
    DECLINED: 'red',
    PENDING: 'orange',
};

export const PendingMultiplayerLobbyDialog = ({
    isOpen,
    lobby,
}: PendingMultiplayerLobbyDialogProps) => {
    if (!lobby) {
        return null;
    }

    const currentParticipant = lobby.participants.find(
        (participant) => participant.isCurrentUser
    );
    const isHost = currentParticipant?.isHost ?? false;

    return (
        <Dialog.Root lazyMount open={isOpen} placement="center">
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>
                                {isHost
                                    ? 'Лобби собирается'
                                    : 'Ожидание старта матча'}
                            </Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <VStack align="stretch" gap={4}>
                                <Text color="gray.600">
                                    {isHost
                                        ? 'Приглашения уже отправлены. Матч стартует автоматически, когда все друзья подтвердят участие.'
                                        : 'Ты уже в лобби. Как только остальные игроки подтвердят участие, матч запустится автоматически.'}
                                </Text>
                                <VStack align="stretch" gap={2}>
                                    {lobby.participants.map((participant) => (
                                        <Box
                                            key={participant.userId}
                                            p={3}
                                            borderRadius="lg"
                                            bg="gray.50"
                                            borderWidth="1px"
                                            borderColor="gray.200"
                                        >
                                            <Text fontWeight="700">
                                                {participant.isCurrentUser
                                                    ? `${participant.username} (ты)`
                                                    : participant.username}
                                            </Text>
                                            <Badge
                                                mt={2}
                                                colorPalette={
                                                    STATUS_COLORS[
                                                        participant.status
                                                    ]
                                                }
                                            >
                                                {
                                                    STATUS_LABELS[
                                                        participant.status
                                                    ]
                                                }
                                            </Badge>
                                        </Box>
                                    ))}
                                </VStack>
                            </VStack>
                        </Dialog.Body>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
};
