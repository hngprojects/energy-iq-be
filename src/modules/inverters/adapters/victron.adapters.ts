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
      brandSystemId: String(site.idSite),
      brandDeviceId: '255', // default instance
      inverterModel: site.name ?? 'Victron System',
    };
  }

  // Called every 60 seconds by the polling job
  //   async fetchLiveMetrics(
  //     idSite: string,
  //     accessToken: string,
  //   ): Promise<NormalizedMetric> {
  //     const res = await fetch(
  //       `${this.BASE}/installations/${idSite}/stats?type=live_feed`,
  //       { headers: { 'X-Authorization': `Token ${accessToken}` } },
  //     );

  //     if (!res.ok) throw new Error(`Victron live_feed failed: ${res.status}`);

  //     const data = await res.json();

  //     // Normalize: map Victron field names → your standard schema columns
  //     // Field names come from the VRM API response structure
  //     return {
  //       solarInputKw: data.Solar?.Power ?? null,
  //       batteryLevel: data.Battery?.StateOfCharge ?? null,
  //       realTimePowerOutputKw: data.Ac?.ConsumptionOnInput?.Power ?? null,
  //       loadRatingKw: data.Ac?.ConsumptionOnOutput?.Power ?? null,
  //       dcVoltage: data.Battery?.Voltage ?? null,
  //       acVoltage: data.Ac?.Grid?.L1?.Voltage ?? null,
  //       mpptEfficiency: data.Solar?.ChargerEfficiency ?? null,
  //     };
  //   }
}
