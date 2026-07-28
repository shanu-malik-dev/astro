import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ListRoleDto } from '../dto/list-role.dto';
import { SaveRoleDto } from '../dto/save-role.dto';
import { RoleService } from '../service/role.service';

@ApiTags('roles')
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post('list')
  findAll(@Body() dto: ListRoleDto) {
    return this.roleService.findAll(dto);
  }

  @Post('save')
  save(@Body() dto: SaveRoleDto) {
    return this.roleService.save(dto);
  }
}
