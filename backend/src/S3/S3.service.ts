import {
    DeleteObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
    constructor(
        @Inject('S3_CLIENT') private readonly s3Client: S3Client,
        private readonly configService: ConfigService
    ) {}

    private get bucketName(): string {
        return this.configService.get<string>('S3_BUCKET_NAME') ?? '';
    }

    /**
     * Загрузка аватарки в S3
     * @param file файл из multer
     * @param userId ID пользователя
     * @returns публичный URL аватарки
     */

    async uploadFile({
        fileKey,
        buffer,
        contentType,
    }: {
        fileKey: string;
        buffer: Buffer;
        contentType: string;
    }): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: fileKey,
            Body: buffer,
            ContentType: contentType,
            ACL: 'public-read',
        });

        try {
            await this.s3Client.send(command);
            const publicUrl = this.getFileUrl(fileKey);

            return publicUrl;
        } catch (error) {
            throw new Error(`Ошибка при загрузке аватарки ${error}`);
        }
    }

    async removeFile(fileKey: string): Promise<void> {
        try {
            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: fileKey,
            });

            await this.s3Client.send(command);
        } catch (error) {
            console.error('Ошибка при удалении файла:', error);
        }
    }

    getFileUrl(key: string): string {
        return `${this.configService.get('S3_ENDPOINT')}/${this.bucketName}/${key}`;
    }

    parseFileKeyFromUrl(url: string) {
        const urlParts = url.split('/');
        const bucketIndex = urlParts.indexOf(this.bucketName);

        // Ключ - это всё после названия бакета
        const fileKey = urlParts.slice(bucketIndex + 1).join('/');

        return fileKey;
    }
}
