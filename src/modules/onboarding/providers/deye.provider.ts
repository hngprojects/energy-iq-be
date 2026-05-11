import { Injectable, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import { env } from '../../../config/env';

const SOLARMAN_API_BASE = env.SOLARMAN_API_BASE;

export interface DeyeCredentials {
  solarmanEmail?: string;
  solarmanPassword?: string;
  loggerSerial?: string;
}

export interface DeyeConnectionResult {
  serialNumber: string;
  installationId: string;
}
interface SolarmanStation {
  deviceSn?: string;
  id?: number;
}
@Injectable()
export class DeyeProvider {
  async connect(credentials: DeyeCredentials): Promise<DeyeConnectionResult> {
    if (credentials.loggerSerial) {
      return {
        serialNumber: credentials.loggerSerial,
        installationId: credentials.loggerSerial,
      };
    }

    if (!credentials.solarmanEmail || !credentials.solarmanPassword) {
      throw new UnauthorizedException(
        'Solarman email and password are required.',
      );
    }

    try {
      const tokenRes = await axios.post(
        `${SOLARMAN_API_BASE}/account/v1.0/token?language=en`,
        {
          appId: 'monitoring',
          email: credentials.solarmanEmail,
          password: credentials.solarmanPassword,
        },
      );

      const tokenData = tokenRes.data as { access_token?: string };
      const accessToken = tokenData.access_token;

      if (!accessToken) {
        throw new UnauthorizedException(
          'Could not connect to your Deye/Sunsynk account. Please check your credentials.',
        );
      }

      const stationRes = await axios.post(
        `${SOLARMAN_API_BASE}/station/v1.0/list`,
        { page: 1, size: 1 },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      const stationData = stationRes.data as { stationList: SolarmanStation[] };
      const stations = stationData.stationList;

      if (!stations || stations.length === 0) {
        throw new UnauthorizedException(
          'No Deye/Sunsynk installation found for this account.',
        );
      }

      const station = stations[0];
      return {
        serialNumber: station.deviceSn ?? station.id?.toString() ?? 'UNKNOWN',
        installationId: station.id?.toString() ?? 'UNKNOWN',
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException(
        'Could not connect to your Deye/Sunsynk account. Please check your credentials.',
      );
    }
  }
}
