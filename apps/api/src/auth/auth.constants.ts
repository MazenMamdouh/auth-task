export const AUTH_COOKIE = 'access_token';

/** Mirrors the front-end rules: 8+ characters with a letter, a number and a special character. */
export const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 128, // an upper bound keeps hashing cost predictable
  letter: /[A-Za-z]/,
  number: /\d/,
  special: /[^A-Za-z0-9]/,
} as const;

/** Sign-in / sign-up attempts allowed per client per minute. */
export const AUTH_RATE_LIMIT = { default: { limit: 5, ttl: 60_000 } };
