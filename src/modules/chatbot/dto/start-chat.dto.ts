import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class StartChatDto {
  @IsUUID()
  @ApiProperty({ example: 'user@example.com' })
  initiatorId: string;

  @IsOptional()
  @IsString()
  startingMessage?: string;

  @IsUUID()
  @ApiProperty()
  userId: string;
}
