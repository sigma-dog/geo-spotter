import { S3Client } from '@aws-sdk/client-s3';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Service } from './S3.service';

@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: 'S3_CLIENT',
            useFactory: (configService: ConfigService) => {
                return new S3Client({
                    region: configService.get<string>('S3_REGION', 'ru-1'),
                    credentials: {
                        accessKeyId: configService.get<string>(
                            'S3_ACCESS_KEY',
                            ''
                        ),
                        secretAccessKey: configService.get<string>(
                            'S3_SECRET_KEY',
                            ''
                        ),
                    },
                    endpoint: configService.get<string>(
                        'S3_ENDPOINT',
                        'https://s3.timeweb.com'
                    ),
                    forcePathStyle: true, // обязательно для Timeweb
                });
            },
            inject: [ConfigService],
        },
        S3Service,
    ],
    exports: [S3Service],
})
export class S3Module {}
