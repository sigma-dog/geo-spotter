import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GameAiClientService } from './game-ai-client.service';
import { GameController } from './game.controller';
import { GameDebugService } from './game-debug.service';
import { GameMapillaryService } from './game-mapillary.service';
import { GameSelectionVerifierService } from './game-selection-verifier.service';
import { GameService } from './game.service';

@Module({
    imports: [ConfigModule],
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
