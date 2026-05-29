import { IsUUID, IsBoolean } from 'class-validator';

export class RespondFriendRequestDto {
    @IsUUID()
    friendshipId: string;

    @IsBoolean()
    accept: boolean;
}
