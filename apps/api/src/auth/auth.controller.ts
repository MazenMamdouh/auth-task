import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CookieOptions, Response } from 'express';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { AUTH_COOKIE, AUTH_RATE_LIMIT } from './auth.constants';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { parseDurationMs } from './duration';

@ApiTags('auth')
@ApiTooManyRequestsResponse({ description: 'Too many attempts - try again in a minute' })
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('signup')
  @Throttle(AUTH_RATE_LIMIT)
  @ApiCreatedResponse({ type: UserResponseDto, description: 'Account created; the session cookie is set' })
  @ApiBadRequestResponse({ description: 'A field fails validation' })
  @ApiConflictResponse({ description: 'The email is already registered' })
  async signUp(@Body() dto: SignUpDto, @Res({ passthrough: true }) res: Response): Promise<UserResponseDto> {
    const { user, accessToken } = await this.auth.signUp(dto);
    res.cookie(AUTH_COOKIE, accessToken, this.cookieOptions());
    return user;
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_RATE_LIMIT)
  @ApiOkResponse({ type: UserResponseDto, description: 'Signed in; the session cookie is set' })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  async signIn(@Body() dto: SignInDto, @Res({ passthrough: true }) res: Response): Promise<UserResponseDto> {
    const { user, accessToken } = await this.auth.signIn(dto);
    res.cookie(AUTH_COOKIE, accessToken, this.cookieOptions());
    return user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'The session cookie is cleared' })
  logout(@Res({ passthrough: true }) res: Response): void {
    const { maxAge: _maxAge, ...opts } = this.cookieOptions();
    res.clearCookie(AUTH_COOKIE, opts);
  }

  /**
   * The JWT travels in an httpOnly cookie: JavaScript on the page can never read it (XSS cannot
   * steal the session), and SameSite=strict keeps other sites from sending it (CSRF).
   */
  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.get<boolean>('COOKIE_SECURE', true),
      sameSite: 'strict',
      path: '/',
      maxAge: parseDurationMs(this.config.get<string>('JWT_EXPIRES_IN', '1h')),
    };
  }
}
