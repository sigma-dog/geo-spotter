import { Button, Dialog, Portal, Text, VStack } from '@chakra-ui/react';

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
