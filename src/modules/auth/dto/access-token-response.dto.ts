import { ApiProperty } from '@nestjs/swagger';

/** Réponse de `POST /auth/refresh` — pas de `user`, le frontend le possède déjà. */
export class AccessTokenResponseDto {
  @ApiProperty()
  accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }
}
