import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvertersService } from './inverters.service';

@ApiTags('Inverters')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller({ path: 'inverters', version: '1' })
export class InvertersController {
  constructor(private readonly invertersService: InvertersService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a single inverter by ID' })
  findOne(@Param('id') id: string) {
    return this.invertersService.findOne(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all inverters for a user' })
  findByUser(@Param('userId') userId: string) {
    return this.invertersService.findByUser(userId);
  }
}
