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
  Req,
  Res,
  Inject,
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
import { Public } from 'src/utilis/decorators/public.decorator';
import { AuthGuard } from '@nestjs/passport';
import {
  Response as ExpressResponse,
  Request as ExpressRequest,
} from 'express';
import { GoogleStrategy } from './strategies/google.strategy';
import { Auth } from 'src/utilis/auth-facade/auth';

@Controller({ version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    @Inject(GoogleStrategy)
    private readonly googleStrategy: GoogleStrategy, // Inject GoogleStrategy to use it for Google authentication
  ) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const user = await this.authService.validateUser(
        loginDto.email,
        loginDto.password,
      );
      const loginResult = await this.authService.login(user);

      return {
        statusCode: 200,
        message: 'Login successful',
        data: loginResult,
      };
    } catch (error) {
      throw error;
    }
  }

  @Public()
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
  async register(
    @Body() registerDto: RegisterDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
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

  @Public()
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

  @Public()
  @Post('password/verify')
  async verifyToken(@Body() verifyOtpOrTokenDto: VerifyOtpOrTokenDto) {
    return {
      statusCode: 200,
      message: 'Token verification successful',
      data: await this.authService.verifyToken(verifyOtpOrTokenDto),
    };
  }

  @Public()
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
  async profile(@Request() req) {

    return {
      statusCode: 200,
      message: 'Profile retrieved successfully',
      data: await this.usersService.userDetails(req.user.userId),
    };
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

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: any) {}

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: ExpressRequest,
    @Res() res: ExpressResponse,
  ) {
    try {
      const profile = req.user as any; // Cast to any to access user properties
      // console.log('Google profile:', profile);
      const { user, access_token, refresh_token } =
        await this.authService.validateOAuthLogin(profile);

      // Option A: Redirect to FE with tokens in URL fragment (avoid logs)
      // const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
      // redirectUrl.pathname = '/oauth/callback';
      // redirectUrl.hash = `access=${encodeURIComponent(access_token)}&refresh=${encodeURIComponent(refreshToken)}`;
      // return res.redirect(redirectUrl.toString());

      // Option B: Set cookies then redirect
      // res.cookie('access_token', accessToken, { httpOnly: true, secure: true, sameSite: 'lax' });
      // res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: true, sameSite: 'lax' });
      // return res.redirect(this.config.get('FRONTEND_URL') + '/oauth/callback');

      // Option C: Direct JSON (handy for mobile deep-links)
      // Send JSON response
      return res.json({
        statusCode: 200,
        message: 'Google authentication successful',
        data: {
          user,
          access_token,
          refresh_token,
        },
      });
    } catch (error) {
      return res.status(400).json({ statusCode: 400, message: error.message });
    }
  }

  // github
  @Public()
  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth(@Req() req: any) {}

  @Public()
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(
    @Req() req: ExpressRequest,
    @Res() res: ExpressResponse,
  ) {
    try {
      const profile = req.user as any; // Cast to any to access user properties
      console.log('GitHub profile:', profile);
      const { user, access_token, refresh_token } =
        await this.authService.validateOAuthLogin(profile);

      // Send JSON response
      return res.json({
        statusCode: 200,
        message: 'GitHub authentication successful',
        data: {
          user,
          access_token,
          refresh_token,
        },
      });
    } catch (error) {
      return res.status(400).json({ statusCode: 400, message: error.message });
    }
  }

  @Public()
  @Get('linkedin')
  @UseGuards(AuthGuard('linkedin'))
  async linkedinAuth(@Req() req: any) {}

  @Public()
  @Get('linkedin/callback')
  @UseGuards(AuthGuard('linkedin'))
  async linkedinCallback(
    @Req() req: ExpressRequest,
    @Res() res: ExpressResponse,
  ) {
    try {
      const profile = req.user as any; // Cast to any to access user properties
      console.log('LinkedIn profile:', profile);
      const { user, access_token, refresh_token } =
        await this.authService.validateOAuthLogin(profile);

      // Send JSON response
      return res.json({
        statusCode: 200,
        message: 'LinkedIn authentication successful',
        data: {
          user,
          access_token,
          refresh_token,
        },
      });
    } catch (error) {
      return res.status(400).json({ statusCode: 400, message: error.message });
    }
  }

  @Public()
  @Get('twitter')
  @UseGuards(AuthGuard('twitter'))
  async twitterAuth(@Req() req: any) {}

  @Public()
  @Get('twitter/callback')
  @UseGuards(AuthGuard('twitter'))
  async twitterCallback(
    @Req() req: ExpressRequest,
    @Res() res: ExpressResponse,
  ) {
    try {
      const profile = req.user as any; // Cast to any to access user properties
      console.log('Twitter profile:', profile);
      const { user, access_token, refresh_token } =
        await this.authService.validateOAuthLogin(profile);

      // Send JSON response
      return res.json({
        statusCode: 200,
        message: 'Twitter authentication successful',
        data: {
          user,
          access_token,
          refresh_token,
        },
      });
    } catch (error) {
      return res.status(400).json({ statusCode: 400, message: error.message });
    }
  }

  // facebook
  @Public()
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuth(@Req() req: any) {}

  @Public()
  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookCallback(
    @Req() req: ExpressRequest,
    @Res() res: ExpressResponse,
  ) {
    try {
      const profile = req.user as any; // Cast to any to access user properties
      console.log('Facebook profile:', profile);
      const { user, access_token, refresh_token } =
        await this.authService.validateOAuthLogin(profile);

      // Send JSON response
      return res.json({
        statusCode: 200,
        message: 'Facebook authentication successful',
        data: {
          user,
          access_token,
          refresh_token,
        },
      });
    } catch (error) {
      return res.status(400).json({ statusCode: 400, message: error.message });
    }
  }
}
