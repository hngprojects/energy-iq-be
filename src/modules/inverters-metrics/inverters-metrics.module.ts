import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvertersMetricsController } from './inverters-metrics.controller';
import { InvertersMetricsService } from './inverters-metrics.service';
import { InvertersMetrics } from './entities/inverters-metrics.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InvertersMetrics])],
  controllers: [InvertersMetricsController],
  providers: [InvertersMetricsService],
  exports: [TypeOrmModule],
})
export class InvertersMetricsModule {}
