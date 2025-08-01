import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcryptjs';
import { MailService } from '../../utilis/mail/mail.service'; // Import MailService to send emails


@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private readonly mailService: MailService, // Inject MailService to use it for sending emails
  ) { }

  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  async insertUser(data: any) {
    try {
      const salt = await bcrypt.genSalt();
      data.password = await bcrypt.hash(data.password, salt);
      data.email_verified_at = new Date(); // Set email verification date to now

      // Create a new user instance
      const createdUser = new this.userModel(data);
      const savedUser = await createdUser.save();

      // Send a welcome email after user registration
      try {
        // Convert Mongoose document to plain object for Handlebars
        const userData = savedUser.toObject();

        await this.mailService.sendMail(
          savedUser.email,
          userData,
          `Welcome to ${process.env.APP_NAME} - Account Created Successfully`,
          'admin/mail/auth/register'
        );
        this.logger.log(`Welcome email sent to ${savedUser.email}`);
      } catch (emailError) {
        // Log email error but don't fail the user creation
        this.logger.error(`Failed to send welcome email to ${savedUser.email}:`, emailError.message);
      }

      return savedUser;
    } catch (error) {
      this.logger.error('Failed to create user:', error.message);
      throw error;
    }
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
    return this.userModel.findByIdAndUpdate(id, existingUser, { new: true }).exec();
  }

  async updatePassword(email: string, password: string) {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(password, salt);
    return this.userModel.findByIdAndUpdate(user._id, user, { new: true }).exec();
  }

  remove(id: number) {
    return this.userModel.findByIdAndDelete(id).exec();
  }
}
