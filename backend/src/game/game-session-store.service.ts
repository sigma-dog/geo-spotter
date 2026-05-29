import {
    Injectable,
    InternalServerErrorException,
    OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { RedisOptions } from 'ioredis';
import type { GameSessionView } from './game.types';
import type { StoredGameSession } from './game-session.types';

@Injectable()
export class GameSessionStoreService implements OnModuleDestroy {
    private readonly redis: Redis;
    private readonly completedSessionRetentionSeconds: number;

    constructor(private readonly configService: ConfigService) {
        const redisUrl = this.configService.get<string>('REDIS_URL');

        this.redis = redisUrl
            ? new Redis(redisUrl)
            : new Redis(this.resolveRedisOptions());
        this.completedSessionRetentionSeconds = Number(
            this.configService.get(
                'GAME_SESSION_COMPLETED_RETENTION_SECONDS'
            ) ?? 3600
        );
    }

    async onModuleDestroy() {
        await this.redis.quit();
    }

    async getCurrentSession(userId: string): Promise<StoredGameSession | null> {
        const sessionId = await this.redis.get(this.getUserSessionKey(userId));

        if (!sessionId) {
            return null;
        }

        const payload = await this.redis.get(this.getSessionKey(sessionId));

        if (!payload) {
            await this.redis.del(this.getUserSessionKey(userId));
            return null;
        }

        try {
            return JSON.parse(payload) as StoredGameSession;
        } catch {
            await this.redis.del(
                this.getSessionKey(sessionId),
                this.getUserSessionKey(userId)
            );

            throw new InternalServerErrorException(
                'Не удалось прочитать игровую сессию из Redis.'
            );
        }
    }

    async saveSession(session: StoredGameSession) {
        const ttlSeconds = this.getTtlSeconds(session);

        await this.redis
            .multi()
            .set(
                this.getSessionKey(session.id),
                JSON.stringify(session),
                'EX',
                ttlSeconds
            )
            .set(
                this.getUserSessionKey(session.userId),
                session.id,
                'EX',
                ttlSeconds
            )
            .exec();
    }

    async deleteSession(userId: string, sessionId: string) {
        await this.redis.del(
            this.getSessionKey(sessionId),
            this.getUserSessionKey(userId)
        );
    }

    createStoredSession(params: {
        durationSeconds: number;
        session: GameSessionView;
        userId: string;
    }): StoredGameSession {
        const startedAtMs = new Date(params.session.startedAt).getTime();
        const expiresAt = new Date(
            startedAtMs + params.durationSeconds * 1000
        ).toISOString();

        return {
            ...params.session,
            expiresAt,
            userId: params.userId,
        };
    }

    isExpired(session: StoredGameSession) {
        return new Date(session.expiresAt).getTime() <= Date.now();
    }

    private getSessionKey(sessionId: string) {
        return `game:session:${sessionId}`;
    }

    private getUserSessionKey(userId: string) {
        return `game:user:${userId}:session`;
    }

    private getTtlSeconds(session: StoredGameSession) {
        if (session.status !== 'ACTIVE') {
            return this.completedSessionRetentionSeconds;
        }

        const remainingSeconds = Math.ceil(
            (new Date(session.expiresAt).getTime() - Date.now()) / 1000
        );

        return Math.max(
            1,
            remainingSeconds + this.completedSessionRetentionSeconds
        );
    }

    private resolveRedisOptions(): RedisOptions {
        return {
            db: Number(this.configService.get<string>('REDIS_DB') ?? '0'),
            host: this.configService.get<string>('REDIS_HOST') ?? '127.0.0.1',
            password: this.configService.get<string>('REDIS_PASSWORD'),
            port: Number(
                this.configService.get<string>('REDIS_PORT') ?? '6379'
            ),
        };
    }
}
