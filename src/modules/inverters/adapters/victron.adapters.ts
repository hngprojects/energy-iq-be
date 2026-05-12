import { Injectable, BadRequestException } from '@nestjs/common';
import {
  MeResponse,
  NormalisedMetric,
  VerifiedSystem,
  VictronDiagnosticsResponse,
  VictronInstallationsResponse,
} from '../types';
import { VrmApiException } from '../../metrics-stream/types/vrm-api-exception';

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

  // Called on every poll cycle to fetch live metrics for a registered inverter
  async fetchMetrics(
    accessToken: string,
    installationId: string,
    inverterId: string,
  ): Promise<NormalisedMetric> {
    const res = await fetch(
      `${this.BASE}/installations/${installationId}/diagnostics`,
      {
        headers: { 'X-Authorization': `Token ${accessToken}` },
      },
    );

    if (!res.ok) {
      throw new VrmApiException(
        res.status,
        `Victron VRM diagnostics request failed for installation ${installationId}`,
      );
    }

    const data = (await res.json()) as VictronDiagnosticsResponse;

    // The diagnostics response is a flat array of attribute objects.
    // Each attribute has a short `code` and a `formattedValue` string (e.g. "82%", "1.2kW").
    const records = data.records ?? [];

    // Helper: find attribute by code and parse its formattedValue as a float.
    // formattedValue includes units (e.g. "82%", "1.2kW", "231V") — strip non-numeric chars.
    // Returns null if the attribute is absent or the value is not a valid number.
    const getFloat = (code: string): number | null => {
      const attr = records.find((a) => a.code === code);
      if (!attr?.formattedValue) return null;
      const val = parseFloat(attr.formattedValue.replace(/[^0-9.-]/g, ''));
      return isNaN(val) ? null : val;
    };

    // Helper: find attribute by code and return its formattedValue as a string.
    const getString = (code: string): string | null => {
      const attr = records.find((a) => a.code === code);
      return attr?.formattedValue ?? null;
    };

    // Solar power: Pdc = solar input power (kW in formattedValue, e.g. "1.4kW")
    const solarPowerKw = getFloat('Pdc') ?? 0;

    // AC output power: Pac = AC output power (kW in formattedValue, e.g. "1.2kW")
    const acOutputPowerKw = getFloat('Pac') ?? 0;

    // Battery SOC: bs = "82%" → strip % → 82
    const batterySoc = getFloat('bs') ?? 0;

    return {
      inverterId,
      recordedAt: new Date().toISOString(),

      // Required fields — codes confirmed from TRD section 3.1 and Victron community
      batterySoc,
      solarPowerKw,
      acOutputPowerKw,
      gridVoltageV: getFloat('Gv') ?? 0, // TODO: verify exact code from live diagnostics
      gridFrequencyHz: getFloat('Gf') ?? 0, // TODO: verify exact code from live diagnostics
      inverterStatus: getString('S') ?? 'unknown', // TODO: verify exact code from live diagnostics

      // Optional fields — bv and Bc confirmed; others need verification from live diagnostics
      batteryVoltageV: getFloat('bv'), // confirmed from community
      batteryCurrentA: getFloat('Bc'), // confirmed from TRD ("Battery charge current")
      batteryTemperatureC: getFloat('Tb'), // confirmed from TRD ("Battery temperature")
      batteryTimeToGoMin: getFloat('Ttg'), // TODO: verify exact code from live diagnostics
      inverterTemperatureC: getFloat('Ti'), // TODO: verify exact code from live diagnostics
    };
  }
}
