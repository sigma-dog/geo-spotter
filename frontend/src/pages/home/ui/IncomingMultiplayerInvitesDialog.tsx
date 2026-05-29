import { Button, Dialog, Portal, Text, VStack } from '@chakra-ui/react';

import type { MultiplayerLobby } from 'pages/game/lib/types';

type IncomingMultiplayerInvitesDialogProps = {
    invites: MultiplayerLobby[];
    isOpen: boolean;
    respondingLobbyId: string | null;
    onAccept: (lobbyId: string) => void;
    onDecline: (lobbyId: string) => void;
};

export const IncomingMultiplayerInvitesDialog = ({
    invites,
    isOpen,
    respondingLobbyId,
    onAccept,
    onDecline,
}: IncomingMultiplayerInvitesDialogProps) => {
    return (
        <Dialog.Root lazyMount open={isOpen} placement="center">
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>
                                Приглашения в многопользовательскую игру
                            </Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <VStack align="stretch" gap={4}>
                                {invites.map((invite) => {
                                    const host = invite.participants.find(
                                        (participant) => participant.isHost
                                    );

                                    return (
                                        <VStack
                                            key={invite.id}
                                            align="stretch"
                                            gap={3}
                                            p={4}
                                            borderRadius="xl"
                                            bg="gray.50"
                                            borderWidth="1px"
                                            borderColor="gray.200"
                                        >
                                            <Text fontWeight="700">
                                                {host?.username ?? 'Друг'}{' '}
                                                приглашает тебя в матч
                                            </Text>
                                            <Text color="gray.600">
                                                В лобби уже{' '}
                                                {invite.participants.length}{' '}
                                                игрок(а). Матч стартует, когда
                                                все подтвердят участие.
                                            </Text>
                                            <Dialog.Footer px={0} pb={0}>
                                                <Button
                                                    variant="outline"
                                                    colorPalette="red"
                                                    onClick={() =>
                                                        onDecline(invite.id)
                                                    }
                                                    loading={
                                                        respondingLobbyId ===
                                                        invite.id
                                                    }
                                                >
                                                    Отклонить
                                                </Button>
                                                <Button
                                                    colorPalette="green"
                                                    onClick={() =>
                                                        onAccept(invite.id)
                                                    }
                                                    loading={
                                                        respondingLobbyId ===
                                                        invite.id
                                                    }
                                                >
                                                    Принять
                                                </Button>
                                            </Dialog.Footer>
                                        </VStack>
                                    );
                                })}
                            </VStack>
                        </Dialog.Body>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
};
