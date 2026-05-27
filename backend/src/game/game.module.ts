import { Module } from '@nestjs/common';
import { GameAiClientService } from './game-ai-client.service';
import { GameController } from './game.controller';
import { GameDebugService } from './game-debug.service';
import { GameMapillaryService } from './game-mapillary.service';
import { GameSelectionVerifierService } from './game-selection-verifier.service';
import { GameService } from './game.service';

@Module({
    controllers: [GameController],
    providers: [
        GameAiClientService,
        GameDebugService,
        GameMapillaryService,
        GameSelectionVerifierService,
        GameService,
    ],
})
export class GameModule {}
