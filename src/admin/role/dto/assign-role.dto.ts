import { IsNotEmpty } from 'class-validator';
import { Exists } from '../../../utilis/validation';

export class AssignRoleDto {
    @IsNotEmpty()
    @Exists('users','_id')
    userId: string;

    @IsNotEmpty()
    @Exists('roles','_id')
    roleId: string;
}
