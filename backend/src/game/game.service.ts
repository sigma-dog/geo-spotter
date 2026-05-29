import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import type { GameSession, Prisma } from '../../generated/prisma/client';
import {
    Difficulty,
    GameSessionMode,
    GameSessionStatus,
    GameSessionTaskStatus,
    MultiplayerLobbyParticipantStatus,
    MultiplayerLobbyStatus,
    MultiplayerMatchStatus,
    TaskAttemptStatus,
    TaskAttemptVerdict,
} from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitSelectionDto } from './dto/submit-selection.dto';
import {
    GAME_TASK_DIFFICULTY,
    SOLO_GAME_TASK_COUNT,
    SOLO_GAME_TASK_POOL,
    TASK_ATTEMPT_VERDICT,
    USER_XP_PER_LEVEL,
} from './game.constants';
import { GameAiClientService } from './game-ai-client.service';
import { GameDebugService } from './game-debug.service';
import { GameGateway } from './game.gateway';
import { GameMapillaryService } from './game-mapillary.service';
import { GameSessionStoreService } from './game-session-store.service';
import { GameSelectionVerifierService } from './game-selection-verifier.service';
import type { StoredGameSession } from './game-session.types';
import type {
    AiVerificationRequest,
    GameSessionView,
    MultiplayerLobbyView,
    MultiplayerPlayerProgressView,
    VerificationProgressEvent,
    VerificationResponse,
} from './game.types';

