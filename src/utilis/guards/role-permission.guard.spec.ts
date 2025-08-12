import { RolePermissionGuard } from './role-permission.guard';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../../admin/users/users.service';

describe('RolePermissionGuard', () => {
  let guard: RolePermissionGuard;
  let reflector: Reflector;
  let usersService: UsersService;

  beforeEach(() => {
    reflector = {} as Reflector;
    usersService = {} as UsersService;
    guard = new RolePermissionGuard(reflector, usersService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });
});
