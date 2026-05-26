import { LuArrowLeft, LuCheck, LuCircleDashed } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import {
    Accordion,
    Box,
    Button,
    HStack,
    Progress,
    Spinner,
    Text,
    VStack,
} from '@chakra-ui/react';

import { getUserLevelProgress } from 'shared/lib';
import type { User } from 'shared/types';

import type { GameSession, GameTask } from '../lib/types';

const DIFFICULTY_LABELS: Record<
    'EASY' | 'MEDIUM' | 'HARD' | 'LEGENDARY',
    string
> = {
    EASY: 'Легкое',
    HARD: 'Сложное',
    LEGENDARY: 'Легендарное',
    MEDIUM: 'Среднее',
};

const DIFFICULTY_COLORS: Record<
    'EASY' | 'MEDIUM' | 'HARD' | 'LEGENDARY',
    { bg: string; color: string }
> = {
    EASY: {
        bg: 'green.100',
        color: 'green.800',
    },
    HARD: {
        bg: 'red.100',
        color: 'red.800',
    },
    LEGENDARY: {
        bg: 'purple.100',
        color: 'purple.800',
    },
    MEDIUM: {
        bg: 'orange.100',
        color: 'orange.800',
    },
};

type GameSidebarProps = {
    activeTask: GameTask | null;
    currentUser: Pick<User, 'level' | 'xp' | 'username'> | null;
    debugCompletingTaskId: string | null;
    hasSelectedSpot: boolean;
    isStartingGame: boolean;
    isDebugMode: boolean;
    session: GameSession | null;
    onCompleteTaskForDebug: (taskId: string) => void;
};

