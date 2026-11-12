const UNITS: Record<string, number> = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };

/** "15m" / "1h" / "7d" / "3600" (seconds) -> milliseconds, so the cookie expires with the token. */
export function parseDurationMs(value: string): number {
  const match = /^(\d+)\s*([smhd]?)$/.exec(value.trim());
  if (!match) throw new Error(`Unsupported duration: ${value}`);
  return Number(match[1]) * UNITS[match[2] || 's'];
}
