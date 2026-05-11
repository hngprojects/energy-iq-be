import { Injectable, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import { env } from '../../../config/env';

const GROWATT_API_BASE = env.GROWATT_API_BASE;

export interface GrowattCredentials {
  apiToken: string;
}

export interface GrowattConnectionResult {
  serialNumber: string;
  installationId: string;
}

interface GrowattDevice {
  deviceSn?: string;
  sn?: string;
  plantId?: number;
}

@Injectable()
export class GrowattProvider {
  async connect(
    credentials: GrowattCredentials,
  ): Promise<GrowattConnectionResult> {
    try {
      const response = await axios.get(`${GROWATT_API_BASE}/device/list`, {
        headers: {
          token: credentials.apiToken,
        },
      });

      const responseData = response.data as { data: GrowattDevice[] };
      const devices = responseData.data;

      if (!devices || devices.length === 0) {
        throw new UnauthorizedException(
          'Could not connect to your Growatt account. Please check your API token.',
        );
      }

      const device = devices[0];
      return {
        serialNumber: device.deviceSn ?? device.sn ?? 'UNKNOWN',
        installationId:
          device.plantId?.toString() ?? device.deviceSn ?? 'UNKNOWN',
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException(
        'Could not connect to your Growatt account. Please check your API token.',
      );
    }
  }
}
