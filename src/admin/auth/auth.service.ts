import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { InjectModel } from '@nestjs/mongoose';
import { PasswordResetToken, PasswordResetTokenDocument } from '../users/schemas/password-reset-token.schema';
import { Model } from 'mongoose';
import { MailService } from '../../utilis/mail/mail.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {

  constructor(
    @InjectModel(PasswordResetToken.name)
    private passwordResetTokenModel: Model<PasswordResetTokenDocument>,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
  ) { }


  login(loginDto: LoginDto) {
    return 'This action adds a new auth';
  }

  async forgotPassword(data: any) {
    const user = await this.usersService.findByEmail(data.email);
    if (!user) {
      throw new Error('User not found');
    }
    // delete old password reset tokens based on id or email
    await this.passwordResetTokenModel.deleteMany({
      $or: [
        { userId: user._id },
        { email: data.email }
      ]
    }).exec();

    let expireTime = 10 * 60 * 1000; // 10 minutes
    let token = null;
    if (!data.url_or_otp) {
      // generate 6 digit otp
      token = Math.floor(100000 + Math.random() * 900000);
    } else {
      // generate a random token
      token = randomBytes(32).toString('hex');
    }

    // Create a new password reset token
    const tokenData = new this.passwordResetTokenModel({
      userId: user._id,
      email: data.email,
      token: token,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + expireTime),
      url_or_otp: data.url_or_otp || null, // Assuming this is a URL-based token
      redirect_url: data.redirect_url || null, // Optional redirect URL
    });
    // Save the token to the database
    let savedToken = await tokenData.save();
    const savedTokenObj = savedToken.toObject() as any;
    savedTokenObj.resetLink = `${process.env.FRONTEND_URL}/password/reset?token=${savedTokenObj.token}&email=${savedTokenObj.email}`;
    savedTokenObj.name = user.name || '';
    // send email with token
    try {
      await this.mailService.sendMail(
        user.email,
        savedTokenObj,
        `Password Reset Request for ${process.env.APP_NAME}`,
        'admin/mail/auth/forgot-password'
      );
    } catch (error) {
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }

    return savedTokenObj;

  }

  async verifyToken(data: any) {
    // get token wise data
    const token = await this.passwordResetTokenModel.findOne({ token: data.token }).exec();

    if (!token) {
      throw new Error('Invalid token');
    }
    if (token.expiresAt < new Date()) {
      throw new Error('Token expired');
    }

    return data;
  }

  async resetPassword(data: any) {
    await this.passwordResetTokenModel.deleteMany({
      email: data.email
    }).exec();
    return await this.usersService.updatePassword(data.email, data.password);
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
