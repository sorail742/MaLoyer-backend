import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type { AuthenticatedUser } from '../../common/authenticated-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AppConfig } from '../../config/configuration';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { AuthService } from './auth.service';
import type { AuthResult } from './auth.service';
import { parseDurationMs } from './auth.util';
import { AccessTokenResponseDto } from './dto/access-token-response.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { OtpRequestDto } from './dto/otp-request.dto';
import { OtpVerifyDto } from './dto/otp-verify.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  @Public()
  @Post('register')
  async register(
    @Res({ passthrough: true }) res: Response,
    @Headers('user-agent') userAgent: string | undefined,
    @Body() body: RegisterDto,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.register(body, userAgent ?? null);
    return this.respondWithSession(res, result);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Res({ passthrough: true }) res: Response,
    @Headers('user-agent') userAgent: string | undefined,
    @Body() body: LoginDto,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(body, userAgent ?? null);
    return this.respondWithSession(res, result);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('otp/request')
  async requestOtp(@Body() body: OtpRequestDto): Promise<MessageResponseDto> {
    await this.authService.requestOtp(body.phone);
    return new MessageResponseDto(
      'Si ce numéro est enregistré, un code a été envoyé par SMS.',
    );
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('otp/verify')
  async verifyOtp(
    @Res({ passthrough: true }) res: Response,
    @Headers('user-agent') userAgent: string | undefined,
    @Body() body: OtpVerifyDto,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.verifyOtp(body, userAgent ?? null);
    return this.respondWithSession(res, result);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AccessTokenResponseDto> {
    const cookieName = this.configService.get('refreshTokenCookieName', {
      infer: true,
    });
    const cookies = req.cookies as Record<string, string | undefined>;
    const refreshTokenValue = cookies[cookieName];
    if (!refreshTokenValue) {
      this.clearRefreshCookie(res);
      throw new UnauthorizedException('Refresh token manquant');
    }
    const tokens = await this.authService.refresh(refreshTokenValue);
    this.setRefreshCookie(res, tokens.refreshToken);
    return new AccessTokenResponseDto(tokens.accessToken);
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MessageResponseDto> {
    await this.authService.logout(user.sessionId);
    this.clearRefreshCookie(res);
    return new MessageResponseDto('Déconnecté');
  }

  private respondWithSession(
    res: Response,
    result: AuthResult,
  ): AuthResponseDto {
    this.setRefreshCookie(res, result.tokens.refreshToken);
    return new AuthResponseDto(
      result.tokens.accessToken,
      UserResponseDto.fromEntity(result.user),
    );
  }

  private setRefreshCookie(res: Response, value: string): void {
    const jwtConfig = this.configService.get('jwt', { infer: true });
    const cookieName = this.configService.get('refreshTokenCookieName', {
      infer: true,
    });
    const apiPrefix = this.configService.get('apiPrefix', { infer: true });
    res.cookie(cookieName, value, {
      httpOnly: true,
      secure:
        this.configService.get('nodeEnv', { infer: true }) === 'production',
      sameSite: 'lax',
      path: `/${apiPrefix}/auth`,
      maxAge: parseDurationMs(jwtConfig.refreshExpiresIn),
    });
  }

  private clearRefreshCookie(res: Response): void {
    const cookieName = this.configService.get('refreshTokenCookieName', {
      infer: true,
    });
    const apiPrefix = this.configService.get('apiPrefix', { infer: true });
    res.clearCookie(cookieName, { path: `/${apiPrefix}/auth` });
  }
}
