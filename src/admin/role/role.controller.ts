
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Query,
  UseGuards,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async create(@Body() createRoleDto: CreateRoleDto) {
    try {
      return {
        statusCode: 201,
        message: 'Role created successfully',
        data: await this.roleService.create(createRoleDto),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  async findAll(@Query() query: any) {
    try {
      return {
        statusCode: 200,
        message: 'Roles retrieved successfully',
        data: await this.roleService.findAll(query),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return {
        statusCode: 200,
        message: 'Role retrieved successfully',
        data: await this.roleService.findOne(id),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    try {
      return {
        statusCode: 200,
        message: 'Role updated successfully',
        data: await this.roleService.update(id, updateRoleDto),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return {
        statusCode: 200,
        message: 'Role removed successfully',
        data: await this.roleService.remove(id),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
