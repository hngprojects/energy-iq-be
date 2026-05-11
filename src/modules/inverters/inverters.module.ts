import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvertersController } from './inverters.controller';
import { InvertersService } from './inverters.service';
import { Inverter } from './entities/inverters.entity';
import { VictronAdapter } from './adapters/victron.adapters';
import { InverterModelAction } from './action/inverters.action';

@Module({
  imports: [TypeOrmModule.forFeature([Inverter])],
  controllers: [InvertersController],
  providers: [InvertersService, InverterModelAction, VictronAdapter],
  exports: [InvertersService, InverterModelAction, VictronAdapter],
})
export class InvertersModule {}
