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

@Controller({ version: '1', path: 'users' })
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  @RolePermission('User', 'create')
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }), // 2 MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }), // only jpg/png
        ],
        fileIsRequired: false, // optional file
      }),
    )
    file: Express.Multer.File
  ) {
    return {
      statusCode: 201,
      message: 'User created successfully',
      data: this.usersService.create(createUserDto, file),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @RolePermission('User', 'update')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }), // 2 MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }), // only jpg/png
        ],
        fileIsRequired: false, // optional file
      }),
    )
    file: Express.Multer.File
  ) {
    return {
      statusCode: 200,
      message: 'User updated successfully',
      data: this.usersService.update(id, updateUserDto, file),
    };
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
