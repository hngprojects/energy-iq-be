import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inverter } from '../inverters/entities/inverters.entity';
import { User } from '../users/entities/user.entity';
import { InverterBrand, InverterApiType } from '../../common/enums';
import { ConnectInverterDto } from './dto/connect-inverter.dto';
import { VictronProvider } from './providers/victron.provider';
import { GrowattProvider } from './providers/growatt.provider';
import { DeyeProvider } from './providers/deye.provider';
import { ManualProvider } from './providers/manual.provider';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(Inverter)
    private readonly inverterRepository: Repository<Inverter>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly victronProvider: VictronProvider,
    private readonly growattProvider: GrowattProvider,
    private readonly deyeProvider: DeyeProvider,
    private readonly manualProvider: ManualProvider,
  ) {}

  async connectInverter(userId: string, dto: ConnectInverterDto) {
    let serialNumber: string;
    let installationId: string;
    let encryptedCredentials: string | undefined;
    let model = 'Unknown';
    let capacityKva = 0;
    let apiType = InverterApiType.LIVE_API;

    switch (dto.brand) {
      case InverterBrand.VICTRON: {
        const result = await this.victronProvider.connect({
          email: dto.victronEmail,
          password: dto.victronPassword,
          accessToken: dto.victronAccessToken,
        });
        serialNumber = result.serialNumber;
        installationId = result.installationId;
        encryptedCredentials = result.token;
        break;
      }

      case InverterBrand.GROWATT: {
        if (!dto.growattApiToken) {
          throw new BadRequestException('Growatt API token is required.');
        }
        const result = await this.growattProvider.connect({
          apiToken: dto.growattApiToken,
        });
        serialNumber = result.serialNumber;
        installationId = result.installationId;
        encryptedCredentials = dto.growattApiToken;
        break;
      }

      case InverterBrand.DEYE:
      case InverterBrand.SUNSYNK: {
        const result = await this.deyeProvider.connect({
          solarmanEmail: dto.solarmanEmail,
          solarmanPassword: dto.solarmanPassword,
          loggerSerial: dto.loggerSerial,
        });
        serialNumber = result.serialNumber;
        installationId = result.installationId;
        encryptedCredentials = dto.solarmanPassword;
        break;
      }

      default: {
        const result = this.manualProvider.connect({
          inverterModel: dto.inverterModel,
          capacityKva: dto.capacityKva,
        });
        serialNumber = result.serialNumber;
        installationId = result.installationId;
        model = result.model;
        capacityKva = result.capacityKva;
        apiType = InverterApiType.LIVE_API;
        break;
      }
    }

    // save inverter to database
    const inverter = this.inverterRepository.create({
      userId,
      brand: dto.brand,
      model,
      serialNumber,
      installationId,
      apiType,
      encryptedCredentials,
      ratedCapacityKwh: capacityKva,
      isActive: true,
    });

    await this.inverterRepository.save(inverter);

    // mark onboarding complete
    await this.userRepository.update(userId, {
      onboardingComplete: true,
      onboardingStep: 4,
      inverterBrand: dto.brand,
    });

    return {
      message: 'Inverter connected successfully',
      inverterId: inverter.id,
      brand: dto.brand,
      serialNumber,
    };
  }
}
