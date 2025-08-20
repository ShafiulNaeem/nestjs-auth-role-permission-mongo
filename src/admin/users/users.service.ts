import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcryptjs';
import { MailService } from '../../utilis/mail/mail.service';
import {
  AssignRole,
  AssignRoleModel,
  AssignRoleDocument,
} from '../role/schemas/assign-role.schema';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,

    private readonly mailService: MailService,

    @InjectModel(AssignRole.name)
    private assignRoleModel: Model<AssignRoleDocument>,
  ) {}

  async insertUser(data: any) {
    const session = await this.userModel.db.startSession();
    let savedUser;
    try {
      await session.withTransaction(async () => {
        const salt = await bcrypt.genSalt();
        if (!data.password) {
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
          this.assignRole(roleId, savedUser._id, session);
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

      return savedUser;
    } catch (error) {
      await session.endSession();
      this.logger.error('Failed to create user:', error.message);
      throw error;
    }
  }

  processUserData(data: any, oldImage: string = null) {
    const salt = bcrypt.genSaltSync();
    if (data.password) {
      data.password = bcrypt.hashSync(data.password, salt);
    }
    data.email_verified_at = new Date();
    if ('roleId' in data) {
      delete data.roleId;
    }
    return data;
  }

  assignRole(roleId: string, userId: string, session: any) {
    this.assignRoleModel.deleteMany({ userId: userId }, { session });
    new this.assignRoleModel({
      userId: userId,
      roleId: roleId,
    }).save({ session });
  }

  async findAll() {
    return this.userModel.find().exec();
  }

  async findOne(id: string) {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async findByProvider(
    provider: string,
    providerId: string,
  ): Promise<User | null> {
    return this.userModel.findOne({ provider, providerId }).exec();
  }

  async update(id: number, user: any) {
    const existingUser = await this.userModel.findById(id).exec();
    if (!existingUser) {
      throw new Error('User not found');
    }
    Object.assign(existingUser, user);
    if (user.password) {
      const salt = await bcrypt.genSalt();
      existingUser.password = await bcrypt.hash(existingUser.password, salt);
    }
    return this.userModel
      .findByIdAndUpdate(id, existingUser, { new: true })
      .exec();
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

  remove(id: number) {
    return this.userModel.findByIdAndDelete(id).exec();
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
