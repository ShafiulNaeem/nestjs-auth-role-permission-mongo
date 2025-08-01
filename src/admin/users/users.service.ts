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

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  findByEmail(email: string) {
    // This method should interact with the database to find a user by email
    // For now, we return a mock user object
    return { id: 1, email: email, name: 'Test User' };
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
