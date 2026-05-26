import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUserId } from '../shared/shared.decorators';
import { SubmitSelectionDto } from './dto/submit-selection.dto';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
    constructor(private readonly gameService: GameService) {}

    @Post('sessions/solo/start')
    startSoloSession(@CurrentUserId() userId: string) {
        return this.gameService.startSoloSession(userId);
    }

    @Get('sessions/active')
    getActiveSession(@CurrentUserId() userId: string) {
        return this.gameService.getActiveSession(userId);
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
