

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession, PaginateModel, PaginateResult, FilterQuery} from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import { Permission, PermissionDocument } from './schemas/permission.schema';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectModel(Role.name)
    // private roleModel: Model<RoleDocument>,
    private readonly roleModel: PaginateModel<RoleDocument>,
    @InjectModel(Permission.name) 
    private permissionModel: Model<PermissionDocument>
  ) {}


  async create(createRoleDto: CreateRoleDto) {
    const session = await this.roleModel.db.startSession();

    try {
      let createdRoleId: Types.ObjectId | null = null;

      await session.withTransaction(async () => {
        // 1) Create role
        const role = new this.roleModel({
          name: createRoleDto.name,
          is_manage_all: Boolean(createRoleDto.is_manage_all),
          guard_name: createRoleDto.guard_name ?? null,
        });

        const createdRole = await role.save({ session }) as RoleDocument;
        createdRoleId = createdRole._id as Types.ObjectId;

        // 2) Set permissions (if any)
        await this.addPermissionToRole(
          createdRoleId,
          createRoleDto.permissions ?? [],
          session,
        );
      });

      //  return the role with its permissions populated
      if (createdRoleId) {
        return this.roleModel
          .findById(createdRoleId)
          .populate('permissions', 'subject action description')
          .lean();
      }
      return null;
    } finally {
      await session.endSession();
    }
  }

  private async addPermissionToRole(
    roleId: Types.ObjectId | string,
    permissions: Array<{ subject: string; action: string }>,
    session: ClientSession,
  ) {
    const roleObjectId =
      typeof roleId === 'string' ? new Types.ObjectId(roleId) : roleId;

    // Remove old permissions for this role
    await this.permissionModel
      .deleteMany({ roleId: roleObjectId })
      .session(session);

    // Insert new permissions (if any)
    if (permissions?.length) {
      const docs = permissions.map((p) => ({
        subject: p.subject,
        action: p.action,
        roleId: roleObjectId, // keep this consistent with your schema
      }));
      await this.permissionModel.insertMany(docs, { session });
    }
  }

  // Get all roles with their permissions populated
  async findAll(params: any) {
    const collation = { locale: 'en', strength: 1 };
    const { filter } = this.buildRoleFilters(params);
    const sort = '-createdAt';
    const populate = { path: 'permissions', select: 'subject action description' };


    // if params has not limit or limit < 1 -> no pagination
    const limit = Number(params?.limit ?? 0);
    if (!limit || limit < 1) {
      return await this.roleModel
        .find(filter)
        .collation(collation)
        .sort(sort)
        .populate(populate)
        .lean()
        .exec();
    }

    const options = {
      page: params.page || 1,
      limit: params.limit || 10,
      sort: sort,
      collation: collation,
      populate: populate,
    };
    return await this.roleModel.paginate(filter, options);
  }

 
  async findOne(id: string) {
    return await this.roleModel
      .findById(id)
      .populate('permissions')
      .exec();
  }

  private buildRoleFilters(params: any) {
    const filter: FilterQuery<RoleDocument> = {};

    // search by name , permissions, subject, action
    if (params?.search) {
      const searchRegex = { $regex: String(params.search), $options: 'i' };
      filter.name = { $regex: String(params.search), $options: 'i' };
      const matchedRoleIds = this.permissionModel.distinct('roleId', {
        $or: [
          { subject: searchRegex },
          { action: searchRegex }
        ]
      });

      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { _id: { $in: matchedRoleIds } } 
      ];
    }

    // guard name
    if (params?.guard_name) {
      filter.guard_name = params.guard_name;
    }
    return filter;
  }



  async update(id: string, updateRoleDto: UpdateRoleDto) {
     const session = await this.roleModel.db.startSession();
     const existingRole = await this.roleModel.findById(id).exec();
     const updatedRole = { ...existingRole, ...updateRoleDto };
     // Remove permissions property
     delete (updatedRole as any).permissions;

     try {
       await session.withTransaction(async () => {
         // Update role
         await this.roleModel.findByIdAndUpdate(id, updatedRole, { new: true, session });
         // Update permissions
         await this.addPermissionToRole(id, updateRoleDto.permissions ?? [], session);
       });

       return this.roleModel
          .findById(id)
          .populate('permissions', 'subject action description')
          .lean();
     } finally {
       await session.endSession();
     }
  }

  async remove(id: string) {
    const session = await this.roleModel.db.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Remove role from all permissions
        await this.permissionModel.deleteMany({ roleId: id }, { session });

        // Delete the role
        await this.roleModel.findByIdAndDelete(id, { session });
      });
    } finally {
      await session.endSession();
    }
  }
}
