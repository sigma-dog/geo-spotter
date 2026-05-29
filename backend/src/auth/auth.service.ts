import {
    ConflictException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '../../generated/prisma/client';

const HASH_SALT_ROUNDS = 10;

type Tokens = {
    access: string;
    refresh: string;
};

type UserResponse = {
    id: string;
    username: string;
    birthdate: string;
    email: string;
    level: number;
    xp: number;
    avatarUrl: string | null;
};

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly prismaService: PrismaService,
        private readonly configService: ConfigService
    ) {}

    async register({
        password,
        ...dto
    }: RegisterDto): Promise<UserResponse & Tokens> {
        const isUserExists = await this.usersService.findByEmail(dto.email);

        if (isUserExists) {
            throw new ConflictException('Email already in use');
        }

        const passwordHash = await bcrypt.hash(password, HASH_SALT_ROUNDS);

        const user = await this.usersService.create({
            ...dto,
            passwordHash,
        });

        const tokens = await this.generateTokens(user);

        return {
            ...tokens,
            id: user.id,
            username: user.username,
            birthdate: user.birthDate.toISOString(),
            email: user.email,
            level: user.level,
            xp: user.xp,
            avatarUrl: user.avatarUrl,
        };
    }

    async login(dto: LoginDto): Promise<UserResponse & Tokens> {
        const { email } = dto;

        const user = await this.usersService.findByEmail(email);

        if (!user) {
            throw new NotFoundException('Invalid email or password');
        }

        const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isMatch) {
            throw new NotFoundException('Invalid email or password');
        }

        const tokens = await this.generateTokens(user);

        return {
            ...tokens,
            id: user.id,
            username: user.username,
            birthdate: user.birthDate.toISOString(),
            email: user.email,
            level: user.level,
            xp: user.xp,
            avatarUrl: user.avatarUrl,
        };
    }

    async refresh(refreshToken: string) {
        const jwtRefreshSecret =
            this.configService.get<string>('JWT_REFRESH_SECRET');

        if (!jwtRefreshSecret) {
            throw new Error('JWT_SECRET not set in config');
        }

        let payload: { sub: string; email: string };

        try {
            payload = this.jwtService.verify(refreshToken, {
                secret: jwtRefreshSecret,
            });
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }

        const user = await this.usersService.findById(payload.sub);
        if (!user || !user.currentHashedRefreshToken) {
            throw new UnauthorizedException('Refresh token not found');
        }

        const isValid = await bcrypt.compare(
            refreshToken,
            user.currentHashedRefreshToken
        );
        if (!isValid) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        return this.generateTokens(user);
    }

    private async generateTokens(user: User) {
        const payload = { sub: user.id, email: user.email };

        const access = this.jwtService.sign(payload, { expiresIn: '15m' });
        const refresh = this.jwtService.sign(payload, { expiresIn: '7d' });

        const hashedRefreshToken = await bcrypt.hash(refresh, HASH_SALT_ROUNDS);

        await this.prismaService.user.update({
            where: { id: user.id },
            data: { currentHashedRefreshToken: hashedRefreshToken },
        });

        return { access, refresh };
    }
}
