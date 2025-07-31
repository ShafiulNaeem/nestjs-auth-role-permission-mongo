import { IsNotEmpty } from 'class-validator';

export class VerifyOtpOrTokenDto {
    @IsNotEmpty()
    token: string;
}
