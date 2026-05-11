import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InvertersService } from './inverters.service';
import { ParseUUIDPipe } from '@nestjs/common/pipes/parse-uuid.pipe';
import { InverterConnectorDto } from './dto/inverter-connector.dto';

@ApiTags('Inverters')
@ApiBearerAuth()
@Controller({ path: 'inverters', version: '1' })
export class InvertersController {
  constructor(private readonly invertersService: InvertersService) {}

  @Post('connect')
  @ApiOperation({ summary: 'Connect a new inverter' })
  connectInverter(@Body() dto: InverterConnectorDto) {
    return this.invertersService.connectInverter(dto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all inverters for a user' })
  findByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.invertersService.findByUserId(userId);
  }

  @Get('supported-brands')
  @ApiOperation({ summary: 'Get supported inverter brands' })
  getSupportedBrands() {
    return this.invertersService.getSupportedInverterBrands();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single inverter by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.invertersService.findOne(id);
  }
}
