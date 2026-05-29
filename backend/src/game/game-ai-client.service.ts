import {
    Injectable,
    Logger,
    ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
    AiVerificationRequest,
    AiVerificationResponse,
} from './game.types';

@Injectable()
export class GameAiClientService {
    private readonly logger = new Logger(GameAiClientService.name);

    constructor(private readonly configService: ConfigService) {}

    async verifySelection(
        payload: AiVerificationRequest
    ): Promise<AiVerificationResponse> {
        const serviceUrl = this.configService.get<string>('AI_SERVICE_URL');

        if (!serviceUrl) {
            throw new ServiceUnavailableException(
                'Не задан AI_SERVICE_URL для backend.'
            );
        }

        const response = await fetch(`${serviceUrl}/verify-selection`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const body = await response.text();

            this.logger.warn(
                `AI service responded with ${response.status}: ${body}`
            );

            throw new ServiceUnavailableException(
                `AI service unavailable: ${response.status} ${response.statusText}.`
            );
        }

        const result = (await response.json()) as AiVerificationResponse;

        return result;
    }
}
