import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SaveAstrologerStatusDto } from '../dto/save-astrologer-status.dto';
import { AstrologerStatusService } from '../service/astrologer-status.service';

@ApiTags('astrologer-status')
@Controller('astrologer-status')
export class AstrologerStatusController {
  constructor(private readonly statusService: AstrologerStatusService) {}

  @Post('save')
  save(@Body() dto: SaveAstrologerStatusDto) {
    return this.statusService.save(dto);
  }

  @Post('details')
  details() {
    return this.statusService.details();
  }
}
