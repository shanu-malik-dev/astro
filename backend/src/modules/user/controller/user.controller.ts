import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DeleteUserDto } from '../dto/delete-user.dto';
import { ListUserDto } from '../dto/list-user.dto';
import { SaveUserDto } from '../dto/save-user.dto';
import { UpdateUserCallStatusDto } from '../dto/update-user-call-status.dto';
import { UserService } from '../service/user.service';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('list')
  findAll(@Body() dto: ListUserDto) {
    return this.userService.findAll(dto);
  }

  @Post('save')
  save(@Body() dto: SaveUserDto) {
    return this.userService.save(dto);
  }

  @Post('delete')
  delete(@Body() dto: DeleteUserDto) {
    return this.userService.delete(dto);
  }

  @Post('call-status')
  updateCallStatus(@Body() dto: UpdateUserCallStatusDto) {
    return this.userService.updateCallStatus(dto);
  }
}
