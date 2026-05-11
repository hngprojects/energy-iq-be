import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MinLength } from 'class-validator';
import { InverterBrand } from '../../../common/enums';

export class InverterConnectorDto {
  @ApiProperty({
    enum: InverterBrand,
    description: 'The brand of the inverter',
  })
  @IsEnum(InverterBrand)
  brand: InverterBrand;

  @ApiProperty({ description: 'The ID of the user connecting the inverter' })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'The access token for the inverter (e.g. Victron VRM PAT)',
  })
  @IsString()
  @MinLength(10)
  accessToken: string;
}
