import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import type { VerificationProgressEvent } from './game.types';

type SocketUser = {
    email: string;
    userId: string;
};

type JoinMatchPayload = {
    matchId: string;
};

type SocketHandshakeAuth = {
    authorization?: string;
    token?: string;
};

@Injectable()
@WebSocketGateway({
    cors: {
        credentials: true,
        origin: 'http://localhost:5173',
    },
    namespace: '/game',
})
export class GameGateway implements OnGatewayConnection {
    @WebSocketServer()
    server!: Server;

    constructor(
        private readonly jwtService: JwtService,
        private readonly prismaService: PrismaService
    ) {}

    async handleConnection(client: Socket) {
        try {
            const user = await this.authenticate(client);

            (client.data as { user?: SocketUser }).user = user;
            await client.join(this.getUserRoom(user.userId));
        } catch {
            client.disconnect();
        }
    }

    @SubscribeMessage('game:join-match')
    async handleJoinMatch(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: JoinMatchPayload
    ) {
        const user = this.getSocketUser(client);

        if (!payload?.matchId) {
            throw new UnauthorizedException('matchId is required.');
        }

        const session = await this.prismaService.gameSession.findFirst({
            where: {
                multiplayerMatchId: payload.matchId,
                userId: user.userId,
            },
            select: {
                id: true,
            },
        });

        if (!session) {
            throw new UnauthorizedException(
                'Игрок не состоит в этой многопользовательской сессии.'
            );
        }

        await client.join(this.getMatchRoom(payload.matchId));

        return {
            matchId: payload.matchId,
            ok: true,
            sessionId: session.id,
        };
    }

    emitMultiplayerSessionStarted(userIds: string[], payload: object) {
        userIds.forEach((userId) => {
            this.server
                .to(this.getUserRoom(userId))
                .emit('game:multiplayer-session-started', payload);
        });
    }

    emitMultiplayerLobbyCreated(userIds: string[], payload: object) {
        userIds.forEach((userId) => {
            this.server
                .to(this.getUserRoom(userId))
                .emit('game:multiplayer-lobby-created', payload);
        });
    }

    emitMultiplayerLobbyUpdated(userIds: string[], payload: object) {
        userIds.forEach((userId) => {
            this.server
                .to(this.getUserRoom(userId))
                .emit('game:multiplayer-lobby-updated', payload);
        });
    }

    emitMultiplayerProgressUpdated(
        matchId: string,
        userIds: string[],
        payload: object
    ) {
        this.server
            .to(this.getMatchRoom(matchId))
            .emit('game:multiplayer-progress-updated', payload);

        userIds.forEach((userId) => {
            this.server
                .to(this.getUserRoom(userId))
                .emit('game:multiplayer-progress-updated', payload);
        });
    }

    emitVerificationProgress(
        userId: string,
        payload: VerificationProgressEvent
    ) {
        this.server
            .to(this.getUserRoom(userId))
            .emit('game:verification-progress', payload);
    }

    private async authenticate(client: Socket): Promise<SocketUser> {
        const handshakeAuth = client.handshake.auth as SocketHandshakeAuth;
        const authorizationHeader = client.handshake.headers.authorization;
        const rawTokenSource: unknown =
            handshakeAuth.token ??
            authorizationHeader ??
            handshakeAuth.authorization;
        const rawToken: string | string[] | undefined =
            typeof rawTokenSource === 'string'
                ? rawTokenSource
                : Array.isArray(rawTokenSource)
                  ? rawTokenSource.filter(
                        (token): token is string => typeof token === 'string'
                    )
                  : undefined;

        const normalizedRawToken: string | null | undefined = Array.isArray(
            rawToken
        )
            ? (rawToken[0] ?? null)
            : rawToken;
        const token = this.normalizeToken(normalizedRawToken);

        if (!token) {
            throw new UnauthorizedException('Missing auth token.');
        }

        const payload = await this.jwtService.verifyAsync<SocketUser>(token);

        return {
            email: payload.email,
            userId: payload.userId ?? (payload as { sub?: string }).sub ?? '',
        };
    }

    private getSocketUser(client: Socket): SocketUser {
        const user = (client.data as { user?: SocketUser }).user;

        if (!user?.userId) {
            throw new UnauthorizedException('Socket user is unavailable.');
        }

        return user;
    }

    private normalizeToken(token: string | null | undefined) {
        if (!token) {
            return null;
        }

        return token.startsWith('Bearer ') ? token.slice(7) : token;
    }

    private getMatchRoom(matchId: string) {
        return `match:${matchId}`;
    }

    private getUserRoom(userId: string) {
        return `user:${userId}`;
    }
}
