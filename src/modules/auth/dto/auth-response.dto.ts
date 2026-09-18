import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

/**
 * Le refresh token ne figure jamais dans ce corps de réponse — il est posé
 * directement en cookie `httpOnly` par le backend (ADR-0004 :
 * "pourquoi le backend pose le cookie du refresh token lui-même").
 */
export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  constructor(accessToken: string, user: UserResponseDto) {
    this.accessToken = accessToken;
    this.user = user;
  }
}
