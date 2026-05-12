import { IsInt, IsUUID } from 'class-validator';

export class ModifyChatSettingsDTO {
  @IsUUID()
  chatId: string;

  @IsInt()
  contextLength: number;

  @IsInt()
  expirationTimeoutSeconds: number;
}
