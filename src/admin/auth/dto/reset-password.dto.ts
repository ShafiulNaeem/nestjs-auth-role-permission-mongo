import { IsNotEmpty, IsEmail, MinLength, MaxLength } from 'class-validator';
import { Exists } from '../../../utilis/decorators/exists.decorator';
import { Match } from 'src/utilis/decorators/match.decorator';

export class ResetPasswordDto {
    @IsEmail()
    @IsNotEmpty()
    @Exists('users', 'email', { message: 'Email not found in users collection' })
    email: string;
    @IsNotEmpty()
    @MinLength(6)
    @MaxLength(20)
    @Match('confirmPassword', { message: 'Passwords do not match' })
    password: string;
    @IsNotEmpty()
    @MinLength(6)
    @MaxLength(20)
    confirmPassword: string;
}