// src/inverters/dto/connect-inverter.dto.ts

import { IsEnum, IsString, MinLength } from 'class-validator';

export enum InverterBrand {
  VICTRON = 'victron',
  GROWATT = 'growatt',
  DEYE = 'deye',
  LUMINOUS = 'luminous',
  FELICITY = 'felicity',
}

export class ConnectInverterDto {
  @IsEnum(InverterBrand)
  brand: InverterBrand; // user's selection from the choose brand screen

  @IsString()
  userId: string; // the ID of the user connecting the inverter
  @IsString()
  @MinLength(10)
  accessToken: string; // the PAT supplied by the client from their VRM portal
}
