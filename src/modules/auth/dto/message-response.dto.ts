import { ApiProperty } from '@nestjs/swagger';

/** Réponse générique pour un endpoint qui ne renvoie qu'une confirmation. */
export class MessageResponseDto {
  @ApiProperty()
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}
