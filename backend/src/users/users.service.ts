import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

import { UpdateUserDto } from './dto/update-user.dto';
import { S3Service } from '../S3/S3.service';
import { MAX_AVATAR_IMAGE_SIZE_BYTES } from './users.constants';
import sharp from 'sharp';
import { Prisma, User } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type UsersListItem = {
    id: string;
    username: string;
    birthDate: Date;
    avatarUrl: string | null;
    email: string;
    level: number;
    xp: number;
    isFriendRequestSent: boolean;
};

@Injectable()
export class UsersService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly s3Service: S3Service
    ) {}

    async create(dto: CreateUserDto): Promise<User> {
        const user = await this.prismaService.user.create({
            data: {
                username: dto.username,
                email: dto.email,
                passwordHash: dto.passwordHash,
                birthDate: dto.birthDate,
            },
        });

        return user;
    }

    async findById(id: string): Promise<User | null> {
        return this.prismaService.user.findFirst({
            where: { id },
        });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.prismaService.user.findFirst({
            where: { email },
        });
    }

    async findAll(userId: string): Promise<UsersListItem[]> {
        const users = await this.prismaService.user.findMany({
            where: {
                id: {
                    not: userId,
                },
            },
            select: {
                id: true,
                username: true,
                birthDate: true,
                avatarUrl: true,
                email: true,
                level: true,
                xp: true,
                friendshipsReceived: {
                    where: {
                        requesterId: userId,
                        status: 'PENDING',
                    },
                    select: {
                        id: true,
                    },
                },
            },
        });

        return users.map(({ friendshipsReceived, ...user }) => ({
            ...user,
            isFriendRequestSent: friendshipsReceived.length > 0,
        }));
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const { username, email, birthDate } = updateUserDto;

        const isUserExist = await this.prismaService.user.findFirst({
            where: { id },
        });

        if (!isUserExist) {
            throw new NotFoundException(`User with id ${id} is not exist`);
        }

        const data: Prisma.UserUpdateInput = {};

        if (username) data.username = username;
        if (email) data.email = email;
        if (birthDate) data.birthDate = new Date(birthDate);

        return this.prismaService.user.update({
            data,
            where: { id },
        });
    }

    async remove(id: string) {
        await this.prismaService.user.delete({ where: { id } });
    }

    async updateAvatar(userId: string, file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('Файл не предоставлен');
        }

        if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException('Можно загружать только изображения');
        }

        // Ограничение размера (например, 5MB)
        if (file.size > MAX_AVATAR_IMAGE_SIZE_BYTES) {
            throw new BadRequestException(
                'Размер файла не должен превышать 5MB'
            );
        }

        const currentUser = await this.findById(userId);

        if (!currentUser) {
            throw new NotFoundException(
                `Пользователь с id ${userId} не существует`
            );
        }

        const compressedImageBuffer = await sharp(file.buffer)
            .resize(300, 300, {
                fit: 'cover',
                position: 'center',
            })
            .webp({
                quality: 80,
                effort: 4, // баланс между скоростью и сжатием
                alphaQuality: 80, // качество для прозрачности
            })
            .toBuffer();

        const fileKey = `avatars/${userId}/${Date.now()}.webp`;

        const avatarUrl = await this.s3Service.uploadFile({
            fileKey,
            buffer: compressedImageBuffer,
            contentType: 'image/webp',
        });

        // Удаляем старую аватарку из S3 (если она была)
        if (currentUser?.avatarUrl) {
            const oldAvatarFileKey = this.s3Service.parseFileKeyFromUrl(
                currentUser.avatarUrl
            );

            this.s3Service.removeFile(oldAvatarFileKey).catch(console.error);
        }

        const user = await this.prismaService.user.update({
            where: { id: userId },
            data: { avatarUrl },
        });

        return { avatarUrl: user.avatarUrl };
    }
}
