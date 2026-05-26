import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import sharp from 'sharp';
import type { SubmitSelectionDto } from './dto/submit-selection.dto';
import type {
    AiVerificationRequest,
    PreparedSelectionAsset,
} from './game.types';

@Injectable()
export class GameDebugService {
    private readonly logger = new Logger(GameDebugService.name);

    constructor(private readonly configService: ConfigService) {}

    isGameplayDebugEnabled() {
        return this.configService.get<string>('NODE_ENV') !== 'production';
    }

    isEnabled() {
        return (
            this.configService.get<string>(
                'GAME_DEBUG_SAVE_SELECTION_ASSETS'
            ) === 'true'
        );
    }

    async saveSelectionArtifacts(params: {
        asset: PreparedSelectionAsset;
        attemptId: string;
        dto: SubmitSelectionDto;
        verificationPayload: AiVerificationRequest;
    }) {
        if (!this.isEnabled()) {
            return;
        }

        const debugRoot =
            this.configService.get<string>('GAME_DEBUG_DIR') ??
            'debug/game-selection';
        const targetDir = resolve(process.cwd(), debugRoot, params.attemptId);

        await mkdir(targetDir, { recursive: true });

        const metadata = {
            attemptId: params.attemptId,
            capturedAt: params.dto.capturedAt,
            debugInfo: params.dto.debugInfo ?? null,
            imageId: params.dto.imageId,
            imageThumbUrl: params.dto.imageThumbUrl ?? null,
            sourceImageUrl: params.asset.imageUrl,
            selection: params.dto.selection,
            task: params.dto.task,
            verificationPayload: {
                attemptId: params.verificationPayload.attemptId,
                image: {
                    cropHeightPx: params.verificationPayload.image.cropHeightPx,
                    cropMimeType: params.verificationPayload.image.cropMimeType,
                    cropWidthPx: params.verificationPayload.image.cropWidthPx,
                    sourceImageHeight:
                        params.verificationPayload.image.sourceImageHeight,
                    sourceImageUrl:
                        params.verificationPayload.image.sourceImageUrl,
                    sourceImageWidth:
                        params.verificationPayload.image.sourceImageWidth,
                },
                task: params.verificationPayload.task,
            },
        };

        const selectionLeftPx = Math.round(
            params.dto.selection.left * params.asset.sourceImageWidth
        );
        const selectionTopPx = Math.round(
            params.dto.selection.top * params.asset.sourceImageHeight
        );
        const selectionWidthPx = Math.round(
            params.dto.selection.width * params.asset.sourceImageWidth
        );
        const selectionHeightPx = Math.round(
            params.dto.selection.height * params.asset.sourceImageHeight
        );

        const borderSvg = Buffer.from(
            `<svg width="${params.asset.sourceImageWidth}" height="${params.asset.sourceImageHeight}" xmlns="http://www.w3.org/2000/svg">
                <rect x="${selectionLeftPx}" y="${selectionTopPx}" width="${selectionWidthPx}" height="${selectionHeightPx}"
                    fill="rgba(255,64,64,0.18)" stroke="rgba(255,64,64,1)" stroke-width="4" />
            </svg>`
        );

        const sourceImageWithBoxBuffer = await sharp(
            params.asset.sourceImagePngBuffer
        )
            .composite([{ input: borderSvg }])
            .png()
            .toBuffer();

        await Promise.all([
            writeFile(
                join(targetDir, 'source-image.png'),
                params.asset.sourceImagePngBuffer
            ),
            writeFile(
                join(targetDir, 'source-image-with-box.png'),
                sourceImageWithBoxBuffer
            ),
            writeFile(join(targetDir, 'crop.png'), params.asset.cropBuffer),
            writeFile(
                join(targetDir, 'source-image-original.bin'),
                params.asset.sourceImageBuffer
            ),
            writeFile(
                join(targetDir, 'metadata.json'),
                JSON.stringify(metadata, null, 2),
                'utf-8'
            ),
        ]);

        this.logger.log(`Saved selection debug artifacts to ${targetDir}`);
    }
}
