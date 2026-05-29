import {
    ArrayMaxSize,
    ArrayMinSize,
    ArrayUnique,
    IsArray,
    IsUUID,
} from 'class-validator';

export class CreateMultiplayerLobbyDto {
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(4)
    @ArrayUnique()
    @IsUUID('4', { each: true })
    friendIds!: string[];
}
