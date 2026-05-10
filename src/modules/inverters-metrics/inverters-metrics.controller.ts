import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvertersMetricsService } from './inverters-metrics.service';
import { ParseUUIDPipe } from '@nestjs/common/pipes/parse-uuid.pipe';

@ApiTags('Inverter Metrics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller({ path: 'inverter-metrics', version: '1' })
export class InvertersMetricsController {
  constructor(private readonly metricsService: InvertersMetricsService) {}

  @Get(':inverterId/dashboard')
  @ApiOperation({ summary: 'Get dashboard metrics for an inverter' })
  getDashboardMetrics(@Param('inverterId', ParseUUIDPipe) inverterId: string) {
    return this.metricsService.getDashboardMetrics(inverterId);
  }

  @Get(':inverterId/power-consumption')
  @ApiOperation({ summary: 'Get power consumption breakdown by zone' })
  getPowerConsumption(@Param('inverterId') inverterId: string) {
    return this.metricsService.getPowerConsumption(inverterId);
  }

  @Get(':inverterId/energy-usage')
  @ApiOperation({ summary: 'Get energy usage chart data' })
  getEnergyUsage(
    @Param('inverterId') inverterId: string,
    @Query('period')
    period: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily',
  ) {
    return this.metricsService.getEnergyUsage(inverterId, period);
  }
}
