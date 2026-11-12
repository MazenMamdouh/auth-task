import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './auth.types';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';

export interface AuthResult {
  user: UserResponseDto;
  accessToken: string;
}

const INVALID_CREDENTIALS = 'Invalid email or password';

@Injectable()
export class AuthService {
  /** Verified against when the email is unknown, so both failure paths take the same time. */
  private dummyHash?: Promise<string>;

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async signUp(dto: SignUpDto): Promise<AuthResult> {
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    const user = await this.users.create({ email: dto.email, name: dto.name, passwordHash });
    return this.issue(UserResponseDto.from(user));
  }

  async signIn(dto: SignInDto): Promise<AuthResult> {
    const user = await this.users.findByEmailWithPassword(dto.email);
    if (!user) {
      await argon2.verify(await this.getDummyHash(), dto.password).catch(() => false);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) throw new UnauthorizedException(INVALID_CREDENTIALS);
    return this.issue(UserResponseDto.from(user));
  }

  private async issue(user: UserResponseDto): Promise<AuthResult> {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return { user, accessToken: await this.jwt.signAsync(payload) };
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= argon2.hash('timing-equaliser-not-a-real-password', { type: argon2.argon2id });
    return this.dummyHash;
  }
}
