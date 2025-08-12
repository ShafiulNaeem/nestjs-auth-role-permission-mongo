import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from './schemas/role.schema';
import { Permission, PermissionSchema } from './schemas/permission.schema';
import { AssignRole, AssignRoleSchema } from './schemas/assign-role.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { AggregatePaginateModel } from '../../utilis/interfaces/aggregate-paginate.interfaces';



@Module({
   imports: [
      MongooseModule.forFeature([
          { name: Role.name, schema: RoleSchema },
          { name: Permission.name, schema: PermissionSchema },
          { name: AssignRole.name, schema: AssignRoleSchema },
          { name: User.name, schema: UserSchema },
      ]),
    ],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
