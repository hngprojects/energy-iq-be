import { Injectable } from '@nestjs/common';

export interface ManualCredentials {
  inverterModel?: string;
  capacityKva?: number;
}

export interface ManualConnectionResult {
  serialNumber: string;
  installationId: string;
  model: string;
  capacityKva: number;
}

@Injectable()
export class ManualProvider {
  connect(credentials: ManualCredentials): ManualConnectionResult {
    return {
      serialNumber: `MANUAL-${Date.now()}`,
      installationId: `MANUAL-${Date.now()}`,
      model: credentials.inverterModel ?? 'Unknown',
      capacityKva: credentials.capacityKva ?? 0,
    };
  }
}
