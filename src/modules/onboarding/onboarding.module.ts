import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inverter } from '../inverters/entities/inverters.entity';
import { User } from '../users/entities/user.entity';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { VictronProvider } from './providers/victron.provider';
import { GrowattProvider } from './providers/growatt.provider';
import { DeyeProvider } from './providers/deye.provider';
import { ManualProvider } from './providers/manual.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Inverter, User])],
  controllers: [OnboardingController],
  providers: [
    OnboardingService,
    VictronProvider,
    GrowattProvider,
    DeyeProvider,
    ManualProvider,
  ],
})
export class OnboardingModule {}
