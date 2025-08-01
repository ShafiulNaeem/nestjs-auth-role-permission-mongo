import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { Exists } from '../../../utilis/validation';

export class ForgotPasswordDto {

    @IsEmail()
    @IsNotEmpty()
    @Exists('users', 'email')
    email: string;

    @IsOptional()
    redirect_url: string;

    @IsNotEmpty()
    url_or_otp: boolean;
}
