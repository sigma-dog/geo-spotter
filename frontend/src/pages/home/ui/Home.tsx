import { type FC, useEffect, useRef, useState } from 'react';
import { LuPlay, LuSearch, LuShare, LuUsers } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import {
    ActionBar,
    Badge,
    Box,
    Button,
    type DialogOpenChangeDetails,
    Flex,
    Portal,
} from '@chakra-ui/react';

import {
    useAbandonActiveGameSessionMutation,
    useCreateMultiplayerLobbyMutation,
    useGetActiveGameSessionQuery,
    useGetIncomingMultiplayerLobbiesQuery,
    useGetPendingMultiplayerLobbyQuery,
    useRespondToMultiplayerLobbyMutation,
    useStartSoloGameSessionMutation,
} from 'shared/api/game';
import { getGameSocket } from 'shared/lib';
import { toaster } from 'shared/ui/chakra/toaster';
import { useOpenAddFriendsPanel } from 'widgets/addFriendsPanel';
import { EditProfilePanel } from 'widgets/editProfilePanel';
import { ProfilePanel } from 'widgets/profilePanel';

import { GamesHistory } from './gamesHistory/GamesHistory';
import { IncomingMultiplayerInvitesDialog } from './IncomingMultiplayerInvitesDialog';
import { MultiplayerLobbyDialog } from './MultiplayerLobbyDialog';
import { PendingMultiplayerLobbyDialog } from './PendingMultiplayerLobbyDialog';

