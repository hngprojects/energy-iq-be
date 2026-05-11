import { Injectable, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import { env } from '../../../config/env';

const VICTRON_VRM_BASE = env.VICTRON_API_BASE;
export interface VictronCredentials {
  email?: string;
  password?: string;
  accessToken?: string;
}

export interface VictronConnectionResult {
  installationId: string;
  serialNumber: string;
  token: string;
}

interface VictronInstallation {
  idSite: number;
  identifier?: string;
}

@Injectable()
export class VictronProvider {
  async connect(
    credentials: VictronCredentials,
  ): Promise<VictronConnectionResult> {
    let token: string;

    if (credentials.accessToken) {
      token = credentials.accessToken;
    } else if (credentials.email && credentials.password) {
      token = await this.loginWithPassword(
        credentials.email,
        credentials.password,
      );
    } else {
      throw new UnauthorizedException('Victron credentials are required');
    }

    const installation = await this.getInstallation(token);

    return {
      installationId: installation.idSite.toString(),
      serialNumber: installation.identifier ?? installation.idSite.toString(),
      token,
    };
  }

  private async loginWithPassword(
    email: string,
    password: string,
  ): Promise<string> {
    try {
      const response = await axios.post(`${VICTRON_VRM_BASE}/auth/login`, {
        username: email,
        password,
      });
      const responseData = response.data as { token: string };
      return responseData.token;
    } catch {
      throw new UnauthorizedException(
        'Could not connect to your Victron account. Please check your credentials.',
      );
    }
  }

  private async getInstallation(token: string): Promise<VictronInstallation> {
    try {
      const response = await axios.get(
        `${VICTRON_VRM_BASE}/users/me/installations`,
        {
          headers: { 'X-Authorization': `Token ${token}` },
        },
      );
      const responseData = response.data as { records: VictronInstallation[] };
      const installations = responseData.records;
      if (!installations || installations.length === 0) {
        throw new UnauthorizedException(
          'No Victron installation found for this account.',
        );
      }
      return installations[0];
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException(
        'Could not connect to your Victron account. Please check your credentials.',
      );
    }
  }
}
