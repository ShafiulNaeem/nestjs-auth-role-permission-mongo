import { IsNotEmpty } from 'class-validator';
import { Exists } from '../../../utilis/validation';

export class AssignRoleDto {
    @IsNotEmpty()
    @Exists('User','_id')
    userId: string;

    @IsNotEmpty()
    @Exists('Role','_id')
    roleId: string;
}
