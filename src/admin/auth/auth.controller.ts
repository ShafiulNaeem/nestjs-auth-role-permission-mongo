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

  // @Get()
  // findAll() {
  //   return this.authService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.authService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
  //   return this.authService.update(+id, updateAuthDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.authService.remove(+id);
  // }
}
