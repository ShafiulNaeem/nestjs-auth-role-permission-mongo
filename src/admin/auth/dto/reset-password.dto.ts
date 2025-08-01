import { IsNotEmpty, IsEmail, MinLength, MaxLength } from 'class-validator';
import { Exists } from '../../../utilis/validation';
import { Match } from 'src/utilis/decorators/match.decorator';

export class ResetPasswordDto {
    @IsEmail()
    @IsNotEmpty()
    @Exists('users', 'email')
    @Exists('passwordresettokens', 'email', {
        message: 'Invalid email or token has expired',
    })
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