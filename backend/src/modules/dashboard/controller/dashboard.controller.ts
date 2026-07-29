import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DashboardSummaryDto } from '../dto/dashboard-summary.dto';
import { DashboardService } from '../service/dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Post('summary')
  summary(@Body() dto: DashboardSummaryDto) {
    return this.dashboardService.summary(dto);
  }
}