const Home: FC = () => {
    const [isOpenEditProfilePanel, setIsOpenEditProfilePanel] = useState(false);
    const [isMultiplayerLobbyOpen, setIsMultiplayerLobbyOpen] = useState(false);
    const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
    const [respondingLobbyId, setRespondingLobbyId] = useState<string | null>(
        null
    );
    const navigate = useNavigate();
    const { data: activeSession, refetch: refetchActiveSession } =
        useGetActiveGameSessionQuery();
    const { data: pendingLobby, refetch: refetchPendingLobby } =
        useGetPendingMultiplayerLobbyQuery();
    const { data: incomingLobbies, refetch: refetchIncomingLobbies } =
        useGetIncomingMultiplayerLobbiesQuery();

    const [startSoloGameSession, { isLoading: isStartingSoloGame }] =
        useStartSoloGameSessionMutation();
    const [abandonActiveGameSession] = useAbandonActiveGameSessionMutation();
    const [createMultiplayerLobby, { isLoading: isStartingMultiplayerGame }] =
        useCreateMultiplayerLobbyMutation();
    const [respondToMultiplayerLobby] = useRespondToMultiplayerLobbyMutation();
    const hasShownInviteToastRef = useRef(false);

    const handleCloseEditProfilePanel = ({ open }: DialogOpenChangeDetails) => {
        setIsOpenEditProfilePanel(open);
    };

    const openEditProfilePanel = () => {
        setIsOpenEditProfilePanel(true);
    };

    const openAddFriendsPanel = useOpenAddFriendsPanel();

    useEffect(() => {
        const socket = getGameSocket();

        if (!socket) {
            return;
        }

        const handleMultiplayerSessionStarted = () => {
            void (async () => {
                const refreshedSession = await refetchActiveSession().unwrap();

                void refetchPendingLobby();
                void refetchIncomingLobbies();

                if (!hasShownInviteToastRef.current) {
                    toaster.create({
                        title: 'Многопользовательская игра началась',
                        description:
                            'Все игроки подтвердили участие. Переходим к заданиям.',
                        type: 'info',
                    });
                    hasShownInviteToastRef.current = true;
                }

                if (refreshedSession?.status === 'ACTIVE') {
                    navigate('/game');
                }
            })();
        };

        const handleMultiplayerLobbyCreated = () => {
            void refetchIncomingLobbies();
            toaster.create({
                title: 'Новое приглашение в матч',
                description: 'Открой приглашение и подтверди участие в лобби.',
                type: 'info',
            });
        };

        const handleMultiplayerLobbyUpdated = () => {
            void refetchPendingLobby();
            void refetchIncomingLobbies();
        };

        socket.on(
            'game:multiplayer-session-started',
            handleMultiplayerSessionStarted
        );
        socket.on(
            'game:multiplayer-lobby-created',
            handleMultiplayerLobbyCreated
        );
        socket.on(
            'game:multiplayer-lobby-updated',
            handleMultiplayerLobbyUpdated
        );

        return () => {
            socket.off(
                'game:multiplayer-session-started',
                handleMultiplayerSessionStarted
            );
            socket.off(
                'game:multiplayer-lobby-created',
                handleMultiplayerLobbyCreated
            );
            socket.off(
                'game:multiplayer-lobby-updated',
                handleMultiplayerLobbyUpdated
            );
        };
    }, [
        navigate,
        refetchActiveSession,
        refetchIncomingLobbies,
        refetchPendingLobby,
    ]);

    useEffect(() => {
        if (activeSession?.status === 'ACTIVE') {
            hasShownInviteToastRef.current = false;
        }
    }, [activeSession?.id, activeSession?.status]);

    const openGame = () => {
        if (activeSession?.status === 'ACTIVE') {
            navigate('/game');

            return;
        }

        void (async () => {
            try {
                await startSoloGameSession().unwrap();

                navigate('/game');
            } catch (error) {
                console.error('Failed to start solo game session', error);
                toaster.create({
                    title: 'Не удалось начать игру',
                    description:
                        error instanceof Error
                            ? error.message
                            : 'Unexpected client-side error.',
                    type: 'error',
                });
            }
        })();
    };

    const toggleFriend = (friendId: string) => {
        setSelectedFriendIds((current) =>
            current.includes(friendId)
                ? current.filter((id) => id !== friendId)
                : [...current, friendId]
        );
    };

    const openMultiplayerLobby = () => {
        if (activeSession?.status === 'ACTIVE') {
            toaster.create({
                title: 'Сначала заверши текущую игру',
                description:
                    activeSession.mode === 'SOLO'
                        ? 'У тебя уже есть активная одиночная сессия. Вернись в нее или дождись завершения, чтобы начать мультиплеер.'
                        : 'У тебя уже есть активная многопользовательская сессия. Сначала заверши текущий матч.',
                action: {
                    label: 'Завершить сессию',
                    onClick: () => {
                        void (async () => {
                            try {
                                await abandonActiveGameSession().unwrap();
                                await refetchActiveSession();
                                toaster.create({
                                    title: 'Сессия завершена',
                                    description:
                                        'Теперь можно создать многопользовательское лобби.',
                                    type: 'success',
                                });
                            } catch (error) {
                                toaster.create({
                                    title: 'Не удалось завершить сессию',
                                    description:
                                        error instanceof Error
                                            ? error.message
                                            : 'Unexpected client-side error.',
                                    type: 'error',
                                });
                            }
                        })();
                    },
                },
                type: 'info',
            });
            return;
        }

        if (pendingLobby?.status === 'PENDING') {
            return;
        }

        setIsMultiplayerLobbyOpen(true);
    };

    const closeMultiplayerLobby = () => {
        setIsMultiplayerLobbyOpen(false);
        setSelectedFriendIds([]);
    };

    const startMultiplayerMatch = (friendIds: string[]) => {
        void (async () => {
            try {
                await createMultiplayerLobby({ friendIds }).unwrap();

                closeMultiplayerLobby();
                void refetchPendingLobby();
            } catch (error) {
                console.error('Failed to create multiplayer lobby', error);
                toaster.create({
                    title: 'Не удалось создать лобби',
                    description:
                        error instanceof Error
                            ? error.message
                            : 'Unexpected client-side error.',
                    type: 'error',
                });
            }
        })();
    };

    const respondToInvite = (lobbyId: string, accept: boolean) => {
        setRespondingLobbyId(lobbyId);

        void (async () => {
            try {
                await respondToMultiplayerLobby({ accept, lobbyId }).unwrap();
                await Promise.all([
                    refetchIncomingLobbies(),
                    refetchPendingLobby(),
                    refetchActiveSession(),
                ]);

                toaster.create({
                    title: accept
                        ? 'Приглашение принято'
                        : 'Приглашение отклонено',
                    description: accept
                        ? 'Ждём подтверждения остальных игроков.'
                        : 'Лобби было закрыто.',
                    type: accept ? 'success' : 'info',
                });
            } catch (error) {
                toaster.create({
                    title: 'Не удалось ответить на приглашение',
                    description:
                        error instanceof Error
                            ? error.message
                            : 'Unexpected client-side error.',
                    type: 'error',
                });
            } finally {
                setRespondingLobbyId(null);
            }
        })();
    };

    const incomingInvites = incomingLobbies ?? [];
    const hasPendingLobby = pendingLobby?.status === 'PENDING';
    const hasIncomingInvites = incomingInvites.length > 0;

    return (
        <>
            <Flex
                w="full"
                minH="100dvh"
                bg="gray.100"
                align="flex-start"
                justify="space-between"
                px={{ base: 4, md: 6, xl: 8 }}
                py={{ base: 4, md: 6 }}
                boxSizing="border-box"
            >
                <Flex
                    w="full"
                    h={{ base: 'auto', xl: 'calc(100dvh - 48px)' }}
                    justifyContent="space-between"
                    align="flex-start"
                    gap={{ base: 4, xl: 8 }}
                    direction={{ base: 'column', xl: 'row' }}
                    minW={0}
                >
                    <Box
                        w={{ base: 'full', xl: '520px' }}
                        h={{ base: 'auto', xl: 'full' }}
                        minW={0}
                        flexShrink={0}
                    >
                        <GamesHistory />
                    </Box>
                    <Box
                        w={{ base: 'full', xl: '420px' }}
                        h={{ base: 'auto', xl: 'full' }}
                        minW={0}
                        flexShrink={0}
                    >
                        <ProfilePanel
                            openAddFriendsPanel={openAddFriendsPanel}
                            openEditProfilePanel={openEditProfilePanel}
                        />
                    </Box>
                </Flex>
                <EditProfilePanel
                    isOpen={isOpenEditProfilePanel}
                    onOpenChange={handleCloseEditProfilePanel}
                />
            </Flex>
            <MultiplayerLobbyDialog
                isOpen={isMultiplayerLobbyOpen}
                isStarting={isStartingMultiplayerGame}
                selectedFriendIds={selectedFriendIds}
                onClose={closeMultiplayerLobby}
                onStart={startMultiplayerMatch}
                onToggleFriend={toggleFriend}
            />
            <PendingMultiplayerLobbyDialog
                isOpen={hasPendingLobby}
                lobby={pendingLobby ?? null}
            />
            <IncomingMultiplayerInvitesDialog
                invites={incomingInvites}
                isOpen={!hasPendingLobby && hasIncomingInvites}
                respondingLobbyId={respondingLobbyId}
                onAccept={(lobbyId) => {
                    respondToInvite(lobbyId, true);
                }}
                onDecline={(lobbyId) => {
                    respondToInvite(lobbyId, false);
                }}
            />

            <ActionBar.Root open>
                <Portal>
                    <ActionBar.Positioner>
                        <ActionBar.Content>
                            <Button variant="subtle" size="sm">
                                <LuSearch />
                                Найти игру
                            </Button>
                            <ActionBar.Separator />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={openGame}
                                loading={isStartingSoloGame}
                            >
                                <LuPlay />
                                {activeSession?.status === 'ACTIVE'
                                    ? 'Продолжить игру'
                                    : 'Одиночная игра'}
                            </Button>
                            <ActionBar.Separator />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={openMultiplayerLobby}
                                loading={isStartingMultiplayerGame}
                            >
                                <LuUsers />
                                {hasIncomingInvites && (
                                    <Badge colorPalette="red" variant="solid">
                                        {incomingInvites.length}
                                    </Badge>
                                )}
                                {activeSession?.status === 'ACTIVE' &&
                                activeSession.mode === 'MULTIPLAYER'
                                    ? 'Вернуться в матч'
                                    : hasPendingLobby
                                      ? 'Лобби собирается'
                                      : 'Многопользовательская игра'}
                            </Button>
                            <ActionBar.Separator />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={openAddFriendsPanel}
                            >
                                <LuShare />
                                Друзья и лобби
                            </Button>
                        </ActionBar.Content>
                    </ActionBar.Positioner>
                </Portal>
            </ActionBar.Root>
        </>
    );
};

export default Home;
