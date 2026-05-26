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
import { GameMapillaryService } from './game-mapillary.service';
import { GameSelectionVerifierService } from './game-selection-verifier.service';
import type {
    AiVerificationRequest,
    GameSessionView,
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
} satisfies Prisma.GameSessionInclude;

type SessionWithTasks = Prisma.GameSessionGetPayload<{
    include: typeof ACTIVE_SESSION_INCLUDE;
}>;

@Injectable()
export class GameService {
    constructor(
        private readonly gameAiClientService: GameAiClientService,
        private readonly gameDebugService: GameDebugService,
        private readonly gameMapillaryService: GameMapillaryService,
        private readonly gameSelectionVerifierService: GameSelectionVerifierService,
        private readonly prismaService: PrismaService
    ) {}

    async startSoloSession(userId: string): Promise<GameSessionView> {
        await this.assertUserExists(userId);

        const session = await this.prismaService.$transaction(async (tx) => {
            await tx.gameSession.updateMany({
                where: {
                    userId,
                    status: GameSessionStatus.ACTIVE,
                },
                data: {
                    finishedAt: new Date(),
                    status: GameSessionStatus.ABANDONED,
                },
            });

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

        return this.mapSessionView(session);
    }

    async getActiveSession(userId: string): Promise<GameSessionView | null> {
        await this.assertUserExists(userId);

        const session = await this.prismaService.gameSession.findFirst({
            where: {
                userId,
                status: GameSessionStatus.ACTIVE,
            },
            include: ACTIVE_SESSION_INCLUDE,
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (!session) {
            return null;
        }

        return this.mapSessionView(session);
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

        const updatedSession = await this.prismaService.gameSession.findUnique({
            where: {
                id: session.id,
            },
            include: ACTIVE_SESSION_INCLUDE,
        });

        if (!updatedSession) {
            throw new NotFoundException(
                'Игровая сессия не найдена после обновления.'
            );
        }

        return this.mapSessionView(updatedSession);
    }

    async submitSelection(
        userId: string,
        dto: SubmitSelectionDto
    ): Promise<VerificationResponse> {
        await this.assertUserExists(userId);

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

        try {
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
            const verification = await this.verifySelection(
                verificationPayload,
                {
                    ...dto,
                    task: resolvedTask,
                }
            );

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

            return {
                awardedXp,
                currentLevel: nextLevel,
                currentXp: nextXp,
                sessionCompleted: shouldCompleteSession,
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
        dto: SubmitSelectionDto
    ) {
        try {
            return await this.gameAiClientService.verifySelection(payload);
        } catch {
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

    private mapSessionView(session: SessionWithTasks): GameSessionView {
        const completedTasksCount = session.gameSessionTasks.filter(
            (task) => task.status === GameSessionTaskStatus.COMPLETED
        ).length;
        const awardedXp = session.gameSessionTasks
            .filter((task) => task.status === GameSessionTaskStatus.COMPLETED)
            .reduce((total, task) => total + task.gameTask.xpReward, 0);

        return {
            attemptsCount: session._count.tasks,
            awardedXp,
            completedTasksCount,
            finishedAt: session.finishedAt?.toISOString() ?? null,
            id: session.id,
            mode: session.mode,
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
}
