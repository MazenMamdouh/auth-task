import { signInSchema, signUpSchema } from './validation';

const valid = { email: 'jane@example.com', name: 'Jane', password: 'Str0ng!pass' };
const messages = (r: { success: boolean; error?: { issues: { message: string }[] } }) => r.error?.issues.map((i) => i.message) ?? [];

describe('signUpSchema', () => {
  it('accepts a valid sign-up', () => expect(signUpSchema.safeParse(valid).success).toBe(true));

  it('rejects an invalid email', () => {
    expect(messages(signUpSchema.safeParse({ ...valid, email: 'jane@' }))).toContain('Enter a valid email address');
  });

  it('requires a name of at least 3 characters, ignoring surrounding spaces', () => {
    expect(messages(signUpSchema.safeParse({ ...valid, name: '  Jo ' }))).toContain('Name must be at least 3 characters');
  });

  it.each([
    ['Ab1!', 'Password needs: at least 8 characters'],
    ['12345678!', 'Password needs: at least one letter'],
    ['Password!', 'Password needs: at least one number'],
    ['Password1', 'Password needs: at least one special character'],
  ])('rejects %s', (password, message) => {
    expect(messages(signUpSchema.safeParse({ ...valid, password }))).toContain(message);
  });
});

describe('signInSchema', () => {
  it('only requires a password to be present', () => {
    expect(signInSchema.safeParse({ email: 'jane@example.com', password: 'x' }).success).toBe(true);
    expect(messages(signInSchema.safeParse({ email: 'jane@example.com', password: '' }))).toContain('Password is required');
  });
});
