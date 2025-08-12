
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
import { AssignRoleDto } from './dto/assign-role.dto';
import { RolePermission } from '../../utilis/decorators/role-permission.decorator';

@Controller({ version: '1' ,path: 'role'})
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @RolePermission('Role','create')
  async create(@Body() createRoleDto: CreateRoleDto) {
    try {
      const createdRole = await this.roleService.create(createRoleDto);
      return {
        statusCode: 201,
        message: 'Role created successfully',
        data: createdRole,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @RolePermission('Role','list')
  async findAll(@Query() query: any) {
    try {
      const roles = await this.roleService.findAll(query);
      return {
        statusCode: 200,
        message: 'Roles retrieved successfully',
        data: roles,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('dropdown')
  async dropdown(@Query() query: any) {
    try {
      const roles = await this.roleService.dropdown(query);
      return {
        statusCode: 200,
        message: 'Roles retrieved successfully',
        data: roles,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @RolePermission('Role','show')
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
  @RolePermission('Role','update')
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
  @RolePermission('Role','delete')
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

  @UseGuards(JwtAuthGuard)
  @Post('assign')
  @RolePermission('Role','assign')
  async assignRole(@Body() assignRoleDto: AssignRoleDto) {
    try {
      const assignedRole = await this.roleService.assignRole(assignRoleDto);
      return {
        statusCode: 201,
        message: 'Role assigned successfully',
        data: assignedRole,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('assign/list')
  @RolePermission('Role','assign-list')
  async getAssignedRoles(@Query() query: any) {
    try {
      const assignedRoles = await this.roleService.assignRoleList(query);
      return {
        statusCode: 200,
        message: 'Assigned roles retrieved successfully',
        data: assignedRoles,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
