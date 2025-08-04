import { IsNotEmpty, IsBoolean, IsOptional, ValidateNested} from 'class-validator';
import { Type } from 'class-transformer';
import { PermissionDto } from './permission.dto';

export class CreateRoleDto  {
    @IsNotEmpty()
    name: string;

    @IsBoolean()
    @IsNotEmpty()
    @Type(() => Boolean)
    is_manage_all: boolean;

    @IsOptional()
    guard_name?: string;

    // permissions array of objects 
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => PermissionDto)
    permissions?: PermissionDto[];
}

