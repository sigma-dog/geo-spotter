import {
    Controller,
    Post,
    Patch,
    Body,
    Param,
    Get,
    Delete,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUserId } from '../shared/shared.decorators';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(
        @CurrentUserId() userId: string,
        @Query('search') search?: string
    ) {
        return this.usersService.findAll(userId, search);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    @Post('avatar')
    @UseInterceptors(FileInterceptor('file'))
    async uploadAvatar(
        @UploadedFile() file: Express.Multer.File,
        @CurrentUserId() userId: string
    ) {
        return this.usersService.updateAvatar(userId, file);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }
}
