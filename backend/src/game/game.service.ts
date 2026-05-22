import {
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import type { GameTask } from '../../generated/prisma/client';
import {
    TaskAttemptStatus,
    TaskAttemptVerdict,
} from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitSelectionDto } from './dto/submit-selection.dto';
import { TASK_ATTEMPT_VERDICT } from './game.constants';
import { GameAiClientService } from './game-ai-client.service';
import { GameDebugService } from './game-debug.service';
import { GameMapillaryService } from './game-mapillary.service';
import { GameSelectionVerifierService } from './game-selection-verifier.service';
import type { AiVerificationRequest, VerificationResponse } from './game.types';

@Injectable()
export class GameService {
    constructor(
        private readonly gameAiClientService: GameAiClientService,
        private readonly gameDebugService: GameDebugService,
        private readonly gameMapillaryService: GameMapillaryService,
        private readonly gameSelectionVerifierService: GameSelectionVerifierService,
        private readonly prismaService: PrismaService
    ) {}

    async submitSelection(
        userId: string,
        dto: SubmitSelectionDto
    ): Promise<VerificationResponse> {
        const user = await this.prismaService.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });

        if (!user) {
            throw new NotFoundException(
                `Пользователь с id ${userId} не найден.`
            );
        }

        const gameTask = await this.upsertGameTask(dto);
        const attempt = await this.prismaService.taskAttempt.create({
            data: {
                capturedAt: new Date(dto.capturedAt),
                gameTaskId: gameTask.id,
                imageId: dto.imageId,
                selectionHeight: dto.selection.height,
                selectionLeft: dto.selection.left,
                selectionTop: dto.selection.top,
                selectionWidth: dto.selection.width,
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
                dto,
                asset
            );
            await this.gameDebugService.saveSelectionArtifacts({
                asset,
                attemptId: attempt.id,
                dto,
                verificationPayload,
            });
            const verification = await this.verifySelection(
                verificationPayload,
                dto
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

            return {
                attemptId: attempt.id,
                confidence: verification.confidence,
                debug: verification.debug ?? null,
                reason: verification.reason,
                source: verification.source,
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

    private createAiVerificationPayload(
        attemptId: string,
        dto: SubmitSelectionDto,
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
            task: dto.task,
        };
    }

    private upsertGameTask(dto: SubmitSelectionDto): Promise<GameTask> {
        return this.prismaService.gameTask.upsert({
            where: { externalId: dto.task.id },
            create: {
                description: null,
                externalId: dto.task.id,
                target: dto.task.target,
                title: dto.task.title,
            },
            update: {
                target: dto.task.target,
                title: dto.task.title,
            },
        });
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
}
