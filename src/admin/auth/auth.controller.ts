import {
  Controller,
  Post,
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

@Controller({ version: '1' })
export class AuthController {

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) { }

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

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
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

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
  //   return this.authService.update(+id, updateAuthDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.authService.remove(+id);
  // }
}
