// src/inverters/adapters/victron.adapter.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import {
  MeResponse,
  //   NormalizedMetric,
  VerifiedSystem,
  VictronInstallationsResponse,
  //   VictronInstallation,
} from '../types';

@Injectable()
export class VictronAdapter {
  private readonly BASE = 'https://vrmapi.victronenergy.com/v2';

  // Called once during onboarding verifies token and gets idSite
  async verifyAndGetSystem(accessToken: string): Promise<VerifiedSystem> {
    // get the user's VRM userId
    const meRes = await fetch(`${this.BASE}/users/me`, {
      headers: { 'X-Authorization': `Token ${accessToken}` },
    });

    if (!meRes.ok) {
      // Token is wrong tell the user clearly
      throw new BadRequestException(
        'Could not connect to your Victron VRM account. Check your access token.',
      );
    }

    const me = (await meRes.json()) as MeResponse;
    const idUser = me?.record?.idUser;

    // get their installations list
    const instRes = await fetch(`${this.BASE}/users/${idUser}/installations`, {
      headers: { 'X-Authorization': `Token ${accessToken}` },
    });

    const data = (await instRes.json()) as VictronInstallationsResponse;

    if (!data.success || !data.records?.length) {
      throw new BadRequestException(
        'No installations found on your Victron VRM account.',
      );
    }

    // We take the first installation (most users have one)
    const site = data.records[0];

    return {
      model: site.name, //  inverter.model
      serialNumber: site.identifier, //  inverter.serialNumber
      installationId: String(site.idSite), //  inverter.installationId
      ratedCapacityKwh: site.pvMax //  pvMax is watts  convert
        ? parseFloat((site.pvMax / 1000).toFixed(2))
        : 0,
      timezone: site.timezone,
      isOnGrid: site.is_on_grid,
      hasGenerator: Boolean(site.hasGenerator),
      mqttHost: site.mqtt_host,
    };
  }
}
