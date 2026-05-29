import { IsBoolean, IsUUID } from 'class-validator';

export class RespondMultiplayerLobbyDto {
    @IsUUID('4')
    lobbyId!: string;

    @IsBoolean()
    accept!: boolean;
}
