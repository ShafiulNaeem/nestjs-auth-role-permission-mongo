import { IsEmail, IsNotEmpty, MinLength, IsBoolean, IsOptional } from 'class-validator';
import { Unique, UniqueRule } from '../../../utilis/validation';
import { Match } from '../../../utilis/decorators/match.decorator';

/**
 * DTO for updating user information
 */
export class UpdateUserDto {
    @IsOptional()
    @IsNotEmpty()
    name?: string;

    @IsOptional()
    @IsEmail()
    @IsNotEmpty()
    @Unique('users', 'email', { ignoreField: 'id' })
    email?: string;

    @IsOptional()
    @IsNotEmpty()
    @MinLength(6)
    password?: string;

    @IsOptional()
    @IsNotEmpty()
    @MinLength(6)
    @Match('password', { message: 'Passwords do not match' })
    confirmPassword?: string;

    @IsOptional()
    @IsBoolean()
    status?: boolean;

    @IsOptional()
    image?: string;

    // This field would typically come from the route params or auth context
    @IsOptional()
    id?: string; // Used for ignoring current record in unique validation
}
