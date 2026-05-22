import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUserId } from '../shared/shared.decorators';
import { SubmitSelectionDto } from './dto/submit-selection.dto';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
    constructor(private readonly gameService: GameService) {}

    @Post('tasks/submit-selection')
    submitSelection(
        @CurrentUserId() userId: string,
        @Body() dto: SubmitSelectionDto
    ) {
        return this.gameService.submitSelection(userId, dto);
    }
}
