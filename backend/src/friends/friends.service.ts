import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class FriendsService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly usersService: UsersService
    ) {}

    async sendRequest(requesterId: string, addresseeId: string) {
        if (requesterId === addresseeId) {
            throw new BadRequestException('Cannot add yourself as friend');
        }

        const isRequesterExist = await this.usersService.findById(requesterId);

        if (!isRequesterExist) {
            throw new NotFoundException(
                `User with id ${requesterId} is not exist`
            );
        }

        const isAddresseeExist = await this.usersService.findById(addresseeId);

        if (!isAddresseeExist) {
            throw new NotFoundException(
                `User with id ${addresseeId} is not exist`
            );
        }

        const existing = await this.prismaService.friendship.findFirst({
            where: {
                OR: [
                    { requesterId, addresseeId },
                    { requesterId: addresseeId, addresseeId: requesterId },
                ],
            },
        });

        if (existing) {
            throw new BadRequestException('Friend request already exists');
        }

        return this.prismaService.friendship.create({
            data: {
                requesterId,
                addresseeId,
            },
        });
    }

    async respondToRequest(
        userId: string,
        friendshipId: string,
        accept: boolean
    ) {
        const isUserExist = await this.usersService.findById(userId);

        if (!isUserExist) {
            throw new NotFoundException(`User with id ${userId} is not exist`);
        }

        const friendship = await this.prismaService.friendship.findUnique({
            where: { id: friendshipId },
        });

        if (!friendship) {
            throw new NotFoundException('Friend request not found');
        }

        if (friendship.addresseeId !== userId) {
            throw new BadRequestException('Not your friend request');
        }

        if (!accept) {
            return this.prismaService.friendship.delete({
                where: { id: friendshipId },
            });
        }

        return this.prismaService.friendship.update({
            where: { id: friendshipId },
            data: { status: 'ACCEPTED' },
        });
    }

    async getFriends({
        userId,
        offset = 0,
        limit = 20,
    }: {
        userId: string;
        offset: number;
        limit: number;
    }) {
        const isUserExist = await this.usersService.findById(userId);

        if (!isUserExist) {
            throw new NotFoundException(`User with id ${userId} is not exist`);
        }

        const friendships = await this.prismaService.friendship.findMany({
            where: {
                status: 'ACCEPTED',
                OR: [{ requesterId: userId }, { addresseeId: userId }],
            },
            include: {
                requester: true,
                addressee: true,
            },
            skip: offset,
            take: limit,
            orderBy: {
                createdAt: 'desc',
            },
        });

        const friends = friendships.map((f) =>
            f.requesterId === userId ? f.addressee : f.requester
        );

        return {
            items: friends,
            hasMore: friends.length === limit,
        };
    }

    async getIncomingRequests(userId: string) {
        const isUserExist = await this.usersService.findById(userId);

        if (!isUserExist) {
            throw new NotFoundException(`User with id ${userId} is not exist`);
        }

        return await this.prismaService.friendship.findMany({
            where: {
                addresseeId: userId,
                status: 'PENDING',
            },
            include: {
                requester: true,
            },
        });
    }

    async removeFriend(userId: string, friendId: string) {
        const isUserExist = await this.usersService.findById(userId);

        if (!isUserExist) {
            throw new NotFoundException(`User with id ${userId} is not exist`);
        }

        const isFriendExist = await this.usersService.findById(friendId);

        if (!isFriendExist) {
            throw new NotFoundException(
                `User with id ${friendId} is not exist`
            );
        }

        const friendship = await this.prismaService.friendship.findFirst({
            where: {
                status: 'ACCEPTED',
                OR: [
                    {
                        requesterId: userId,
                        addresseeId: friendId,
                    },
                    {
                        requesterId: friendId,
                        addresseeId: userId,
                    },
                ],
            },
        });

        if (!friendship) {
            throw new NotFoundException('Friendship not found');
        }

        return this.prismaService.friendship.delete({
            where: { id: friendship.id },
        });
    }
}
