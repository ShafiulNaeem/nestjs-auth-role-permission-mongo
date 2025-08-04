import { IsNotEmpty} from 'class-validator';

export class PermissionDto {
    @IsNotEmpty()
    subject: string;

    @IsNotEmpty()
    action: string;
}


