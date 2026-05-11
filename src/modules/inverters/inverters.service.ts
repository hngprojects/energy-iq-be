import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InverterConnectorDto } from './dto/inverter-connector.dto';
import { VictronAdapter } from './adapters/victron.adapters';
import { Inverter } from './entities/inverters.entity';
import { InverterModelAction } from './action/inverters.action';
import {
  InverterApiType,
  InverterBrand as EntityInverterBrand,
  InverterBrand,
} from '../../common/enums/inverter-brand.enums';
import { SecretManager } from '../../common/utils/crypto.util';
import { noTransaction } from '../../common/constants/transaction-options';
import { SYS_MSG } from '../../common/constants/sys-msg';

@Injectable()
export class InvertersService {
  constructor(
    private victronAdapter: VictronAdapter,
    private readonly inverterModelAction: InverterModelAction,
  ) {}

  async connectInverter(dto: InverterConnectorDto): Promise<Inverter> {
    if (dto.brand === InverterBrand.VICTRON)
      await this.connectVictronInverter(dto);

    throw new ConflictException(`Unsupported inverter brand: ${dto.brand}`);
  }

  async connectVictronInverter(dto: InverterConnectorDto): Promise<Inverter> {
    const { accessToken, userId } = dto;
    // verify with VRM and get back the mapped fields
    const systemData =
      await this.victronAdapter.verifyAndGetSystem(accessToken);
    const existing = await this.inverterModelAction.findBySerialNumber(
      systemData.serialNumber,
    );
    if (existing)
      throw new ConflictException(
        'This Victron installation is already connected to an account.',
      );
    // encrypt the token before touching the DB
    const encryptedCredentials = SecretManager.encrypt(accessToken);

    // create record in DB and persist
    return this.inverterModelAction.create({
      ...noTransaction(),
      createPayload: {
        userId,
        model: systemData.model,
        brand: EntityInverterBrand.VICTRON,
        serialNumber: systemData.serialNumber,
        installationId: systemData.installationId,
        ratedCapacityKwh: systemData.ratedCapacityKwh,
        apiType: InverterApiType.LIVE_API,
        encryptedCredentials,
      },
    });
  }

  async findByUserId(userId: string): Promise<Inverter[]> {
    const inverters = await this.inverterModelAction.findByUserId(userId);
    if (!inverters?.length) throw new NotFoundException(SYS_MSG.NOT_FOUND);
    return inverters;
  }

  async findOne(id: string): Promise<Inverter> {
    const inverter = await this.inverterModelAction.get({
      identifierOptions: { id },
    });
    if (!inverter) throw new NotFoundException(SYS_MSG.NOT_FOUND);
    return inverter;
  }

  getSupportedInverterBrands(): InverterBrand[] {
    return Object.values(InverterBrand);
  }
}
