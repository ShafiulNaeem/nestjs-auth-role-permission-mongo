import { IsEmail, IsNotEmpty, MinLength, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { Unique, Exists} from '../../../utilis/validation';
import { Match } from '../../../utilis/decorators/match.decorator';

/**
 * DTO for user registration
 */

export class RegisterDto {
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @IsNotEmpty()
    @Unique('users') 
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
    @Type(() => Boolean)
    status: boolean;

    @IsOptional()
    image?: string;

    @IsOptional()
    @Exists('roles','_id',{message: 'Role does not exist'})
    roleId?: string;
}
