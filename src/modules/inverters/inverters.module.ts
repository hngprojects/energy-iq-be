import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvertersController } from './inverters.controller';
import { InvertersService } from './inverters.service';
import { Inverter } from './entities/inverters.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Inverter])],
  controllers: [InvertersController],
  providers: [InvertersService],
  exports: [InvertersService],
})
export class InvertersModule {}
