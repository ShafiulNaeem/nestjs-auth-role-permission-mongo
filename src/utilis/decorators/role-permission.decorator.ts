import { SetMetadata } from '@nestjs/common';

export const ROLE_PERMISSION_KEY = 'rolePermission';

export interface RolePermissionMetadata {
  subject: string;
  action: string;
}

export const RolePermission = (subject: string, action: string) =>
  SetMetadata(ROLE_PERMISSION_KEY, { subject, action } as RolePermissionMetadata);

