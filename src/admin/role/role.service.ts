

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import { Permission, PermissionDocument } from './schemas/permission.schema';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectModel(Role.name)
    private roleModel: Model<RoleDocument>,
    @InjectModel(Permission.name) 
    private permissionModel: Model<PermissionDocument>
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    // Create the role first
    const role = new this.roleModel({
      name: createRoleDto.name,
      is_manage_all: createRoleDto.is_manage_all || false,
      guard_name: createRoleDto.guard_name || null,
    });

    const createdRole = await role.save();

    // Handle permissions if provided
    if (createRoleDto.permissions && createRoleDto.permissions.length > 0) {
      const permissionIds = [];

      for (const permissionData of createRoleDto.permissions) {
        // Check if permission already exists
        let permission = await this.permissionModel.findOne({
          subject: permissionData.subject,
          action: permissionData.action,
        });

        // If permission doesn't exist, create it
        if (!permission) {
          permission = new this.permissionModel({
            subject: permissionData.subject,
            action: permissionData.action,
            name: `${permissionData.action}-${permissionData.subject}`,
            roles: [createdRole._id],
          });
          await permission.save();
        } else {
          // If permission exists, add this role to its roles array
          if (!permission.roles.includes(createdRole._id)) {
            permission.roles.push(createdRole._id);
            await permission.save();
          }
        }

        permissionIds.push(permission._id);
      }

      // Update role with permission IDs
      createdRole.permissions = permissionIds;
      await createdRole.save();
    }

    return createdRole;
  }

  // Get all roles with their permissions populated
  async findAll() {
    return await this.roleModel
      .find()
      .populate('permissions', 'subject action name description')
      .exec();
  }

  // Get role by ID with permissions populated
  async findOne(id: string) {
    return await this.roleModel
      .findById(id)
      .populate('permissions', 'subject action name description')
      .exec();
  }

  // Add permission to role (Many-to-Many)
  async addPermissionToRole(roleId: string, permissionId: string) {
    const session = await this.roleModel.db.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Add permission to role
        await this.roleModel.findByIdAndUpdate(
          roleId,
          { $addToSet: { permissions: permissionId } },
          { session }
        );

        // Add role to permission
        await this.permissionModel.findByIdAndUpdate(
          permissionId,
          { $addToSet: { roles: roleId } },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }
  }

  // Remove permission from role (Many-to-Many)
  async removePermissionFromRole(roleId: string, permissionId: string) {
    const session = await this.roleModel.db.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Remove permission from role
        await this.roleModel.findByIdAndUpdate(
          roleId,
          { $pull: { permissions: permissionId } },
          { session }
        );

        // Remove role from permission
        await this.permissionModel.findByIdAndUpdate(
          permissionId,
          { $pull: { roles: roleId } },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    return await this.roleModel
      .findByIdAndUpdate(id, updateRoleDto, { new: true })
      .populate('permissions', 'subject action name description')
      .exec();
  }

  async remove(id: string) {
    const session = await this.roleModel.db.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Remove role from all permissions
        await this.permissionModel.updateMany(
          { roles: id },
          { $pull: { roles: id } },
          { session }
        );

        // Delete the role
        await this.roleModel.findByIdAndDelete(id, { session });
      });
    } finally {
      await session.endSession();
    }
  }
}