export const GameSidebar = ({
    activeTask,
    currentUser,
    debugCompletingTaskId,
    hasSelectedSpot,
    isStartingGame,
    isDebugMode,
    session,
    onCompleteTaskForDebug,
}: GameSidebarProps) => {
    const navigate = useNavigate();
    const isSessionActive = session?.status === 'ACTIVE';
    const isSessionCompleted = session?.status === 'COMPLETED';
    const levelProgress = currentUser
        ? getUserLevelProgress(currentUser.xp, currentUser.level)
        : null;
    const nextLevel = (currentUser?.level ?? 0) + 1;

    return (
        <HStack align="flex-start" w="auto" pointerEvents="none">
            <VStack
                align="stretch"
                gap={4}
                minW="360px"
                maxW="500px"
                p={5}
                borderRadius="2xl"
                bg="white"
                boxShadow="sm"
                pointerEvents="auto"
            >
                <Button
                    size="sm"
                    variant="solid"
                    colorPalette="red"
                    justifyContent="flex-start"
                    onClick={() => navigate('/home')}
                >
                    <LuArrowLeft />В хаб
                </Button>

                <Box
                    p={4}
                    borderRadius="xl"
                    bg="red.50"
                    borderWidth="1px"
                    borderColor="red.100"
                >
                    <Text fontSize="sm" color="red.400">
                        Одиночная игра
                    </Text>
                    <Text fontSize="xl" fontWeight="700" color="red.700">
                        {isSessionActive
                            ? `Найди предметы: ${session.completedTasksCount}/${session.totalTasksCount}`
                            : isSessionCompleted
                              ? `Сессия завершена: ${session.completedTasksCount}/${session.totalTasksCount}`
                              : 'Создаем игровую сессию'}
                    </Text>
                    <Text mt={2} color="gray.600">
                        {isSessionActive
                            ? hasSelectedSpot
                                ? 'Перемещайся по карте, открывай панорамы и отправляй выделение на проверку.'
                                : 'Выбери точку на карте или кликни по покрытию Mapillary, чтобы открыть панораму.'
                            : isSessionCompleted
                              ? 'Все задания выполнены. Можно вернуться в хаб или сразу начать новую сессию.'
                              : 'Подбираем задания и готовим карту к поиску объектов.'}
                    </Text>
                    {!isSessionActive && isStartingGame && (
                        <HStack mt={4} color="red.500">
                            <Spinner size="sm" />
                            <Text fontSize="sm" fontWeight="600">
                                Запускаем игру...
                            </Text>
                        </HStack>
                    )}
                </Box>

                {currentUser && (
                    <Box
                        p={4}
                        borderRadius="xl"
                        bg="gray.50"
                        borderWidth="1px"
                        borderColor="gray.200"
                    >
                        <HStack justify="space-between" align="flex-start">
                            <Box>
                                <Text fontSize="sm" color="gray.500">
                                    Профиль
                                </Text>
                                <Text fontWeight="700" color="gray.800">
                                    {currentUser.username}
                                </Text>
                            </Box>
                            <Text fontWeight="700" color="red.600">
                                {currentUser.level} ур.
                            </Text>
                        </HStack>
                        <VStack align="stretch" gap={2} mt={3}>
                            <Progress.Root
                                value={levelProgress?.progressPercent ?? 0}
                                max={100}
                                colorPalette="red"
                                size="sm"
                                variant="subtle"
                            >
                                <Progress.Track>
                                    <Progress.Range />
                                </Progress.Track>
                            </Progress.Root>
                            <HStack justify="space-between">
                                <Text fontSize="sm" color="gray.600">
                                    {currentUser.xp} /{' '}
                                    {levelProgress?.nextLevelXp ?? 0} XP
                                </Text>
                                <Text fontSize="sm" color="gray.600">
                                    Следующий: {nextLevel} ур.
                                </Text>
                            </HStack>
                        </VStack>
                    </Box>
                )}

                {session && session.tasks.length > 0 && (
                    <VStack align="stretch" gap={3}>
                        <Text fontSize="sm" fontWeight="700" color="gray.700">
                            Список заданий
                        </Text>
                        <Accordion.Root
                            collapsible
                            defaultValue={
                                activeTask ? [activeTask.id] : undefined
                            }
                        >
                            {session.tasks.map((task, index) => {
                                const isCompleted = task.status === 'COMPLETED';
                                const isCurrentTask =
                                    activeTask?.id === task.id;

                                return (
                                    <Accordion.Item
                                        key={task.id}
                                        value={task.id}
                                    >
                                        <Accordion.ItemTrigger
                                            px={3}
                                            py={3}
                                            // borderRadius="xl"
                                            // borderWidth="1px"
                                            borderColor={
                                                isCompleted
                                                    ? 'green.200'
                                                    : isCurrentTask
                                                      ? 'red.200'
                                                      : 'gray.200'
                                            }
                                            bg={
                                                isCompleted
                                                    ? 'green.50'
                                                    : isCurrentTask
                                                      ? 'red.50'
                                                      : 'gray.50'
                                            }
                                        >
                                            <HStack
                                                flex="1"
                                                align="flex-start"
                                                gap={3}
                                            >
                                                <Box
                                                    pt={0.5}
                                                    color={
                                                        isCompleted
                                                            ? 'green.500'
                                                            : 'gray.400'
                                                    }
                                                >
                                                    {isCompleted ? (
                                                        <LuCheck />
                                                    ) : (
                                                        <LuCircleDashed />
                                                    )}
                                                </Box>
                                                <Box flex="1" textAlign="left">
                                                    <Text
                                                        fontWeight="700"
                                                        color="gray.800"
                                                    >
                                                        {index + 1}.{' '}
                                                        {task.target}
                                                    </Text>
                                                    {task.difficulty && (
                                                        <HStack mt={1} gap={2}>
                                                            <Box
                                                                px={2}
                                                                py={0.5}
                                                                borderRadius="full"
                                                                bg={
                                                                    DIFFICULTY_COLORS[
                                                                        task
                                                                            .difficulty
                                                                    ].bg
                                                                }
                                                                color={
                                                                    DIFFICULTY_COLORS[
                                                                        task
                                                                            .difficulty
                                                                    ].color
                                                                }
                                                            >
                                                                <Text
                                                                    fontSize="xs"
                                                                    fontWeight="700"
                                                                >
                                                                    {
                                                                        DIFFICULTY_LABELS[
                                                                            task
                                                                                .difficulty
                                                                        ]
                                                                    }
                                                                </Text>
                                                            </Box>
                                                            <Text
                                                                fontSize="xs"
                                                                color="gray.500"
                                                            >
                                                                {task.xpReward ??
                                                                    0}{' '}
                                                                XP
                                                            </Text>
                                                        </HStack>
                                                    )}
                                                </Box>
                                                {isDebugMode &&
                                                    !isCompleted &&
                                                    session?.status ===
                                                        'ACTIVE' && (
                                                        <Button
                                                            size="xs"
                                                            colorPalette="orange"
                                                            variant="outline"
                                                            loading={
                                                                debugCompletingTaskId ===
                                                                task.id
                                                            }
                                                            onClick={(
                                                                event
                                                            ) => {
                                                                event.stopPropagation();
                                                                onCompleteTaskForDebug(
                                                                    task.id
                                                                );
                                                            }}
                                                        >
                                                            Debug complete
                                                        </Button>
                                                    )}
                                            </HStack>
                                            <Accordion.ItemIndicator />
                                        </Accordion.ItemTrigger>
                                        <Accordion.ItemContent>
                                            <Accordion.ItemBody
                                                px={3}
                                                pb={3}
                                                pt={2}
                                            >
                                                <Text
                                                    fontSize="sm"
                                                    color="gray.600"
                                                >
                                                    {task.description}
                                                </Text>
                                            </Accordion.ItemBody>
                                        </Accordion.ItemContent>
                                    </Accordion.Item>
                                );
                            })}
                        </Accordion.Root>
                    </VStack>
                )}
            </VStack>
        </HStack>
    );
};
