import {
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import type { SubmitSelectionDto } from './dto/submit-selection.dto';
import type { PreparedSelectionAsset } from './game.types';

type MapillaryImagePayload = {
    id: string;
    thumb_1024_url?: string;
    thumb_2048_url?: string;
    thumb_original_url?: string;
    width?: number;
    height?: number;
};

type CropBox = {
    height: number;
    left: number;
    top: number;
    width: number;
};

const resolveBestMapillaryImageUrl = (image: MapillaryImagePayload) =>
    image.thumb_2048_url ?? image.thumb_original_url ?? image.thumb_1024_url;

@Injectable()
export class GameMapillaryService {
    constructor(private readonly configService: ConfigService) {}

    async prepareSelectionAsset(
        imageId: string,
        selection: SubmitSelectionDto['selection'],
        imageThumbUrl?: string,
        sourceImageBase64?: string
    ): Promise<PreparedSelectionAsset> {
        const inlineSourceImageBuffer = sourceImageBase64
            ? Buffer.from(sourceImageBase64, 'base64')
            : null;
        const image = await this.getImageMetadata(
            imageId,
            imageThumbUrl,
            inlineSourceImageBuffer
        );
        const imageBuffer =
            inlineSourceImageBuffer ??
            (await this.downloadImage(image.imageUrl));
        const sourceImagePngBuffer = await sharp(imageBuffer).png().toBuffer();
        const imageMetadata = await sharp(sourceImagePngBuffer).metadata();
        const sourceImageWidth =
            image.width > 0 ? image.width : imageMetadata.width;
        const sourceImageHeight =
            image.height > 0 ? image.height : imageMetadata.height;

        if (!sourceImageWidth || !sourceImageHeight) {
            throw new InternalServerErrorException(
                'Не удалось определить размер кадра Mapillary.'
            );
        }

        const cropBox = this.computeCropBox(
            selection,
            sourceImageWidth,
            sourceImageHeight
        );

        const cropBuffer = await sharp(imageBuffer)
            .extract({
                left: cropBox.left,
                top: cropBox.top,
                width: cropBox.width,
                height: cropBox.height,
            })
            .png()
            .toBuffer();

        return {
            cropBuffer,
            cropHeightPx: cropBox.height,
            cropLeftPx: cropBox.left,
            cropTopPx: cropBox.top,
            cropWidthPx: cropBox.width,
            imageUrl: image.imageUrl,
            sourceImageBuffer: imageBuffer,
            sourceImageHeight,
            sourceImagePngBuffer,
            sourceImageWidth,
        };
    }

    private computeCropBox(
        selection: SubmitSelectionDto['selection'],
        sourceImageWidth: number,
        sourceImageHeight: number
    ): CropBox {
        const paddingRatio = Number(
            this.configService.get<string>(
                'GAME_SELECTION_CROP_PADDING_RATIO'
            ) ?? '0'
        );
        const minCropSizePx = Number(
            this.configService.get<string>('GAME_SELECTION_MIN_CROP_SIZE_PX') ??
                '1'
        );
        const safePaddingRatio = Number.isFinite(paddingRatio)
            ? Math.max(0, paddingRatio)
            : 0;
        const safeMinCropSizePx = Number.isFinite(minCropSizePx)
            ? Math.max(1, Math.round(minCropSizePx))
            : 1;

        const baseLeft = Math.max(
            0,
            Math.min(
                sourceImageWidth - 1,
                Math.floor(selection.left * sourceImageWidth)
            )
        );
        const baseTop = Math.max(
            0,
            Math.min(
                sourceImageHeight - 1,
                Math.floor(selection.top * sourceImageHeight)
            )
        );
        const baseWidth = Math.max(
            1,
            Math.min(
                sourceImageWidth - baseLeft,
                Math.ceil(selection.width * sourceImageWidth)
            )
        );
        const baseHeight = Math.max(
            1,
            Math.min(
                sourceImageHeight - baseTop,
                Math.ceil(selection.height * sourceImageHeight)
            )
        );
        const centerX = baseLeft + baseWidth / 2;
        const centerY = baseTop + baseHeight / 2;
        const paddedWidth = Math.max(
            baseWidth * (1 + safePaddingRatio * 2),
            safeMinCropSizePx
        );
        const paddedHeight = Math.max(
            baseHeight * (1 + safePaddingRatio * 2),
            safeMinCropSizePx
        );
        const width = Math.min(sourceImageWidth, Math.round(paddedWidth));
        const height = Math.min(sourceImageHeight, Math.round(paddedHeight));
        const left = Math.max(
            0,
            Math.min(sourceImageWidth - width, Math.round(centerX - width / 2))
        );
        const top = Math.max(
            0,
            Math.min(
                sourceImageHeight - height,
                Math.round(centerY - height / 2)
            )
        );

        return {
            height,
            left,
            top,
            width,
        };
    }

    private async getImageMetadata(
        imageId: string,
        fallbackImageThumbUrl?: string,
        inlineSourceImageBuffer?: Buffer | null
    ): Promise<
        Required<Pick<MapillaryImagePayload, 'height' | 'id' | 'width'>> & {
            imageUrl: string;
        }
    > {
        if (inlineSourceImageBuffer) {
            return {
                height: 0,
                id: imageId,
                imageUrl: fallbackImageThumbUrl ?? 'inline://source-image',
                width: 0,
            };
        }

        if (fallbackImageThumbUrl) {
            return {
                height: 0,
                id: imageId,
                imageUrl: fallbackImageThumbUrl,
                width: 0,
            };
        }

        const accessToken =
            this.configService.get<string>('MAPILLARY_ACCESS_TOKEN') ??
            this.configService.get<string>('VITE_MAPILLARY_ACCESS_TOKEN');

        if (!accessToken) {
            throw new ServiceUnavailableException(
                'Не задан MAPILLARY_ACCESS_TOKEN для backend.'
            );
        }

        const params = new URLSearchParams({
            access_token: accessToken,
            fields: 'id,thumb_1024_url,thumb_2048_url,thumb_original_url,width,height',
        });

        const response = await fetch(
            `https://graph.mapillary.com/${imageId}?${params.toString()}`
        );

        if (response.status === 404) {
            throw new NotFoundException(
                `Mapillary image ${imageId} не найден.`
            );
        }

        if (!response.ok) {
            throw new ServiceUnavailableException(
                `Mapillary API вернул ${response.status} ${response.statusText}.`
            );
        }

        const payload = (await response.json()) as MapillaryImagePayload;
        const imageUrl = resolveBestMapillaryImageUrl(payload);

        if (!imageUrl) {
            throw new InternalServerErrorException(
                'Mapillary не вернул URL кадра подходящего качества.'
            );
        }

        return {
            height: payload.height ?? 0,
            id: payload.id,
            imageUrl,
            width: payload.width ?? 0,
        };
    }

    private async downloadImage(url: string): Promise<Buffer> {
        const response = await fetch(url);

        if (!response.ok) {
            throw new ServiceUnavailableException(
                `Не удалось скачать кадр Mapillary: ${response.status} ${response.statusText}.`
            );
        }

        const arrayBuffer = await response.arrayBuffer();

        return Buffer.from(arrayBuffer);
    }
}
