import { IsDateString, IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsNotEmpty()
    username: string;

    @MinLength(6)
    @IsNotEmpty()
    password: string;

    @IsDateString()
    birthDate: string;
}
