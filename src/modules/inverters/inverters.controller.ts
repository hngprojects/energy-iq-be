import { Controller, Get, Param, UseGuards, Post, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvertersService } from './inverters.service';
import { ParseUUIDPipe } from '@nestjs/common/pipes/parse-uuid.pipe';
import { ConnectInverterDto } from './dto/connect-inverter.dto';

@ApiTags('Inverters')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller({ path: 'inverters', version: '1' })
export class InvertersController {
  constructor(private readonly invertersService: InvertersService) {}

  @Post('connect')
  @ApiOperation({ summary: 'Connect a new inverter' })
  connectInverter(@Body() dto: ConnectInverterDto) {
    return this.invertersService.connectInverter(dto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all inverters for a user' })
  findByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.invertersService.findByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single inverter by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.invertersService.findOne(id);
  }
}
