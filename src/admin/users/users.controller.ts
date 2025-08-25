import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Query,
  Delete,
  UseGuards,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { stat } from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolePermission } from 'src/utilis/decorators/role-permission.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { KeyValueFileValidationPipe } from 'src/utilis/validation/file-key-value-validation.pipe';

@Controller({ version: '1', path: 'users' })
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  @RolePermission('User', 'create')
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile(new KeyValueFileValidationPipe({
      fieldName: 'image',
      required: false,
      maxSize: 2 * 1024 * 1024,
      fileType: /(jpg|jpeg|png)$/,
      //message: "Image must be a valid file type (jpg, jpeg, png) and not exceed 2MB",
    }))
    file: Express.Multer.File
  ) {
    try {
      const userData = await this.usersService.create(createUserDto, file);
      // console.log("user:data", userData);
      return {
        statusCode: 201,
        message: 'User created successfully',
        data: userData
      };
    } catch (error) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Failed to create user',
        error: error.message
      });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @RolePermission('User', 'update')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    // @UploadedFile(
    //   new ParseFilePipe({
    //     validators: [
    //       new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }), // 2 MB
    //       new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }), // only jpg/png
    //     ],
    //     fileIsRequired: false, // optional file
    //   }),
    // )
    @UploadedFile(new KeyValueFileValidationPipe({
      fieldName: 'image',
      required: false,
      maxSize: 2 * 1024 * 1024,
      fileType: /(jpg|jpeg|png)$/
    }))
    file: Express.Multer.File
  ) {
    try {
      const userData = await this.usersService.update(id, updateUserDto, file);
      return {
        statusCode: 200,
        message: 'User updated successfully',
        data: userData
      };
    } catch (error) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Failed to update user',
        error: error.message
      });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @RolePermission('User', 'list')
  findAll(@Query() query: any) {
    return {
      statusCode: 200,
      message: 'Users retrieved successfully',
      data: this.usersService.findAll(query),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @RolePermission('User', 'show')
  findOne(@Param('id') id: string) {
    return {
      statusCode: 200,
      message: 'User retrieved successfully',
      data: this.usersService.userDetails(id),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @RolePermission('User', 'delete')
  remove(@Param('id') id: string) {
    this.usersService.remove(id);
    return {
      statusCode: 200,
      message: 'User deleted successfully',
      data: null
    };
  }
}
