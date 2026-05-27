import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const requestBodyLimit = process.env.REQUEST_BODY_LIMIT ?? '30mb';

    app.use(express.json({ limit: requestBodyLimit }));
    app.use(express.urlencoded({ extended: true, limit: requestBodyLimit }));

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        })
    );

    app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

    app.enableCors({
        origin: 'http://localhost:5173',
        credentials: true,
    });

    await app.listen(process.env.API_PORT ?? 3000);
}

void bootstrap();
