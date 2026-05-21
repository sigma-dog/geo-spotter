import { Module } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { UsersModule } from '../users/users.module';

@Module({
    controllers: [FriendsController],
    providers: [FriendsService],
    imports: [UsersModule],
})
export class FriendsModule {}
