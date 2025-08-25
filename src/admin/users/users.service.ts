import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, PaginateModel } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcryptjs';
import { MailService } from '../../utilis/mail/mail.service';
import { AssignRole, AssignRoleModel, AssignRoleDocument } from '../role/schemas/assign-role.schema';
import { FileService } from 'src/utilis/file/file.service';
import { Auth } from 'src/utilis/auth-facade/auth';
import { Role, RoleDocument } from '../role/schemas/role.schema';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name)
    private userModel: PaginateModel<UserDocument>,

    private readonly mailService: MailService,

    @InjectModel(AssignRole.name)
    private assignRoleModel: Model<AssignRoleDocument>,

    @InjectModel(Role.name)
    private roleModel: Model<RoleDocument>
  ) { }

  async insertUser(data: any) {
    const session = await this.userModel.db.startSession();
    let savedUser;
    try {
      await session.withTransaction(async () => {
        const salt = await bcrypt.genSalt();
        if (data.password) {
          data.password = await bcrypt.hash(data.password, salt);
        }
        data.email_verified_at = new Date(); // Set email verification date to now

        // Check if roleId exists and has a valid value (not null or undefined)
        const roleId = data?.roleId ?? null;
        if ('roleId' in data) {
          delete data.roleId;
        }
        // Create a new user instance
        const createdUser = new this.userModel(data);
        savedUser = await createdUser.save({ session });

        // assign role to user
        if (roleId) {
          await this.assignRole(roleId, savedUser._id, session);
        }
      });

      try {
        // Convert Mongoose document to plain object for Handlebars
        const userData = savedUser.toObject();

        await this.mailService.sendEmailUsingQueue(
          savedUser.email,
          userData,
          `Welcome to ${process.env.APP_NAME} - Account Created Successfully`,
          'admin/mail/auth/register',
        );
        this.logger.log(`Welcome email sent to ${savedUser.email}`);
      } catch (emailError) {
        // Log email error but don't fail the user creation
        this.logger.error(
          `Failed to send welcome email to ${savedUser.email}:`,
          emailError.message,
        );
      }

      return this.userDetails(savedUser._id);
    } catch (error) {
      this.logger.error('Failed to create user:', error.message);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  private processUserData(
    data: any,
    file: Express.Multer.File | null,
    oldFile: string = null,
    method: 'create' | 'update'
  ) {

    const salt = bcrypt.genSaltSync();
    if (data.password) {
      data.password = bcrypt.hashSync(data.password, salt);
    }
    data.email_verified_at = new Date();
    // update file information
    if (file) {
      data.image = FileService.updateFile(file, oldFile, 'users/profile');
    }
    // add created by if method create
    if (method == 'create' && Auth.check()) {
      data.created_by = Auth.id();
    } else {
      data.updated_by = Auth.id();
    }
    if ('roleId' in data) {
      delete data.roleId;
    }
    if ('id' in data) {
      delete data.id;
    }
    return data;
  }

  private async assignRole(roleId: string, userId: string, session: any) {
    await this.assignRoleModel.deleteMany({ userId: userId }, { session });
    const assignRole = new this.assignRoleModel({
      userId: userId,
      roleId: roleId,
    });
    return await assignRole.save({ session });
  }

  private async sendWelcomeEmail(savedUser: User) {
    try {
      const userData = savedUser.toObject();
      await this.mailService.sendEmailUsingQueue(
        savedUser.email,
        userData,
        `Welcome to ${process.env.APP_NAME} - Account Created Successfully`,
        'admin/mail/auth/register',
      );
      this.logger.log(`Welcome email sent to ${savedUser.email}`);
    } catch (emailError) {
      // Log email error but don't fail the user creation
      this.logger.error(
        `Failed to send welcome email to ${savedUser.email}:`,
        emailError.message,
      );
    }
  }

  async create(createdUser: CreateUserDto, file: Express.Multer.File | null) {
    const session = await this.userModel.db.startSession();
    let savedUser;
    try {
      await session.withTransaction(async () => {
        // define role id  
        const roleId = createdUser?.roleId ?? null;
        // process user data
        const data = this.processUserData(createdUser, file, null, 'create');
        const newUser = new this.userModel(data);
        savedUser = await newUser.save({ session });
        // console.log("roleId", roleId);
        // assign role to user
        if (roleId) {
          await this.assignRole(roleId, savedUser._id, session);
        }
      });

      // send welcome email
      await this.sendWelcomeEmail(savedUser);

      return this.userDetails(savedUser._id);
    } catch (error) {
      this.logger.error('Failed to create user:', error.message);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto, file: Express.Multer.File = null) {
    const session = await this.userModel.db.startSession();
    const existingUser = await this.userModel.findById(id).exec();
    if (!existingUser) {
      throw new Error('User not found');
    }
    let savedUser;
    try {
      await session.withTransaction(async () => {
        const roleId = updateUserDto?.roleId ?? null;

        // process user data
        const data = this.processUserData(updateUserDto, file, existingUser.image, 'update');
        savedUser = await this.userModel.findByIdAndUpdate(id, data, { new: true, session }).exec();

        // assign role to user
        if (roleId) {
          await this.assignRole(roleId, id, session);
        }
      });
      // send welcome email
      await this.sendWelcomeEmail(savedUser);
      return this.userDetails(id);
    } catch (error) {
      this.logger.error('Failed to update user:', error.message);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  private async filter(params: any) {
    const filter: FilterQuery<UserDocument> = {};
    // search by name, email
    if (params?.search) {
      const searchRegex = { $regex: String(params.search), $options: 'i' };
      // Get role IDs that have name matching the search
      const matchedRoleIds = await this.roleModel.distinct('_id', {
        name: searchRegex,
      });
      // get user IDs that have matching roles
      const matchedUserIds = await this.assignRoleModel.distinct('userId', {
        roleId: { $in: matchedRoleIds },
      });
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { _id: { $in: matchedUserIds } },
      ];
    }
    // role ID
    if (params?.roleId) {
      // get user IDs that have matching roles
      const userIds = await this.assignRoleModel.distinct('userId', {
        roleId: params.roleId,
      });
      filter._id = { $in: userIds };
    }
    return filter;
  }

  async findAll(params: any = null) {
    const collation = { locale: 'en', strength: 1 };
    const filter = await this.filter(params);
    const sort = 'createdAt -1';
    const populate = {
      path: 'assignRole',
      select: 'roleId',
      populate: {
        path: 'role',
        select: 'name is_manage_all'
      }
    };
    // if params has not limit or limit < 1 -> no pagination
    const limit = Number(params?.limit ?? 0);
    if (!limit || limit < 1) {
      return await this.userModel
        .find(filter)
        // .collation(collation)
        .sort(sort)
        .populate(populate)
        .lean()
        .exec();
    }

    const options = {
      page: params.page || 1,
      limit: params.limit || 10,
      sort: sort,
      // collation: collation,
      populate: populate,
    };
    return await this.userModel.paginate(filter, options);
  }

  async findOne(id: string) {
    return await this.userModel.findById(id).exec();
  }

  async findByEmail(email: string) {
    return await this.userModel.findOne({ email }).exec();
  }

  async findByProvider(
    provider: string,
    providerId: string,
  ): Promise<User | null> {
    return await this.userModel.findOne({ provider, providerId }).exec();
  }

  async updatePassword(email: string, password: string) {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(password, salt);
    return this.userModel
      .findByIdAndUpdate(user._id, user, { new: true })
      .exec();
  }

  async remove(id: string) {
    const session = await this.userModel.db.startSession();
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new Error('User not found');
    }
    try {
      await session.withTransaction(async () => {
        // delete assign role
        await this.assignRoleModel.deleteMany({ userId: id }, { session });
        // delete user
        await this.userModel.findByIdAndDelete(id, { session });
      });
    } catch (error) {
      this.logger.error('Failed to delete user roles:', error.message);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async userDetails(userId: string) {
    const data = await this.userModel
      .findById(userId)
      .populate({
        path: 'assignRole',
        select: 'roleId',
        populate: {
          path: 'role',
          select: 'name is_manage_all',
          populate: {
            path: 'permissions',
            select: 'subject action',
          },
        },
      })
      .select('_id email name image status createdAt updatedAt')
      .exec();

    const user = data?.toObject ? data.toObject() : data;
    // Use type assertion to inform TypeScript about assignRole and timestamps
    const userWithRole = user as typeof user & {
      assignRole?: any;
      createdAt?: Date;
      updatedAt?: Date;
    };

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        image: user.image,
        status: user.status,
        createdAt: userWithRole.createdAt,
        updatedAt: userWithRole.updatedAt,
      },
      role: {
        roleId: userWithRole.assignRole?.roleId ?? null,
        name: userWithRole.assignRole?.role?.name ?? null,
        is_manage_all: userWithRole.assignRole?.role?.is_manage_all ?? null,
      },
      permissions: userWithRole.assignRole?.role?.permissions ?? [],
    };
  }

  async linkIdentity(userId: string, profile: any): Promise<User> {
    const updateData = {
      $set: {
        provider: profile.provider,
        providerId: profile.providerId,
        email: profile.email,
        name: profile.name,
        image: profile.image,
      },
    };
    const user = await this.userModel.findByIdAndUpdate(userId, updateData, {
      new: true,
    });
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async createOAuthUser(data: any) {
    try {
      const salt = await bcrypt.genSalt();
      data.password = await bcrypt.hash('password', salt);
      data.email_verified_at = new Date();
      const createdUser = new this.userModel(data);
      const savedUser = await createdUser.save();
      return savedUser;
    } catch (error) {
      this.logger.error('Failed to create user:', error.message);
      throw error;
    }
  }

  async setRefreshToken(userId: string, refreshToken: string): Promise<User> {
    // Hash the refresh token using bcrypt
    const hashedToken = await bcrypt.hash(refreshToken, 10);

    // Store the hashed refresh token in the user's record
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { refreshTokenHash: hashedToken } },
      { new: true }, // Return the updated document
    );

    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async verifyRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<boolean> {
    const user = await this.userModel.findById(userId);
    if (!user || !user.refreshTokenHash) {
      return false;
    }

    // Compare the provided refresh token with the stored hash
    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    return isValid;
  }
}
