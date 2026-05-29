import { Expose } from 'class-transformer';
import { IsDateString, IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateUserDto {
    @Expose()
    @IsEmail()
    email: string;

    @Expose()
    @IsNotEmpty()
    username: string;

    @Expose()
    @MinLength(6)
    @IsNotEmpty()
    passwordHash: string;

    @Expose()
    @IsDateString()
    birthDate: string;
}
