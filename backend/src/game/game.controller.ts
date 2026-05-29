import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUserId } from '../shared/shared.decorators';
import { CreateMultiplayerLobbyDto } from './dto/create-multiplayer-lobby.dto';
import { RespondMultiplayerLobbyDto } from './dto/respond-multiplayer-lobby.dto';
import { SubmitSelectionDto } from './dto/submit-selection.dto';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
    constructor(private readonly gameService: GameService) {}

    @Post('sessions/solo/start')
    startSoloSession(@CurrentUserId() userId: string) {
        return this.gameService.startSoloSession(userId);
    }

    @Post('lobbies')
    createMultiplayerLobby(
        @CurrentUserId() userId: string,
        @Body() dto: CreateMultiplayerLobbyDto
    ) {
        return this.gameService.createMultiplayerLobby(userId, dto.friendIds);
    }

    @Get('lobbies/pending')
    getPendingMultiplayerLobby(@CurrentUserId() userId: string) {
        return this.gameService.getPendingMultiplayerLobby(userId);
    }

    @Get('lobbies/incoming')
    getIncomingMultiplayerLobbies(@CurrentUserId() userId: string) {
        return this.gameService.getIncomingMultiplayerLobbies(userId);
    }

    @Post('lobbies/respond')
    respondToMultiplayerLobby(
        @CurrentUserId() userId: string,
        @Body() dto: RespondMultiplayerLobbyDto
    ) {
        return this.gameService.respondToMultiplayerLobby(
            userId,
            dto.lobbyId,
            dto.accept
        );
    }

    @Get('sessions/active')
    getActiveSession(@CurrentUserId() userId: string) {
        return this.gameService.getActiveSession(userId);
    }

    @Post('sessions/active/abandon')
    abandonActiveSession(@CurrentUserId() userId: string) {
        return this.gameService.abandonActiveSession(userId);
    }

    @Get('sessions/recent')
    getRecentSessions(@CurrentUserId() userId: string) {
        return this.gameService.getRecentSessions(userId);
    }

    @Post('debug/sessions/:sessionId/tasks/:sessionTaskId/complete')
    completeTaskForDebug(
        @CurrentUserId() userId: string,
        @Param('sessionId') sessionId: string,
        @Param('sessionTaskId') sessionTaskId: string
    ) {
        return this.gameService.completeTaskForDebug(
            userId,
            sessionId,
            sessionTaskId
        );
    }

    @Post('tasks/submit-selection')
    submitSelection(
        @CurrentUserId() userId: string,
        @Body() dto: SubmitSelectionDto
    ) {
        return this.gameService.submitSelection(userId, dto);
    }
}
