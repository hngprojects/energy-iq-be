import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { InverterBrand } from '../../../common/enums';

export class ConnectInverterDto {
  @ApiProperty({ enum: InverterBrand })
  @IsEnum(InverterBrand)
  brand: InverterBrand;

  // Victron fields
  @ApiPropertyOptional()
  @ValidateIf((o: ConnectInverterDto) => o.brand === InverterBrand.VICTRON)
  @IsString()
  victronEmail?: string;

  @ApiPropertyOptional()
  @ValidateIf((o: ConnectInverterDto) => o.brand === InverterBrand.VICTRON)
  @IsString()
  victronPassword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  victronAccessToken?: string;

  // Growatt fields
  @ApiPropertyOptional()
  @ValidateIf((o: ConnectInverterDto) => o.brand === InverterBrand.GROWATT)
  @IsString()
  growattApiToken?: string;

  // Deye/Sunsynk fields
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  solarmanEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  solarmanPassword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  loggerSerial?: string;
  // Manual fields
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inverterModel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  capacityKva?: number;
}
