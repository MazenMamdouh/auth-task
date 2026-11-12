import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength, ValidateBy } from 'class-validator';
import { PASSWORD_RULES } from '../auth.constants';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/**
 * One named constraint per password rule. Several @Matches on one property share the constraint
 * key "matches", so only one of their messages survives - a password missing both a letter and a
 * special character would only be told about one of them.
 */
const PasswordRule = (name: string, pattern: RegExp, message: string) =>
  ValidateBy({ name, validator: { validate: (v: unknown) => typeof v === 'string' && pattern.test(v), defaultMessage: () => message } });

export class SignUpDto {
  @ApiProperty({ example: 'jane@example.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @MaxLength(254)
  email: string;

  @ApiProperty({ example: 'Jane Doe', minLength: 3 })
  @Transform(trim)
  @IsString()
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @MaxLength(50, { message: 'Name must be at most 50 characters long' })
  name: string;

  @ApiProperty({ example: 'Str0ng!pass', minLength: PASSWORD_RULES.minLength })
  @IsString()
  @MinLength(PASSWORD_RULES.minLength, { message: `Password must be at least ${PASSWORD_RULES.minLength} characters long` })
  @MaxLength(PASSWORD_RULES.maxLength, { message: `Password must be at most ${PASSWORD_RULES.maxLength} characters long` })
  @PasswordRule('passwordLetter', PASSWORD_RULES.letter, 'Password must contain at least one letter')
  @PasswordRule('passwordNumber', PASSWORD_RULES.number, 'Password must contain at least one number')
  @PasswordRule('passwordSpecial', PASSWORD_RULES.special, 'Password must contain at least one special character')
  password: string;
}
