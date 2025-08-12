import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Model,
  Types,
  ClientSession,
  PaginateModel,
  PaginateResult,
  FilterQuery,
} from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import { Permission, PermissionDocument } from './schemas/permission.schema';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import {
  AssignRole,
  AssignRoleModel,
  AssignRoleDocument,
} from './schemas/assign-role.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class RoleService {
  constructor(
    @InjectModel(Role.name)
    // private roleModel: Model<RoleDocument>,
    private readonly roleModel: PaginateModel<RoleDocument>,

    @InjectModel(Permission.name)
    private permissionModel: Model<PermissionDocument>,

    @InjectModel(AssignRole.name)
    private assignRoleModel: AssignRoleModel,

    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
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

        const createdRole = (await role.save({ session })) as RoleDocument;
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
    const { filter } = await this.buildRoleFilters(params);
    const sort = 'name';
    const populate = {
      path: 'permissions',
      select: 'subject action description',
    };
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

  async dropdown(params: any) {
    const collation = { locale: 'en', strength: 1 };
    const { filter } = await this.buildRoleFilters(params);
    const sort = 'name';
    return await this.roleModel
      .find(filter)
      .collation(collation)
      .sort(sort)
      .select('_id name guard_name is_manage_all')
      .lean()
      .exec();
  }

  async findOne(id: string) {
    return await this.roleModel.findById(id).populate('permissions').exec();
  }

  private async buildRoleFilters(params: any) {
    const filter: FilterQuery<RoleDocument> = {};

    // search by name, permissions, subject, action
    if (params?.search) {
      const searchRegex = { $regex: String(params.search), $options: 'i' };

      // Get role IDs that have permissions matching the search
      const matchedRoleIds = await this.permissionModel.distinct('roleId', {
        $or: [{ subject: searchRegex }, { action: searchRegex }],
      });

      filter.$or = [
        { name: searchRegex },
        { guard_name: searchRegex },
        { _id: { $in: matchedRoleIds } },
      ];
    }

    // guard name
    if (params?.guard_name) {
      filter.guard_name = params.guard_name;
    }

    return { filter };
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const session = await this.roleModel.db.startSession();
    try {
      await session.withTransaction(async () => {
        // Update role
        await this.roleModel.findByIdAndUpdate(
          id,
          {
            name: updateRoleDto.name,
            is_manage_all: updateRoleDto.is_manage_all,
            guard_name: updateRoleDto.guard_name,
          },
          { new: true, session },
        );
        // Update permissions
        await this.addPermissionToRole(
          id,
          updateRoleDto.permissions ?? [],
          session,
        );
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
    const existingRole = await this.roleModel.findById(id).exec();
    if (!existingRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
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

  async assignRole(assignRoleDto: AssignRoleDto) {
    const session = await this.assignRoleModel.db.startSession();
    let assignId: Types.ObjectId | null = null;

    try {
      await session.withTransaction(async () => {
        // ensure unique role per user: remove older rows
        await this.assignRoleModel.deleteMany(
          { userId: new Types.ObjectId(assignRoleDto.userId) },
          { session },
        );

        const created = await new this.assignRoleModel({
          userId: new Types.ObjectId(assignRoleDto.userId),
          roleId: new Types.ObjectId(assignRoleDto.roleId),
        }).save({ session });

        assignId = created._id;
      });

      // return the created assignment populated (note: fields are userId/roleId)
      return this.assignRoleModel
        .findById(assignId)
        .populate('user','name email')
        .populate({
          path: 'role', // first populate the role
          select: 'name is_manage_all', // optional: choose fields
          // populate: {
          //   path: 'permissions', // now populate the permissions inside role
          //   select: 'subject action', // choose fields from Permission schema
          // },
        })
        // .populate({ path: 'userId', select: 'name email' })
        // .populate({ path: 'roleId', select: 'name is_manage_all' })
        .lean()
        .exec();
    } finally {
      await session.endSession();
    }
  }

  private async assignRoleFilter(params: any) {
    const filter: FilterQuery<AssignRoleDocument> = {};

    // search by user , role
    if (params?.search) {
      const searchRegex = { $regex: String(params.search), $options: 'i' };

      // Get role IDs that have permissions matching the search
      const matchedRoleIds = await this.roleModel.distinct('_id', {
        name: searchRegex,
      });

      const matchedUserIds = await this.userModel.distinct('_id', {
        name: searchRegex,
      });

      filter.$or = [
        { roleId: { $in: matchedRoleIds } },
        { userId: { $in: matchedUserIds } },
      ];
    }

    if (params?.roleId) {
      filter.roleId = new Types.ObjectId(params.roleId);
    }

    if (params?.userId) {
      filter.userId = new Types.ObjectId(params.userId);
    }

    return { filter };
  }

  async assignRoleList(params: any) {
    const { filter } = await this.assignRoleFilter(params);
    const collation = { locale: 'en', strength: 1 };
    const page = Number(params?.page) || 1;
    const limit = Number(params?.limit) || 0;

    const pipeline: any[] = [
      { $match: filter },
      
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
          pipeline: [{ $project: { name: 1, email: 1 } }],
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'roles',
          localField: 'roleId',
          foreignField: '_id',
          as: 'role',
          pipeline: [{ $project: { name: 1, is_manage_all: 1 } }],
        },
      },
      { $unwind: { path: '$role', preserveNullAndEmptyArrays: true } },

      { $sort: { 'user.name': 1 } },

      // select fields to return
      {
        $project: {
          _id: 1,
          roleId: 1,
          userId: 1,
          user: 1,
          role: 1,
        },
      },
      
    ];

    //   const pipeline: any[] = [
    //   { $match: filter },
      
    //   {
    //     $lookup: {
    //       from: 'users',
    //       localField: 'userId',
    //       foreignField: '_id',
    //       as: 'user',
    //       pipeline: [{ $project: { name: 1, email: 1 } }],
    //     },
    //   },
    //   { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    //   {
    //     $lookup: {
    //       from: 'roles',
    //       localField: 'roleId',
    //       foreignField: '_id',
    //       as: 'role',
    //       // pipeline: [{ $project: { name: 1, is_manage_all: 1 } }],
    //       pipeline: [
    //       { $project: { name: 1, is_manage_all: 1 } },
    //       {
    //         $lookup: {
    //           from: 'permissions',
    //           localField: '_id',    
    //           foreignField: 'roleId',
    //           as: 'permissions',
    //           pipeline: [
    //             { $project: { subject: 1, action: 1 } }, // trim fields
    //           ],
    //         },
    //       },
    //     ],
    //     },
    //   },
    //   { $unwind: { path: '$role', preserveNullAndEmptyArrays: true } },

    //   { $sort: { 'user.name': 1 } },

    //   // select fields to return
    //   {
    //     $project: {
    //       _id: 1,
    //       roleId: 1,
    //       userId: 1,
    //       user: 1,
    //       role: 1,
    //     },
    //   },
      
    // ];

    if (!limit || limit < 1) {
      return this.assignRoleModel
        .aggregate(pipeline)
        .collation(collation)
        .option({ allowDiskUse: true })
        .exec();
    }

    const agg = this.assignRoleModel
      .aggregate(pipeline)
      .option({ allowDiskUse: true });
    const res = await this.assignRoleModel.aggregatePaginate(agg, {
      page,
      limit,
      collation,
    });

    return {
      docs: res.docs,
      totalDocs: res.totalDocs,
      page: res.page,
      limit: res.limit,
      totalPages: res.totalPages,
      hasNextPage: res.hasNextPage,
      hasPrevPage: res.hasPrevPage,
      nextPage: res.nextPage,
      prevPage: res.prevPage,
    };
  }
}
