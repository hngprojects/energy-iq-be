import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConnectInverterDto,
  InverterBrand as DtoInverterBrand,
} from './dto/connect-inverter.dto';
import { VictronAdapter } from './adapters/victron.adapters';
import { Inverter } from './entities/inverters.entity';
import {
  InverterApiType,
  InverterBrand as EntityInverterBrand,
} from '../../common/enums/inverter-brand.enums';
import { SecretManager } from '../../common/utils/crypto.util';
@Injectable()
export class InvertersService {
  constructor(
    private victronAdapter: VictronAdapter,
    @InjectRepository(Inverter)
    private systemRepo: Repository<Inverter>,
  ) {}

  async connectInverter(dto: ConnectInverterDto): Promise<{ message: string }> {
    if (dto.brand === DtoInverterBrand.VICTRON) {
      const { accessToken, userId } = dto;
      // verify with VRM and get back the mapped fields
      const systemData =
        await this.victronAdapter.verifyAndGetSystem(accessToken);
      const existing = await this.systemRepo.findOne({
        where: { serialNumber: systemData.serialNumber },
      });
      if (existing) {
        throw new ConflictException(
          'This Victron installation is already connected to an account.',
        );
      }
      // encrypt the token before touching the DB
      const encryptedCredentials = SecretManager.encrypt(accessToken);

      // create record in DB and persist
      const newSystem = this.systemRepo.create({
        userId,
        model: systemData.model,
        brand: EntityInverterBrand.VICTRON,
        serialNumber: systemData.serialNumber,
        installationId: systemData.installationId,
        ratedCapacityKwh: systemData.ratedCapacityKwh,
        apiType: InverterApiType.LIVE_API,
        encryptedCredentials,
      });

      await this.systemRepo.save(newSystem);

      return { message: 'Victron inverter connected successfully' };
    }

    // unsupported brand
    throw new ConflictException(`Unsupported inverter brand: ${dto.brand}`);
  }
  findOne(id: string) {
    return { id, message: 'Inverter coming soon' };
  }

  findByUser(userId: string) {
    return { userId, message: 'User inverters coming soon' };
  }
}
