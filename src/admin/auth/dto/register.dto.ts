import { IsEmail, IsNotEmpty, MinLength, IsBoolean, IsOptional } from 'class-validator';
import { Unique } from '../../../utilis/decorators/unique.decorator';
import { Match } from '../../../utilis/decorators/match.decorator';

/**
 * DTO for user registration
 */

export class RegisterDto {
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @IsNotEmpty()
    @Unique('users', 'email')
    email: string;

    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsNotEmpty()
    @MinLength(6)
    @Match('password', { message: 'Passwords do not match' })
    confirmPassword: string;

    @IsBoolean()
    @IsNotEmpty()
    status: boolean;

    @IsOptional()
    image?: string;
}
