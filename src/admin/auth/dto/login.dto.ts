import { IsEmail, IsNotEmpty } from 'class-validator';
import { Exists } from '../../../utilis/decorators/exists.decorator';

export class LoginDto {

    @IsEmail()
    @IsNotEmpty()
    @Exists('users', 'email', { message: 'Email not found in users collection' })
    email: string;

    @IsNotEmpty()
    password: string;
}
