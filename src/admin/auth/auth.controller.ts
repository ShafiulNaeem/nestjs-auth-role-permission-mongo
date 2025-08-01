import {
  Controller,
  Post,
  Get,
  Request,
  UseGuards,
  Body,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpOrTokenDto } from './dto/verify-otp-or-token.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller({ version: '1' })
export class AuthController {

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) { }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const user = await this.authService.validateUser(loginDto.email, loginDto.password);
      const loginResult = await this.authService.login(user);

      return {
        statusCode: 200,
        message: 'Login successful',
        data: loginResult
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('register')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/profile', // make sure this folder exists
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
        //   return cb(new BadRequestException('Only image files are allowed'), false);
        // }
        cb(null, true);
      },
      // limits: {
      //   fileSize: 2 * 1024 * 1024, // 2MB
      // },
    }),
  )
  async register(@Body() registerDto: RegisterDto, @UploadedFile() image: Express.Multer.File) {

    try {
      let data = registerDto;
      delete data.confirmPassword;
      if (image) {
        data.image = image.path; // store the filename in the DTO
      } else {
        data.image = null; // or handle the case where no image is uploaded
      }

      return {
        statusCode: 201,
        message: 'User registered successfully',
        data: await this.usersService.insertUser(data),

      };
    } catch (error) {
      throw new BadRequestException('Error processing registration');
    }
  }

  @Post('password/forgot')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    try {
      return {
        statusCode: 200,
        message: 'Forgot password request processed successfully',
        data: await this.authService.forgotPassword(forgotPasswordDto),
      };
    } catch (error) {
      throw new BadRequestException('Error processing forgot password request');
    }
  }

  @Post('password/verify')
  async verifyToken(@Body() verifyOtpOrTokenDto: VerifyOtpOrTokenDto) {
    return {
      statusCode: 200,
      message: 'Token verification successful',
      data: await this.authService.verifyToken(verifyOtpOrTokenDto),
    };
  }

  @Post('password/reset')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    try {
      return {
        statusCode: 200,
        message: 'Password reset successful',
        data: await this.authService.resetPassword(resetPasswordDto),
      };
    } catch (error) {
      throw new BadRequestException('Error processing password reset');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  profile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Request() req: Express.Request) {
    return {
      statusCode: 200,
      message: 'Logout successful',
      data: null,
    };
  }
}
