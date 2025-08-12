import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ROLE_PERMISSION_KEY,
  RolePermissionMetadata,
} from '../decorators/role-permission.decorator';
import { UsersService } from 'src/admin/users/users.service';

@Injectable()
export class RolePermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Get required permission from decorator metadata
    const required = this.reflector.get<RolePermissionMetadata>(
      ROLE_PERMISSION_KEY,
      context.getHandler(),
    );

    // If no permission metadata → allow access
    if (!required) return true;

    // 2. Get user from request (must be set by your auth guard/middleware)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // 3. Check user permission
    const hasPermission = await this.checkUserPermission(
      user,
      required.subject,
      required.action,
    );

    if (!hasPermission) {
      throw new ForbiddenException('You do not have the required permission');
    }

    return true;
  }

  private async checkUserPermission(
    user: any,
    subject: string,
    action: string,
  ): Promise<boolean> {
    const data = await this.userService.userDetails(user.userId);
    if (!data) {
      throw new ForbiddenException('User not found');
    }

    // Role check
    if (!data.role?.roleId) {
      throw new ForbiddenException('Role not found');
    }

    // Admin with manage-all permission
    if (data.role.is_manage_all) {
      return true;
    }

    if (!data?.permissions) {
      throw new ForbiddenException('User permissions not found');
    }

    // Check if user has specific permission
    return data.permissions.some(
      (perm) => perm.subject === subject && perm.action === action,
    );
  }
}

