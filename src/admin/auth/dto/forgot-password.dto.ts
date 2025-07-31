import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { Exists } from '../../../utilis/decorators/exists.decorator';

export class ForgotPasswordDto {

    @IsEmail()
    @IsNotEmpty()
    @Exists('users', 'email', { message: 'Email not found in users collection' })
    email: string;

    @IsOptional()
    redirect_url: string;

    @IsNotEmpty()
    url_or_otp: boolean;
}
