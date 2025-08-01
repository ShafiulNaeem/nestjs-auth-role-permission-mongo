import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { MailModule } from 'src/utilis/mail/mail.module';
import { MongooseModule } from '@nestjs/mongoose';
import { PasswordResetToken, PasswordResetTokenSchema } from '../users/schemas/password-reset-token.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PasswordResetToken.name, schema: PasswordResetTokenSchema }
    ]),
    UsersModule,
    MailModule
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule { }
