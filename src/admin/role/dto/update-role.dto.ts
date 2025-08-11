import { IsNotEmpty, IsBoolean, IsOptional, ValidateNested} from 'class-validator';
import { Type } from 'class-transformer';
import { PermissionDto } from './permission.dto';
import { Unique } from '../../../utilis/validation';

export class UpdateRoleDto  {
    @IsNotEmpty()
    id: string;

    @IsNotEmpty()
    @Unique('roles', 'name', { ignoreField: 'id' })
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
