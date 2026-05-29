import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GameSessionStoreService } from '../game/game-session-store.service';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [GameSessionStoreService],
    exports: [GameSessionStoreService],
})
export class RedisModule {}
