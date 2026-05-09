import { IsInt, IsUUID } from 'class-validator';

export class ModifyChatDTO {
  @IsUUID()
  chatId: string;

  @IsInt()
  contextLength: number;

  @IsInt()
  expirationTimeoutSeconds: number;
}
