import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from './schemas/role.schema';
import { Permission, PermissionSchema } from './schemas/permission.schema';
// import { AssignRole, AssignRoleSchema } from './schemas/assign-role.schema';


@Module({
   imports: [
      MongooseModule.forFeature([
          { name: Role.name, schema: RoleSchema },
          { name: Permission.name, schema: PermissionSchema },
          // { name: AssignRole.name, schema: AssignRoleSchema },
      ]),
    ],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
