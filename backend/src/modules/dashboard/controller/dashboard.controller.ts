import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { DashboardSummaryDto } from '../dto/dashboard-summary.dto';
import { DashboardService } from '../service/dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Post('summary')
  summary(@Body() dto: DashboardSummaryDto, @Req() req: Request & { user?: any }) {
    return this.dashboardService.summary(dto, req.user);
  }
}
