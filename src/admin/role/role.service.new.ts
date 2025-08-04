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
      const permissions = createRoleDto.permissions.map((permission) => ({
        subject: permission.subject,
        action: permission.action,
        roleId: createdRole._id, // Each permission belongs to this role
      }));

      await this.permissionModel.insertMany(permissions);
    }

    return this.findOne(createdRole._id.toString());
  }

  // Get all roles with their permissions
  async findAll() {
    const roles = await this.roleModel.find().exec();
    
    // Manually populate permissions for each role
    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        const permissions = await this.permissionModel
          .find({ roleId: role._id })
          .select('subject action description')
          .exec();
        
        return {
          ...role.toObject(),
          permissions,
        };
      })
    );

    return rolesWithPermissions;
  }

  // Get role by ID with permissions
  async findOne(id: string) {
    const role = await this.roleModel.findById(id).exec();
    
    if (!role) {
      return null;
    }

    const permissions = await this.permissionModel
      .find({ roleId: role._id })
      .select('subject action description')
      .exec();

    return {
      ...role.toObject(),
      permissions,
    };
  }

  // Add permission to role
  async addPermissionToRole(roleId: string, permissionData: { subject: string; action: string; description?: string }) {
    const permission = new this.permissionModel({
      ...permissionData,
      roleId: new Types.ObjectId(roleId),
    });

    return await permission.save();
  }

  // Remove permission from role
  async removePermissionFromRole(permissionId: string) {
    return await this.permissionModel.findByIdAndDelete(permissionId);
  }

  // Update role
  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const updatedRole = await this.roleModel
      .findByIdAndUpdate(id, updateRoleDto, { new: true })
      .exec();

    if (!updatedRole) {
      return null;
    }

    return this.findOne(id);
  }

  // Remove role and all its permissions
  async remove(id: string) {
    const session = await this.roleModel.db.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Delete all permissions belonging to this role
        await this.permissionModel.deleteMany({ roleId: id }, { session });
        
        // Delete the role
        await this.roleModel.findByIdAndDelete(id, { session });
      });
      
      return { deleted: true };
    } finally {
      await session.endSession();
    }
  }

  // Get all permissions for a specific role
  async getRolePermissions(roleId: string) {
    return await this.permissionModel
      .find({ roleId })
      .select('subject action description')
      .exec();
  }

  // Update role permissions (replace all permissions)
  async updateRolePermissions(roleId: string, permissions: { subject: string; action: string; description?: string }[]) {
    const session = await this.roleModel.db.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Delete existing permissions
        await this.permissionModel.deleteMany({ roleId }, { session });
        
        // Add new permissions
        const newPermissions = permissions.map((permission) => ({
          ...permission,
          roleId: new Types.ObjectId(roleId),
        }));
        
        await this.permissionModel.insertMany(newPermissions, { session });
      });
      
      return this.findOne(roleId);
    } finally {
      await session.endSession();
    }
  }
}
