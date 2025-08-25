import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schemas/user.schema';
import { MailModule } from 'src/utilis/mail/mail.module';
import { AssignRole, AssignRoleSchema } from '../role/schemas/assign-role.schema';
import { Role, RoleSchema } from '../role/schemas/role.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: AssignRole.name, schema: AssignRoleSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
    // Import MailModule to use MailService for sending emails
    MailModule, // Uncomment if you want to use MailService in this module
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }
