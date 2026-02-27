import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Query,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { CurrentUserId } from 'src/shared/shared.decorators';
import { SendFriendRequestDto } from './dto/sendFriendRequest.dto';
import { RespondFriendRequestDto } from './dto/respondFriendRequest.dto';

@Controller('friends')
export class FriendsController {
    constructor(private readonly friendsService: FriendsService) {}

    @Get()
    getFriends(
        @CurrentUserId() userId: string,
        @Query('offset') offset = '0',
        @Query('limit') limit = '20'
    ) {
        return this.friendsService.getFriends({
            userId,
            offset: Number(offset),
            limit: Number(limit),
        });
    }

    @Get('requests')
    getIncoming(@CurrentUserId() userId: string) {
        return this.friendsService.getIncomingRequests(userId);
    }

    @Post('request')
    sendRequest(
        @CurrentUserId() userId: string,
        @Body() dto: SendFriendRequestDto
    ) {
        return this.friendsService.sendRequest(userId, dto.addresseeId);
    }

    @Post('respond')
    respond(
        @CurrentUserId() userId: string,
        @Body() dto: RespondFriendRequestDto
    ) {
        return this.friendsService.respondToRequest(
            userId,
            dto.friendshipId,
            dto.accept
        );
    }

    @Delete(':friendId')
    removeFriend(
        @CurrentUserId() userId: string,
        @Param('friendId') friendId: string
    ) {
        return this.friendsService.removeFriend(userId, friendId);
    }
}
