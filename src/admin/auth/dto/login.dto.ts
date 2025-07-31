import { IsEmail, IsNotEmpty } from 'class-validator';
import { Exists } from '../../../utilis/validation';

export class LoginDto {

    @IsEmail()
    @IsNotEmpty()
    @Exists('users','email')
    email: string;

    @IsNotEmpty()
    password: string;
}
