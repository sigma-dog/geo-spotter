import {
    Badge,
    Box,
    Heading,
    HStack,
    Separator,
    Spinner,
    Text,
    VStack,
} from '@chakra-ui/react';

import { useGetRecentGameSessionsQuery } from 'shared/api/game';

import { formatFinishedAt, getSessionModeLabel } from './utils';

export const GamesHistory = () => {
    const { data: recentSessions, isFetching: isRecentSessionsFetching } =
        useGetRecentGameSessionsQuery();

    return (
        <VStack
            h={{ base: 'auto', xl: 'full' }}
            align="stretch"
            gap={0}
            overflow="hidden"
            bgColor="bg.panel"
            borderRadius="lg"
            shadow="md"
        >
            <VStack
                align="stretch"
                gap={2}
                px={6}
                py={5}
                bg="linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)"
            >
                <HStack justify="space-between">
                    <Heading size="md" color="gray.900">
                        История матчей
                    </Heading>
                    {isRecentSessionsFetching && (
                        <Spinner size="sm" color="orange.500" />
                    )}
                </HStack>
                <Text fontSize="sm" color="gray.600">
                    Последние завершенные сессии, чтобы быстро оценить форму и
                    результаты матчей.
                </Text>
            </VStack>
            <Separator />
            <VStack
                align="stretch"
                gap={0}
                flex="1"
                minH={0}
                overflowY={{ base: 'visible', xl: 'auto' }}
            >
                {(recentSessions?.length ?? 0) === 0 ? (
                    <VStack align="stretch" gap={2} px={6} py={6}>
                        <Text fontWeight="700" color="gray.800">
                            Пока нет завершенных матчей
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                            Сыграй первую сессию, и здесь появится история твоих
                            результатов.
                        </Text>
                    </VStack>
                ) : (
                    recentSessions?.map((session, index) => (
                        <Box key={session.id}>
                            <VStack align="stretch" gap={3} px={6} py={5}>
                                <HStack justify="space-between">
                                    <HStack gap={2}>
                                        <Badge
                                            colorPalette={
                                                session.mode === 'MULTIPLAYER'
                                                    ? 'blue'
                                                    : 'orange'
                                            }
                                            variant="subtle"
                                        >
                                            {getSessionModeLabel(session.mode)}
                                        </Badge>
                                        <Badge
                                            colorPalette={
                                                session.status === 'COMPLETED'
                                                    ? 'green'
                                                    : 'gray'
                                            }
                                            variant="outline"
                                        >
                                            {session.status === 'COMPLETED'
                                                ? 'Завершена'
                                                : 'Прервана'}
                                        </Badge>
                                    </HStack>
                                    <Text fontSize="sm" color="gray.500">
                                        {formatFinishedAt(session.finishedAt)}
                                    </Text>
                                </HStack>
                                <VStack align="stretch" gap={1}>
                                    <Text fontWeight="700" color="gray.900">
                                        {session.mode === 'MULTIPLAYER'
                                            ? session.winnerUserId
                                                ? session.players.find(
                                                      (player) =>
                                                          player.isCurrentUser
                                                  )?.userId ===
                                                  session.winnerUserId
                                                    ? 'Победа в матче'
                                                    : `Победил ${session.winnerUsername ?? 'другой игрок'}`
                                                : 'Матч завершен по таймеру'
                                            : session.status === 'COMPLETED'
                                              ? 'Сессия завершена'
                                              : 'Сессия прервана'}
                                    </Text>
                                    <Text fontSize="sm" color="gray.600">
                                        Найдено {session.completedTasksCount}/
                                        {session.totalTasksCount} предметов
                                    </Text>
                                </VStack>
                                <HStack justify="space-between" gap={4}>
                                    <HStack>
                                        <VStack align="stretch" gap={0}>
                                            <Text
                                                fontSize="xs"
                                                color="gray.500"
                                            >
                                                Попыток
                                            </Text>
                                            <Text
                                                fontWeight="800"
                                                color="gray.900"
                                            >
                                                {session.attemptsCount}
                                            </Text>
                                        </VStack>

                                        {session.mode === 'MULTIPLAYER' && (
                                            <VStack align="stretch" gap={0}>
                                                <Text
                                                    fontSize="xs"
                                                    color="gray.500"
                                                >
                                                    Игроков
                                                </Text>
                                                <Text
                                                    fontWeight="800"
                                                    color="gray.900"
                                                >
                                                    {session.players.length}
                                                </Text>
                                            </VStack>
                                        )}
                                    </HStack>

                                    <VStack align="stretch" gap={0}>
                                        <Text fontSize="xs" color="gray.500">
                                            Опыт
                                        </Text>
                                        <Text fontWeight="800" color="gray.900">
                                            {session.awardedXp} XP
                                        </Text>
                                    </VStack>
                                </HStack>
                            </VStack>
                            {index < (recentSessions?.length ?? 0) - 1 && (
                                <Separator />
                            )}
                        </Box>
                    ))
                )}
            </VStack>
        </VStack>
    );
};
