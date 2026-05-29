import {
    Avatar,
    Badge,
    Box,
    Button,
    Dialog,
    HStack,
    Portal,
    Separator,
    Text,
    VStack,
} from '@chakra-ui/react';

import type { GameSession } from '../lib/types';

type GameResultsDialogProps = {
    isOpen: boolean;
    session: GameSession | null;
    onGoHome: () => void;
    onRestart: () => void;
    isRestarting: boolean;
};

export const GameResultsDialog = ({
    isOpen,
    session,
    onGoHome,
    onRestart,
    isRestarting,
}: GameResultsDialogProps) => {
    const allTasksCompleted =
        (session?.completedTasksCount ?? 0) ===
            (session?.totalTasksCount ?? 0) &&
        (session?.totalTasksCount ?? 0) > 0;
    const isCurrentUserWinner = session?.players.some(
        (player) =>
            player.isCurrentUser && player.userId === session.winnerUserId
    );
    const rankedPlayers = [...(session?.players ?? [])].sort((left, right) => {
        if (right.completedTasksCount !== left.completedTasksCount) {
            return right.completedTasksCount - left.completedTasksCount;
        }

        if (left.attemptsCount !== right.attemptsCount) {
            return left.attemptsCount - right.attemptsCount;
        }

        return left.username.localeCompare(right.username, 'ru');
    });

    return (
        <Dialog.Root lazyMount open={isOpen} placement="center">
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>
                                Результаты игровой сессии
                            </Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <VStack align="stretch" gap={3}>
                                <Text>
                                    {session?.mode === 'MULTIPLAYER'
                                        ? session.winnerUserId
                                            ? isCurrentUserWinner
                                                ? 'Матч завершён твоей победой. Ты первым выполнил все задания.'
                                                : `Матч завершён. Победил ${session.winnerUsername ?? 'другой игрок'}.`
                                            : 'Матч завершён по таймеру. Показываем итоговый прогресс по заданиям.'
                                        : allTasksCompleted
                                          ? 'Все задания выполнены. Одиночная сессия завершена.'
                                          : 'Время сессии истекло. Показываем итоговый результат по выполненным заданиям.'}
                                </Text>
                                <Text color="gray.600">
                                    Найдено предметов:{' '}
                                    {session?.completedTasksCount ?? 0}/
                                    {session?.totalTasksCount ?? 0}
                                </Text>
                                <Text color="gray.600">
                                    Всего попыток проверки:{' '}
                                    {session?.attemptsCount ?? 0}
                                </Text>
                                <Text color="gray.600">
                                    Получено опыта: {session?.awardedXp ?? 0} XP
                                </Text>
                                {session?.mode === 'MULTIPLAYER' &&
                                    rankedPlayers.length > 0 && (
                                        <>
                                            <Separator />
                                            <VStack align="stretch" gap={3}>
                                                <Text
                                                    fontWeight="700"
                                                    color="gray.800"
                                                >
                                                    Рейтинг игроков
                                                </Text>
                                                {rankedPlayers.map(
                                                    (player, index) => (
                                                        <HStack
                                                            key={player.userId}
                                                            justify="space-between"
                                                            align="stretch"
                                                            p={3}
                                                            borderRadius="xl"
                                                            bg={
                                                                player.isCurrentUser
                                                                    ? 'red.50'
                                                                    : 'gray.50'
                                                            }
                                                            borderWidth="1px"
                                                            borderColor={
                                                                player.userId ===
                                                                session?.winnerUserId
                                                                    ? 'green.200'
                                                                    : player.isCurrentUser
                                                                      ? 'red.200'
                                                                      : 'gray.200'
                                                            }
                                                        >
                                                            <HStack
                                                                align="flex-start"
                                                                gap={3}
                                                            >
                                                                <Box
                                                                    minW="32px"
                                                                    h="32px"
                                                                    borderRadius="full"
                                                                    bg={
                                                                        index ===
                                                                        0
                                                                            ? 'yellow.400'
                                                                            : 'gray.200'
                                                                    }
                                                                    color={
                                                                        index ===
                                                                        0
                                                                            ? 'yellow.950'
                                                                            : 'gray.700'
                                                                    }
                                                                    display="flex"
                                                                    alignItems="center"
                                                                    justifyContent="center"
                                                                    fontWeight="800"
                                                                >
                                                                    {index + 1}
                                                                </Box>
                                                                <Avatar.Root size="md">
                                                                    <Avatar.Fallback>
                                                                        {player.username
                                                                            .charAt(
                                                                                0
                                                                            )
                                                                            .toUpperCase()}
                                                                    </Avatar.Fallback>
                                                                    <Avatar.Image
                                                                        src={
                                                                            player.avatarUrl ??
                                                                            undefined
                                                                        }
                                                                    />
                                                                </Avatar.Root>
                                                                <VStack
                                                                    align="stretch"
                                                                    gap={1}
                                                                >
                                                                    <HStack
                                                                        gap={2}
                                                                    >
                                                                        <Text fontWeight="700">
                                                                            {
                                                                                player.username
                                                                            }
                                                                        </Text>
                                                                        {player.isCurrentUser && (
                                                                            <Badge colorPalette="red">
                                                                                Ты
                                                                            </Badge>
                                                                        )}
                                                                        {player.userId ===
                                                                            session?.winnerUserId && (
                                                                            <Badge colorPalette="green">
                                                                                Победитель
                                                                            </Badge>
                                                                        )}
                                                                    </HStack>
                                                                    <Text
                                                                        fontSize="sm"
                                                                        color="gray.600"
                                                                    >
                                                                        Найдено:{' '}
                                                                        {
                                                                            player.completedTasksCount
                                                                        }
                                                                        /
                                                                        {
                                                                            player.totalTasksCount
                                                                        }
                                                                    </Text>
                                                                </VStack>
                                                            </HStack>
                                                            <VStack
                                                                align="flex-end"
                                                                gap={1}
                                                            >
                                                                <Text
                                                                    fontSize="sm"
                                                                    color="gray.500"
                                                                >
                                                                    Попыток
                                                                </Text>
                                                                <Text
                                                                    fontWeight="800"
                                                                    color="gray.800"
                                                                >
                                                                    {
                                                                        player.attemptsCount
                                                                    }
                                                                </Text>
                                                            </VStack>
                                                        </HStack>
                                                    )
                                                )}
                                            </VStack>
                                        </>
                                    )}
                            </VStack>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Button variant="outline" onClick={onGoHome}>
                                В хаб
                            </Button>
                            <Button
                                colorPalette="red"
                                onClick={onRestart}
                                loading={isRestarting}
                            >
                                {session?.mode === 'MULTIPLAYER'
                                    ? 'Собрать новое лобби'
                                    : 'Сыграть ещё раз'}
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
};
