import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

const userDoc = (over: Partial<Record<string, unknown>> = {}) => ({
  id: '6734f1c2a9e4b2d1c0f1e2a3',
  email: 'jane@example.com',
  name: 'Jane Doe',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  ...over,
});

describe('AuthService', () => {
  let service: AuthService;
  const users = { create: jest.fn(), findByEmailWithPassword: jest.fn() };
  const jwt = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [AuthService, { provide: UsersService, useValue: users }, { provide: JwtService, useValue: jwt }],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  describe('signUp', () => {
    it('stores an argon2id hash, never the password, and returns a token', async () => {
      users.create.mockImplementation(async (data: { passwordHash: string }) => userDoc({ passwordHash: data.passwordHash }));

      const result = await service.signUp({ email: 'jane@example.com', name: 'Jane Doe', password: 'Str0ng!pass' });

      const stored = users.create.mock.calls[0][0] as { passwordHash: string };
      expect(stored.passwordHash).not.toContain('Str0ng!pass');
      expect(stored.passwordHash.startsWith('$argon2id$')).toBe(true);
      expect(await argon2.verify(stored.passwordHash, 'Str0ng!pass')).toBe(true);
      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.user).toEqual({ id: userDoc().id, email: 'jane@example.com', name: 'Jane Doe', createdAt: userDoc().createdAt });
      expect(jwt.signAsync).toHaveBeenCalledWith({ sub: userDoc().id, email: 'jane@example.com' });
    });

    it('passes a duplicate-email conflict through', async () => {
      users.create.mockRejectedValue(new ConflictException('An account with this email already exists'));
      await expect(service.signUp({ email: 'jane@example.com', name: 'Jane', password: 'Str0ng!pass' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('signIn', () => {
    it('returns a token for the right password', async () => {
      users.findByEmailWithPassword.mockResolvedValue(userDoc({ passwordHash: await argon2.hash('Str0ng!pass') }));
      const result = await service.signIn({ email: 'jane@example.com', password: 'Str0ng!pass' });
      expect(result.accessToken).toBe('signed.jwt.token');
    });

    it('rejects a wrong password with the generic message', async () => {
      users.findByEmailWithPassword.mockResolvedValue(userDoc({ passwordHash: await argon2.hash('Str0ng!pass') }));
      await expect(service.signIn({ email: 'jane@example.com', password: 'wrong' })).rejects.toThrow(
        new UnauthorizedException('Invalid email or password'),
      );
    });

    it('rejects an unknown email with the same message (no account enumeration)', async () => {
      users.findByEmailWithPassword.mockResolvedValue(null);
      await expect(service.signIn({ email: 'nobody@example.com', password: 'Str0ng!pass' })).rejects.toThrow(
        new UnauthorizedException('Invalid email or password'),
      );
    });
  });
});