const ACTIVE_SESSION_INCLUDE = {
    gameSessionTasks: {
        include: {
            gameTask: true,
        },
        orderBy: {
            orderIndex: 'asc',
        },
    },
    _count: {
        select: {
            tasks: true,
        },
    },
    multiplayerMatch: {
        include: {
            sessions: {
                include: {
                    gameSessionTasks: {
                        include: {
                            gameTask: true,
                        },
                        orderBy: {
                            orderIndex: 'asc',
                        },
                    },
                    user: {
                        select: {
                            avatarUrl: true,
                            id: true,
                            username: true,
                        },
                    },
                    _count: {
                        select: {
                            tasks: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'asc',
                },
            },
            winner: {
                select: {
                    id: true,
                    username: true,
                },
            },
        },
    },
} satisfies Prisma.GameSessionInclude;

type SessionWithTasks = Prisma.GameSessionGetPayload<{
    include: typeof ACTIVE_SESSION_INCLUDE;
}>;

const MULTIPLAYER_LOBBY_INCLUDE = {
    participants: {
        include: {
            user: {
                select: {
                    avatarUrl: true,
                    id: true,
                    username: true,
                },
            },
        },
        orderBy: {
            createdAt: 'asc',
        },
    },
} satisfies Prisma.MultiplayerLobbyInclude;

type LobbyWithParticipants = Prisma.MultiplayerLobbyGetPayload<{
    include: typeof MULTIPLAYER_LOBBY_INCLUDE;
}>;

@Injectable()
export class GameService {
    constructor(
        private readonly gameAiClientService: GameAiClientService,
        private readonly gameDebugService: GameDebugService,
        private readonly gameGateway: GameGateway,
        private readonly gameMapillaryService: GameMapillaryService,
        private readonly gameSessionStoreService: GameSessionStoreService,
        private readonly gameSelectionVerifierService: GameSelectionVerifierService,
        private readonly prismaService: PrismaService
    ) {}

    async startSoloSession(userId: string): Promise<GameSessionView> {
        await this.assertUserExists(userId);

        const currentSession = await this.getCurrentSession(userId);

        if (currentSession?.status === 'ACTIVE') {
            return currentSession;
        }

        const session = await this.prismaService.$transaction(async (tx) => {
            const taskRecords = await Promise.all(
                SOLO_GAME_TASK_POOL.map((task) =>
                    tx.gameTask.upsert({
                        where: { externalId: task.externalId },
                        create: {
                            description: task.description,
                            difficulty: task.difficulty,
                            externalId: task.externalId,
                            target: task.target,
                            title: task.title,
                            xpReward: task.xpReward,
                        },
                        update: {
                            description: task.description,
                            difficulty: task.difficulty,
                            target: task.target,
                            title: task.title,
                            xpReward: task.xpReward,
                        },
                    })
                )
            );

            const selectedTasks = [
                this.pickRandomTaskByDifficulty(
                    taskRecords,
                    GAME_TASK_DIFFICULTY.easy
                ),
                this.pickRandomTaskByDifficulty(
                    taskRecords,
                    GAME_TASK_DIFFICULTY.medium
                ),
                this.pickRandomTaskByDifficulty(
                    taskRecords,
                    GAME_TASK_DIFFICULTY.hard
                ),
            ].slice(0, SOLO_GAME_TASK_COUNT);
            const createdSession = await tx.gameSession.create({
                data: {
                    mode: GameSessionMode.SOLO,
                    status: GameSessionStatus.ACTIVE,
                    userId,
                    gameSessionTasks: {
                        create: selectedTasks.map((task, orderIndex) => ({
                            gameTaskId: task.id,
                            orderIndex,
                            status: GameSessionTaskStatus.PENDING,
                        })),
                    },
                },
                include: ACTIVE_SESSION_INCLUDE,
            });

            return createdSession;
        });

        const sessionView = this.mapSessionView(session, userId);
        const storedSession = this.gameSessionStoreService.createStoredSession({
            durationSeconds: this.getSessionDurationSeconds(),
            session: sessionView,
            userId,
        });

        await this.gameSessionStoreService.saveSession(storedSession);

        return storedSession;
    }

    async createMultiplayerLobby(
        userId: string,
        friendIds: string[]
    ): Promise<MultiplayerLobbyView> {
        await this.assertUserExists(userId);

        const normalizedFriendIds = [...new Set(friendIds)];

        if (normalizedFriendIds.length === 0) {
            throw new BadRequestException(
                'Для многопользовательской игры нужен хотя бы один друг.'
            );
        }

        if (normalizedFriendIds.includes(userId)) {
            throw new BadRequestException('Нельзя добавить себя в своё лобби.');
        }

        await this.assertCanCreateMultiplayerLobby(userId, normalizedFriendIds);

        const existingLobby =
            await this.prismaService.multiplayerLobby.findFirst({
                where: {
                    hostId: userId,
                    status: MultiplayerLobbyStatus.PENDING,
                },
                select: {
                    id: true,
                },
            });

        if (existingLobby) {
            throw new BadRequestException(
                'У тебя уже есть ожидающее лобби. Дождись ответов друзей или закрой его.'
            );
        }

        const lobby = await this.prismaService.multiplayerLobby.create({
            data: {
                hostId: userId,
                status: MultiplayerLobbyStatus.PENDING,
                participants: {
                    create: [
                        {
                            respondedAt: new Date(),
                            status: MultiplayerLobbyParticipantStatus.ACCEPTED,
                            userId,
                        },
                        ...normalizedFriendIds.map((friendId) => ({
                            status: MultiplayerLobbyParticipantStatus.PENDING,
                            userId: friendId,
                        })),
                    ],
                },
            },
            include: MULTIPLAYER_LOBBY_INCLUDE,
        });

        const lobbyView = this.mapMultiplayerLobbyView(lobby, userId);

        this.gameGateway.emitMultiplayerLobbyCreated(normalizedFriendIds, {
            lobby: lobbyView,
        });
        this.gameGateway.emitMultiplayerLobbyUpdated([userId], {
            lobby: lobbyView,
        });

        return lobbyView;
    }

    async getPendingMultiplayerLobby(
        userId: string
    ): Promise<MultiplayerLobbyView | null> {
        await this.assertUserExists(userId);

        const lobby = await this.prismaService.multiplayerLobby.findFirst({
            where: {
                OR: [
                    {
                        hostId: userId,
                        status: MultiplayerLobbyStatus.PENDING,
                    },
                    {
                        participants: {
                            some: {
                                status: MultiplayerLobbyParticipantStatus.ACCEPTED,
                                userId,
                            },
                        },
                        status: MultiplayerLobbyStatus.PENDING,
                    },
                ],
            },
            include: MULTIPLAYER_LOBBY_INCLUDE,
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (!lobby) {
            return null;
        }

        return this.mapMultiplayerLobbyView(lobby, userId);
    }

    async getIncomingMultiplayerLobbies(
        userId: string
    ): Promise<MultiplayerLobbyView[]> {
        await this.assertUserExists(userId);

        const lobbies = await this.prismaService.multiplayerLobby.findMany({
            where: {
                participants: {
                    some: {
                        status: MultiplayerLobbyParticipantStatus.PENDING,
                        userId,
                    },
                },
                status: MultiplayerLobbyStatus.PENDING,
            },
            include: MULTIPLAYER_LOBBY_INCLUDE,
            orderBy: {
                createdAt: 'desc',
            },
        });

        return lobbies.map((lobby) =>
            this.mapMultiplayerLobbyView(lobby, userId)
        );
    }

    async respondToMultiplayerLobby(
        userId: string,
        lobbyId: string,
        accept: boolean
    ): Promise<MultiplayerLobbyView | null> {
        await this.assertUserExists(userId);

        const response = await this.prismaService.$transaction(async (tx) => {
            const lobby = await tx.multiplayerLobby.findUnique({
                where: {
                    id: lobbyId,
                },
                include: MULTIPLAYER_LOBBY_INCLUDE,
            });

            if (!lobby || lobby.status !== MultiplayerLobbyStatus.PENDING) {
                throw new NotFoundException(
                    'Приглашение в лобби не найдено или уже неактуально.'
                );
            }

            const participant = lobby.participants.find(
                (item) => item.userId === userId
            );

            if (!participant) {
                throw new NotFoundException('Ты не состоишь в этом лобби.');
            }

            if (participant.userId === lobby.hostId) {
                throw new BadRequestException(
                    'Хост не может подтверждать собственное приглашение.'
                );
            }

            if (
                participant.status !== MultiplayerLobbyParticipantStatus.PENDING
            ) {
                throw new BadRequestException(
                    'Ты уже ответил на это приглашение.'
                );
            }

            await tx.multiplayerLobbyParticipant.update({
                where: {
                    id: participant.id,
                },
                data: {
                    respondedAt: new Date(),
                    status: accept
                        ? MultiplayerLobbyParticipantStatus.ACCEPTED
                        : MultiplayerLobbyParticipantStatus.DECLINED,
                },
            });

            if (!accept) {
                const cancelledLobby = await tx.multiplayerLobby.update({
                    where: {
                        id: lobby.id,
                    },
                    data: {
                        status: MultiplayerLobbyStatus.CANCELLED,
                    },
                    include: MULTIPLAYER_LOBBY_INCLUDE,
                });

                return {
                    lobby: cancelledLobby,
                    shouldStartMatch: false,
                };
            }

            const updatedLobby = await tx.multiplayerLobby.findUnique({
                where: {
                    id: lobby.id,
                },
                include: MULTIPLAYER_LOBBY_INCLUDE,
            });

            if (!updatedLobby) {
                throw new NotFoundException(
                    'Лобби не найдено после обновления.'
                );
            }

            const hasPendingInvitees = updatedLobby.participants.some(
                (item) =>
                    item.userId !== updatedLobby.hostId &&
                    item.status === MultiplayerLobbyParticipantStatus.PENDING
            );

            return {
                lobby: updatedLobby,
                shouldStartMatch: !hasPendingInvitees,
            };
        });

        if (response.shouldStartMatch) {
            const { lobby } = await this.startMultiplayerMatchFromLobby(
                userId,
                response.lobby.id
            );

            this.gameGateway.emitMultiplayerLobbyUpdated(
                response.lobby.participants.map(
                    (participant) => participant.userId
                ),
                {
                    lobby,
                }
            );

            return lobby;
        }

        this.gameGateway.emitMultiplayerLobbyUpdated(
            response.lobby.participants.map(
                (participant) => participant.userId
            ),
            {
                lobby: this.mapMultiplayerLobbyView(response.lobby, userId),
            }
        );

        return this.mapMultiplayerLobbyView(response.lobby, userId);
    }

    async getActiveSession(userId: string): Promise<GameSessionView | null> {
        await this.assertUserExists(userId);

        return this.getCurrentSession(userId);
    }

    async getRecentSessions(userId: string): Promise<GameSessionView[]> {
        await this.assertUserExists(userId);

        const sessions = await this.prismaService.gameSession.findMany({
            where: {
                status: {
                    in: [
                        GameSessionStatus.COMPLETED,
                        GameSessionStatus.ABANDONED,
                    ],
                },
                userId,
            },
            include: ACTIVE_SESSION_INCLUDE,
            orderBy: {
                finishedAt: 'desc',
            },
            take: 10,
        });

        return sessions.map((session) => this.mapSessionView(session, userId));
    }

    async completeTaskForDebug(
        userId: string,
        sessionId: string,
        sessionTaskId: string
    ): Promise<GameSessionView> {
        await this.assertUserExists(userId);

        if (!this.gameDebugService.isGameplayDebugEnabled()) {
            throw new NotFoundException('Debug endpoint is unavailable.');
        }

        const currentSession = await this.requireActiveSession(
            userId,
            sessionId
        );

        const session = await this.prismaService.gameSession.findFirst({
            where: {
                id: sessionId,
                userId,
                status: GameSessionStatus.ACTIVE,
            },
            include: {
                gameSessionTasks: {
                    where: {
                        id: sessionTaskId,
                    },
                    include: {
                        gameTask: true,
                    },
                },
            },
        });

        if (!session) {
            throw new NotFoundException(
                'Активная игровая сессия не найдена или уже завершена.'
            );
        }

        const sessionTask = session.gameSessionTasks[0];

        if (!sessionTask) {
            throw new NotFoundException(
                'Выбранное задание не найдено в активной сессии.'
            );
        }

        await this.completeMatchedTask({
            sessionId: session.id,
            sessionMode: session.mode,
            sessionTaskId: sessionTask.id,
            userId,
        });

        const refreshedSession = await this.refreshStoredSession(
            userId,
            session.id,
            currentSession.expiresAt
        );

        this.notifyMultiplayerProgressIfNeeded(refreshedSession);

        return refreshedSession;
    }

    async submitSelection(
        userId: string,
        dto: SubmitSelectionDto
    ): Promise<VerificationResponse> {
        await this.assertUserExists(userId);
        const currentSession = await this.requireActiveSession(
            userId,
            dto.sessionId
        );

        const session = await this.prismaService.gameSession.findFirst({
            where: {
                id: dto.sessionId,
                userId,
                status: GameSessionStatus.ACTIVE,
            },
            include: {
                gameSessionTasks: {
                    where: {
                        id: dto.sessionTaskId,
                    },
                    include: {
                        gameTask: true,
                    },
                },
            },
        });

        if (!session) {
            throw new NotFoundException(
                'Активная игровая сессия не найдена или уже завершена.'
            );
        }

        const sessionTask = session.gameSessionTasks[0];

        if (!sessionTask) {
            throw new NotFoundException(
                'Выбранное задание не найдено в сессии.'
            );
        }

        if (sessionTask.status === GameSessionTaskStatus.COMPLETED) {
            throw new BadRequestException(
                'Это задание уже выполнено. Выбери другое задание из списка.'
            );
        }

        const resolvedTask = {
            id: sessionTask.gameTask.externalId,
            target: sessionTask.gameTask.target,
            title: sessionTask.gameTask.title,
        };
        const gameTask = sessionTask.gameTask;
        const attempt = await this.prismaService.taskAttempt.create({
            data: {
                capturedAt: new Date(dto.capturedAt),
                gameTaskId: gameTask.id,
                imageId: dto.imageId,
                selectionHeight: dto.selection.height,
                selectionLeft: dto.selection.left,
                selectionTop: dto.selection.top,
                selectionWidth: dto.selection.width,
                sessionId: session.id,
                sessionTaskId: sessionTask.id,
                status: TaskAttemptStatus.PENDING,
                userId,
                worldLat: dto.worldLocation.lat,
                worldLng: dto.worldLocation.lng,
            },
        });
        this.emitVerificationProgress(userId, {
            attemptId: attempt.id,
            message: 'Фиксируем попытку и подготавливаем данные.',
            progress: 8,
            sessionId: session.id,
            sessionTaskId: sessionTask.id,
            stage: 'started',
        });

        try {
            this.emitVerificationProgress(userId, {
                attemptId: attempt.id,
                message: 'Готовим crop и исходный кадр для анализа.',
                progress: 22,
                sessionId: session.id,
                sessionTaskId: sessionTask.id,
                stage: 'preparing_asset',
            });
            const asset = await this.gameMapillaryService.prepareSelectionAsset(
                dto.imageId,
                dto.selection,
                dto.imageThumbUrl,
                dto.sourceImageBase64
            );
            const verificationPayload = this.createAiVerificationPayload(
                attempt.id,
                resolvedTask,
                asset
            );
            await this.gameDebugService.saveSelectionArtifacts({
                asset,
                attemptId: attempt.id,
                dto: {
                    ...dto,
                    task: resolvedTask,
                },
                verificationPayload,
            });
            this.emitVerificationProgress(userId, {
                attemptId: attempt.id,
                message: 'Отправляем данные в AI-сервис.',
                progress: 42,
                sessionId: session.id,
                sessionTaskId: sessionTask.id,
                stage: 'sending_to_ai',
            });
            const verification = await this.verifySelection(
                verificationPayload,
                userId,
                {
                    ...dto,
                    task: resolvedTask,
                }
            );
            this.emitVerificationProgress(userId, {
                attemptId: attempt.id,
                message: 'Получили ответ и применяем результат.',
                progress: 74,
                sessionId: session.id,
                sessionTaskId: sessionTask.id,
                stage: 'applying_result',
            });

            await this.prismaService.taskAttempt.update({
                where: { id: attempt.id },
                data: {
                    confidence: verification.confidence,
                    cropHeightPx: asset.cropHeightPx,
                    cropWidthPx: asset.cropWidthPx,
                    mapillaryImageUrl: asset.imageUrl,
                    reason: verification.reason,
                    source: verification.source,
                    sourceImageHeight: asset.sourceImageHeight,
                    sourceImageWidth: asset.sourceImageWidth,
                    status: TaskAttemptStatus.COMPLETED,
                    verdict: this.mapVerdictToPrisma(verification.verdict),
                },
            });

            let taskCompleted = false;
            let sessionCompleted = false;
            let awardedXp = 0;
            let currentLevel: number | undefined;
            let currentXp: number | undefined;

            if (verification.verdict === TASK_ATTEMPT_VERDICT.match) {
                const completionState = await this.completeMatchedTask({
                    attemptId: attempt.id,
                    sessionId: session.id,
                    sessionMode: session.mode,
                    sessionTaskId: sessionTask.id,
                    userId,
                });

                awardedXp = completionState.awardedXp;
                currentLevel = completionState.currentLevel;
                currentXp = completionState.currentXp;
                taskCompleted = completionState.taskCompleted;
                sessionCompleted = completionState.sessionCompleted;
            }

            this.emitVerificationProgress(userId, {
                attemptId: attempt.id,
                message: 'Синхронизируем состояние игровой сессии.',
                progress: 88,
                sessionId: session.id,
                sessionTaskId: sessionTask.id,
                stage: 'syncing_session',
            });
            const refreshedSession = await this.refreshStoredSession(
                userId,
                session.id,
                currentSession.expiresAt
            );

            if (taskCompleted || sessionCompleted) {
                this.notifyMultiplayerProgressIfNeeded(refreshedSession);
            }

            this.emitVerificationProgress(userId, {
                attemptId: attempt.id,
                message: 'Проверка завершена.',
                progress: 100,
                sessionId: session.id,
                sessionTaskId: sessionTask.id,
                stage: 'completed',
            });

            return {
                attemptId: attempt.id,
                awardedXp,
                confidence: verification.confidence,
                currentLevel,
                currentXp,
                debug: verification.debug ?? null,
                reason: verification.reason,
                sessionCompleted,
                source: verification.source,
                taskCompleted,
                verdict: verification.verdict,
            };
        } catch (error) {
            const failureReason =
                error instanceof Error
                    ? error.message
                    : 'Не удалось обработать выделенный объект.';

            await this.prismaService.taskAttempt.update({
                where: { id: attempt.id },
                data: {
                    reason: failureReason,
                    status: TaskAttemptStatus.FAILED,
                },
            });
            this.emitVerificationProgress(userId, {
                attemptId: attempt.id,
                message: failureReason,
                progress: 100,
                sessionId: session.id,
                sessionTaskId: sessionTask.id,
                stage: 'failed',
            });

            await this.refreshStoredSession(
                userId,
                session.id,
                currentSession.expiresAt
            );

            if (error instanceof Error) {
                throw error;
            }

            throw new InternalServerErrorException(failureReason);
        }
    }

    private async completeMatchedTask(params: {
        attemptId?: string;
        sessionId: string;
        sessionMode: GameSession['mode'];
        sessionTaskId: string;
        userId: string;
    }) {
        return this.prismaService.$transaction(async (tx) => {
            const task = await tx.gameSessionTask.findUnique({
                where: {
                    id: params.sessionTaskId,
                },
                select: {
                    gameTask: {
                        select: {
                            xpReward: true,
                        },
                    },
                    session: {
                        select: {
                            multiplayerMatchId: true,
                        },
                    },
                    status: true,
                },
            });

            if (!task) {
                throw new NotFoundException('Игровое задание не найдено.');
            }

            if (task.status === GameSessionTaskStatus.COMPLETED) {
                return {
                    awardedXp: 0,
                    currentLevel: undefined,
                    currentXp: undefined,
                    sessionCompleted: false,
                    taskCompleted: false,
                };
            }

            await tx.gameSessionTask.update({
                where: {
                    id: params.sessionTaskId,
                },
                data: {
                    completedAt: new Date(),
                    completedByAttemptId: params.attemptId ?? null,
                    status: GameSessionTaskStatus.COMPLETED,
                },
            });

            const user = await tx.user.findUnique({
                where: {
                    id: params.userId,
                },
                select: {
                    xp: true,
                },
            });

            if (!user) {
                throw new NotFoundException(
                    `Пользователь с id ${params.userId} не найден.`
                );
            }

            const awardedXp = task.gameTask.xpReward;
            const nextXp = user.xp + awardedXp;
            const nextLevel = this.calculateLevel(nextXp);

            await tx.user.update({
                where: {
                    id: params.userId,
                },
                data: {
                    level: nextLevel,
                    xp: nextXp,
                },
            });

            const pendingTasksCount = await tx.gameSessionTask.count({
                where: {
                    sessionId: params.sessionId,
                    status: GameSessionTaskStatus.PENDING,
                },
            });

            const shouldCompleteSession =
                pendingTasksCount === 0 &&
                params.sessionMode === GameSessionMode.SOLO;

            const shouldCompleteMultiplayerMatch =
                pendingTasksCount === 0 &&
                params.sessionMode === GameSessionMode.MULTIPLAYER &&
                !!task.session?.multiplayerMatchId;

            if (shouldCompleteSession) {
                await tx.gameSession.update({
                    where: {
                        id: params.sessionId,
                    },
                    data: {
                        finishedAt: new Date(),
                        status: GameSessionStatus.COMPLETED,
                    },
                });
            }

            if (shouldCompleteMultiplayerMatch) {
                const finishedAt = new Date();
                const multiplayerMatchId = task.session.multiplayerMatchId;

                if (!multiplayerMatchId) {
                    throw new InternalServerErrorException(
                        'Для мультиплеерной сессии не найден идентификатор матча.'
                    );
                }

                await tx.multiplayerMatch.updateMany({
                    where: {
                        id: multiplayerMatchId,
                        status: MultiplayerMatchStatus.ACTIVE,
                    },
                    data: {
                        finishedAt,
                        status: MultiplayerMatchStatus.COMPLETED,
                        winnerUserId: params.userId,
                    },
                });

                await tx.gameSession.updateMany({
                    where: {
                        multiplayerMatchId,
                        status: GameSessionStatus.ACTIVE,
                    },
                    data: {
                        finishedAt,
                        status: GameSessionStatus.COMPLETED,
                    },
                });
            }

            return {
                awardedXp,
                currentLevel: nextLevel,
                currentXp: nextXp,
                sessionCompleted:
                    shouldCompleteSession || shouldCompleteMultiplayerMatch,
                taskCompleted: true,
            };
        });
    }

    private createAiVerificationPayload(
        attemptId: string,
        task: {
            id: string;
            target: string;
            title: string;
        },
        asset: Awaited<
            ReturnType<GameMapillaryService['prepareSelectionAsset']>
        >
    ): AiVerificationRequest {
        return {
            attemptId,
            image: {
                cropBase64: asset.cropBuffer.toString('base64'),
                cropHeightPx: asset.cropHeightPx,
                cropMimeType: 'image/png',
                cropWidthPx: asset.cropWidthPx,
                sourceImageHeight: asset.sourceImageHeight,
                sourceImageUrl: asset.imageUrl,
                sourceImageWidth: asset.sourceImageWidth,
            },
            task,
        };
    }

    private async verifySelection(
        payload: AiVerificationRequest,
        userId: string,
        dto: SubmitSelectionDto
    ) {
        try {
            this.emitVerificationProgress(userId, {
                attemptId: payload.attemptId,
                message: 'AI-сервис анализирует объект.',
                progress: 58,
                sessionId: dto.sessionId,
                sessionTaskId: dto.sessionTaskId,
                stage: 'awaiting_ai_result',
            });
            return await this.gameAiClientService.verifySelection(payload);
        } catch {
            this.emitVerificationProgress(userId, {
                attemptId: payload.attemptId,
                message: 'AI-сервис недоступен, используем локальный verifier.',
                progress: 66,
                sessionId: dto.sessionId,
                sessionTaskId: dto.sessionTaskId,
                stage: 'fallback_mock',
            });
            return this.gameSelectionVerifierService.verifySelection({
                asset: {
                    cropBuffer: Buffer.from(payload.image.cropBase64, 'base64'),
                    cropHeightPx: payload.image.cropHeightPx,
                    cropLeftPx: 0,
                    cropTopPx: 0,
                    cropWidthPx: payload.image.cropWidthPx,
                    imageUrl: payload.image.sourceImageUrl,
                    sourceImageBuffer: Buffer.alloc(0),
                    sourceImageHeight: payload.image.sourceImageHeight,
                    sourceImagePngBuffer: Buffer.alloc(0),
                    sourceImageWidth: payload.image.sourceImageWidth,
                },
                task: dto.task,
            });
        }
    }

    private emitVerificationProgress(
        userId: string,
        payload: VerificationProgressEvent
    ) {
        this.gameGateway.emitVerificationProgress(userId, payload);
    }

    private mapSessionView(
        session: SessionWithTasks,
        currentUserId: string
    ): GameSessionView {
        const completedTasksCount = session.gameSessionTasks.filter(
            (task) => task.status === GameSessionTaskStatus.COMPLETED
        ).length;
        const awardedXp = session.gameSessionTasks
            .filter((task) => task.status === GameSessionTaskStatus.COMPLETED)
            .reduce((total, task) => total + task.gameTask.xpReward, 0);
        const players = this.mapMultiplayerPlayers(session, currentUserId);
        const winnerUserId = session.multiplayerMatch?.winner?.id ?? null;
        const winnerUsername =
            session.multiplayerMatch?.winner?.username ?? null;

        return {
            attemptsCount: session._count.tasks,
            awardedXp,
            completedTasksCount,
            expiresAt: null,
            finishedAt: session.finishedAt?.toISOString() ?? null,
            id: session.id,
            mode: session.mode,
            multiplayerMatchId: session.multiplayerMatchId ?? null,
            players,
            startedAt: session.startedAt.toISOString(),
            status: session.status,
            tasks: session.gameSessionTasks.map((task) => ({
                completedAt: task.completedAt?.toISOString() ?? null,
                description: task.gameTask.description,
                difficulty: task.gameTask.difficulty,
                id: task.id,
                orderIndex: task.orderIndex,
                status: task.status,
                target: task.gameTask.target,
                title: task.gameTask.title,
                xpReward: task.gameTask.xpReward,
            })),
            totalTasksCount: session.gameSessionTasks.length,
            winnerUserId,
            winnerUsername,
        };
    }

    private mapMultiplayerPlayers(
        session: SessionWithTasks,
        currentUserId: string
    ): MultiplayerPlayerProgressView[] {
        if (!session.multiplayerMatch) {
            return [];
        }

        return session.multiplayerMatch.sessions.map((playerSession) => ({
            avatarUrl: playerSession.user.avatarUrl,
            completedTasksCount: playerSession.gameSessionTasks.filter(
                (task) => task.status === GameSessionTaskStatus.COMPLETED
            ).length,
            isCurrentUser: playerSession.userId === currentUserId,
            status: playerSession.status,
            totalTasksCount: playerSession.gameSessionTasks.length,
            userId: playerSession.user.id,
            username: playerSession.user.username,
        }));
    }

    private mapMultiplayerLobbyView(
        lobby: LobbyWithParticipants,
        currentUserId: string
    ): MultiplayerLobbyView {
        return {
            createdAt: lobby.createdAt.toISOString(),
            hostUserId: lobby.hostId,
            id: lobby.id,
            matchId: lobby.matchId ?? null,
            participants: lobby.participants.map((participant) => ({
                avatarUrl: participant.user.avatarUrl,
                isCurrentUser: participant.userId === currentUserId,
                isHost: participant.userId === lobby.hostId,
                respondedAt: participant.respondedAt?.toISOString() ?? null,
                status: participant.status,
                userId: participant.userId,
                username: participant.user.username,
            })),
            status: lobby.status,
        };
    }

    private mapVerdictToPrisma(verdict: VerificationResponse['verdict']) {
        if (verdict === TASK_ATTEMPT_VERDICT.match) {
            return TaskAttemptVerdict.MATCH;
        }

        if (verdict === TASK_ATTEMPT_VERDICT.noMatch) {
            return TaskAttemptVerdict.NO_MATCH;
        }

        if (verdict === TASK_ATTEMPT_VERDICT.uncertain) {
            return TaskAttemptVerdict.UNCERTAIN;
        }

        throw new InternalServerErrorException(
            'Неизвестный verdict при обновлении TaskAttempt.'
        );
    }

    private async assertUserExists(userId: string) {
        const user = await this.prismaService.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });

        if (!user) {
            throw new NotFoundException(
                `Пользователь с id ${userId} не найден.`
            );
        }
    }

    private async assertCanCreateMultiplayerLobby(
        userId: string,
        friendIds: string[]
    ) {
        const participantIds = [userId, ...friendIds];
        const [users, friendships, activeSessions, pendingLobbies] =
            await Promise.all([
                this.prismaService.user.findMany({
                    where: {
                        id: {
                            in: participantIds,
                        },
                    },
                    select: {
                        id: true,
                    },
                }),
                this.prismaService.friendship.findMany({
                    where: {
                        status: 'ACCEPTED',
                        OR: friendIds.flatMap((friendId) => [
                            {
                                addresseeId: friendId,
                                requesterId: userId,
                            },
                            {
                                addresseeId: userId,
                                requesterId: friendId,
                            },
                        ]),
                    },
                    select: {
                        id: true,
                    },
                }),
                this.prismaService.gameSession.findMany({
                    where: {
                        status: GameSessionStatus.ACTIVE,
                        userId: {
                            in: participantIds,
                        },
                    },
                    include: {
                        user: {
                            select: {
                                username: true,
                            },
                        },
                    },
                }),
                this.prismaService.multiplayerLobbyParticipant.findMany({
                    where: {
                        userId: {
                            in: participantIds,
                        },
                        lobby: {
                            status: MultiplayerLobbyStatus.PENDING,
                        },
                    },
                    include: {
                        user: {
                            select: {
                                username: true,
                            },
                        },
                    },
                }),
            ]);

        if (users.length !== participantIds.length) {
            throw new NotFoundException('Один из выбранных друзей не найден.');
        }

        if (friendships.length !== friendIds.length) {
            throw new BadRequestException(
                'В лобби можно добавить только подтверждённых друзей.'
            );
        }

        if (activeSessions.length > 0) {
            throw new BadRequestException(
                `У игроков уже есть активная сессия: ${activeSessions
                    .map((session) => session.user.username)
                    .join(', ')}.`
            );
        }

        if (pendingLobbies.length > 0) {
            throw new BadRequestException(
                `Некоторые игроки уже состоят в ожидающем лобби: ${pendingLobbies
                    .map((participant) => participant.user.username)
                    .join(', ')}.`
            );
        }
    }

    private async startMultiplayerMatchFromLobby(
        currentUserId: string,
        lobbyId: string
    ) {
        const sessionDurationSeconds = this.getSessionDurationSeconds();
        const lobby = await this.prismaService.$transaction(async (tx) => {
            const existingLobby = await tx.multiplayerLobby.findUnique({
                where: {
                    id: lobbyId,
                },
                include: MULTIPLAYER_LOBBY_INCLUDE,
            });

            if (!existingLobby) {
                throw new NotFoundException('Лобби не найдено.');
            }

            if (existingLobby.status !== MultiplayerLobbyStatus.PENDING) {
                throw new BadRequestException('Лобби уже неактивно.');
            }

            const participantIds = existingLobby.participants.map(
                (participant) => participant.userId
            );

            const selectedTasks = await this.createSelectedTaskSet(tx);
            const createdMatch = await tx.multiplayerMatch.create({
                data: {
                    hostId: existingLobby.hostId,
                    status: MultiplayerMatchStatus.ACTIVE,
                    sessions: {
                        create: participantIds.map((participantId) => ({
                            mode: GameSessionMode.MULTIPLAYER,
                            status: GameSessionStatus.ACTIVE,
                            userId: participantId,
                            gameSessionTasks: {
                                create: selectedTasks.map(
                                    (task, orderIndex) => ({
                                        gameTaskId: task.id,
                                        orderIndex,
                                        status: GameSessionTaskStatus.PENDING,
                                    })
                                ),
                            },
                        })),
                    },
                },
                select: {
                    id: true,
                },
            });

            await tx.multiplayerLobby.update({
                where: {
                    id: existingLobby.id,
                },
                data: {
                    matchId: createdMatch.id,
                    status: MultiplayerLobbyStatus.STARTED,
                },
            });

            return tx.multiplayerLobby.findUnique({
                where: {
                    id: existingLobby.id,
                },
                include: MULTIPLAYER_LOBBY_INCLUDE,
            });
        });

        if (!lobby) {
            throw new InternalServerErrorException(
                'Не удалось запустить матч из лобби.'
            );
        }

        const participantIds = lobby.participants.map(
            (participant) => participant.userId
        );
        const sessions = await this.prismaService.gameSession.findMany({
            where: {
                multiplayerMatchId: lobby.matchId,
            },
            include: ACTIVE_SESSION_INCLUDE,
            orderBy: {
                createdAt: 'asc',
            },
        });

        await Promise.all(
            sessions.map(async (session) => {
                const sessionView = this.mapSessionView(
                    session,
                    session.userId
                );
                const storedSession =
                    this.gameSessionStoreService.createStoredSession({
                        durationSeconds: sessionDurationSeconds,
                        session: sessionView,
                        userId: session.userId,
                    });

                await this.gameSessionStoreService.saveSession(storedSession);
            })
        );

        this.gameGateway.emitMultiplayerSessionStarted(participantIds, {
            lobbyId: lobby.id,
            matchId: lobby.matchId,
            startedAt: new Date().toISOString(),
        });

        return {
            lobby: this.mapMultiplayerLobbyView(lobby, currentUserId),
            session:
                sessions.find((session) => session.userId === currentUserId) ??
                null,
        };
    }

    private async createSelectedTaskSet(tx: Prisma.TransactionClient) {
        const taskRecords = await Promise.all(
            SOLO_GAME_TASK_POOL.map((task) =>
                tx.gameTask.upsert({
                    where: { externalId: task.externalId },
                    create: {
                        description: task.description,
                        difficulty: task.difficulty,
                        externalId: task.externalId,
                        target: task.target,
                        title: task.title,
                        xpReward: task.xpReward,
                    },
                    update: {
                        description: task.description,
                        difficulty: task.difficulty,
                        target: task.target,
                        title: task.title,
                        xpReward: task.xpReward,
                    },
                })
            )
        );

        return [
            this.pickRandomTaskByDifficulty(
                taskRecords,
                GAME_TASK_DIFFICULTY.easy
            ),
            this.pickRandomTaskByDifficulty(
                taskRecords,
                GAME_TASK_DIFFICULTY.medium
            ),
            this.pickRandomTaskByDifficulty(
                taskRecords,
                GAME_TASK_DIFFICULTY.hard
            ),
        ].slice(0, SOLO_GAME_TASK_COUNT);
    }

    private shuffle<T>(items: T[]) {
        const nextItems = [...items];

        for (let index = nextItems.length - 1; index > 0; index -= 1) {
            const randomIndex = Math.floor(Math.random() * (index + 1));
            const currentItem = nextItems[index];

            nextItems[index] = nextItems[randomIndex];
            nextItems[randomIndex] = currentItem;
        }

        return nextItems;
    }

    private pickRandomTaskByDifficulty<T extends { difficulty: Difficulty }>(
        tasks: T[],
        difficulty: Difficulty
    ) {
        const matchingTasks = tasks.filter(
            (task) => task.difficulty === difficulty
        );

        if (matchingTasks.length === 0) {
            throw new InternalServerErrorException(
                `Не найдено игровых заданий сложности ${difficulty}.`
            );
        }

        const [randomTask] = this.shuffle(matchingTasks);

        if (!randomTask) {
            throw new InternalServerErrorException(
                `Не удалось выбрать игровое задание сложности ${difficulty}.`
            );
        }

        return randomTask;
    }

    private calculateLevel(xp: number) {
        return Math.floor(xp / USER_XP_PER_LEVEL);
    }

    private async getCurrentSession(
        userId: string
    ): Promise<GameSessionView | null> {
        const cachedSession =
            await this.gameSessionStoreService.getCurrentSession(userId);

        if (cachedSession) {
            if (
                cachedSession.status === 'ACTIVE' &&
                this.gameSessionStoreService.isExpired(cachedSession)
            ) {
                return this.finalizeStoredSessionByTimeout(cachedSession);
            }

            if (cachedSession.mode === 'MULTIPLAYER') {
                return this.refreshStoredSession(
                    userId,
                    cachedSession.id,
                    cachedSession.expiresAt
                );
            }

            return cachedSession;
        }

        await this.finalizeOrphanedActiveSessions(userId);

        return null;
    }

    private async requireActiveSession(userId: string, sessionId: string) {
        const currentSession = await this.getCurrentSession(userId);

        if (!currentSession || currentSession.id !== sessionId) {
            throw new NotFoundException(
                'Активная игровая сессия не найдена или уже завершена.'
            );
        }

        if (currentSession.status !== 'ACTIVE') {
            throw new BadRequestException(
                'Игровая сессия уже завершена. Вернись в хаб и начни новую.'
            );
        }

        return currentSession as StoredGameSession;
    }

    private async refreshStoredSession(
        userId: string,
        sessionId: string,
        expiresAt: string
    ) {
        const updatedSession = await this.prismaService.gameSession.findUnique({
            where: {
                id: sessionId,
            },
            include: ACTIVE_SESSION_INCLUDE,
        });

        if (!updatedSession) {
            throw new NotFoundException(
                'Игровая сессия не найдена после обновления.'
            );
        }

        const storedSession: StoredGameSession = {
            ...this.mapSessionView(updatedSession, userId),
            expiresAt,
            userId,
        };

        await this.gameSessionStoreService.saveSession(storedSession);

        return storedSession;
    }

    private notifyMultiplayerProgressIfNeeded(session: GameSessionView) {
        if (!session.multiplayerMatchId) {
            return;
        }

        this.gameGateway.emitMultiplayerProgressUpdated(
            session.multiplayerMatchId,
            session.players.map((player) => player.userId),
            {
                matchId: session.multiplayerMatchId,
                players: session.players,
                sessionId: session.id,
                status: session.status,
                winnerUserId: session.winnerUserId,
                winnerUsername: session.winnerUsername,
            }
        );
    }

    private async finalizeStoredSessionByTimeout(session: StoredGameSession) {
        const finishedAt = new Date();

        if (session.multiplayerMatchId) {
            await this.prismaService.multiplayerMatch.updateMany({
                where: {
                    id: session.multiplayerMatchId,
                    status: MultiplayerMatchStatus.ACTIVE,
                },
                data: {
                    finishedAt,
                    status: MultiplayerMatchStatus.ABANDONED,
                },
            });

            await this.prismaService.gameSession.updateMany({
                where: {
                    multiplayerMatchId: session.multiplayerMatchId,
                    status: GameSessionStatus.ACTIVE,
                },
                data: {
                    finishedAt,
                    status: GameSessionStatus.COMPLETED,
                },
            });
        } else {
            await this.prismaService.gameSession.updateMany({
                where: {
                    id: session.id,
                    status: GameSessionStatus.ACTIVE,
                },
                data: {
                    finishedAt,
                    status: GameSessionStatus.COMPLETED,
                },
            });
        }

        const refreshedSession = await this.refreshStoredSession(
            session.userId,
            session.id,
            session.expiresAt
        );

        this.notifyMultiplayerProgressIfNeeded(refreshedSession);

        return refreshedSession;
    }

    private async finalizeCurrentSession(
        userId: string,
        status: 'ABANDONED' | 'COMPLETED'
    ) {
        const currentSession =
            await this.gameSessionStoreService.getCurrentSession(userId);

        if (currentSession) {
            await this.prismaService.gameSession.updateMany({
                where: {
                    id: currentSession.id,
                    status: GameSessionStatus.ACTIVE,
                },
                data: {
                    finishedAt: new Date(),
                    status:
                        status === 'COMPLETED'
                            ? GameSessionStatus.COMPLETED
                            : GameSessionStatus.ABANDONED,
                },
            });

            await this.gameSessionStoreService.deleteSession(
                userId,
                currentSession.id
            );
        }
    }

    private async finalizeOrphanedActiveSessions(userId: string) {
        const activeSessions = await this.prismaService.gameSession.findMany({
            where: {
                status: GameSessionStatus.ACTIVE,
                userId,
            },
            select: {
                id: true,
                mode: true,
                multiplayerMatchId: true,
            },
        });

        if (activeSessions.length === 0) {
            return;
        }

        const finishedAt = new Date();
        const multiplayerMatchIds = [
            ...new Set(
                activeSessions
                    .map((session) => session.multiplayerMatchId)
                    .filter((matchId): matchId is string => !!matchId)
            ),
        ];

        if (multiplayerMatchIds.length > 0) {
            await this.prismaService.multiplayerMatch.updateMany({
                where: {
                    id: {
                        in: multiplayerMatchIds,
                    },
                    status: MultiplayerMatchStatus.ACTIVE,
                },
                data: {
                    finishedAt,
                    status: MultiplayerMatchStatus.ABANDONED,
                },
            });

            await this.prismaService.gameSession.updateMany({
                where: {
                    multiplayerMatchId: {
                        in: multiplayerMatchIds,
                    },
                    status: GameSessionStatus.ACTIVE,
                },
                data: {
                    finishedAt,
                    status: GameSessionStatus.ABANDONED,
                },
            });
        }

        await this.prismaService.gameSession.updateMany({
            where: {
                id: {
                    in: activeSessions
                        .filter((session) => !session.multiplayerMatchId)
                        .map((session) => session.id),
                },
                status: GameSessionStatus.ACTIVE,
            },
            data: {
                finishedAt,
                status: GameSessionStatus.ABANDONED,
            },
        });
    }

    private getSessionDurationSeconds() {
        return Number(process.env.GAME_SESSION_DURATION_SECONDS ?? 900);
    }
}
