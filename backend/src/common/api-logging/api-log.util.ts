const SENSITIVE_KEYS = [
  'password',
  'confirm_password',
  'password_hash',
  'token',
  'access_token',
  'refresh_token',
  'authorization',
  'otp',
];

export function sanitizeForLog(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (depth > 5) return '[MaxDepth]';
  if (Buffer.isBuffer(value)) return `[Buffer:${value.length}]`;
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => sanitizeForLog(item, depth + 1));
  }

  return Object.entries(value as Record<string, unknown>).reduce(
    (result, [key, item]) => {
      const lowerKey = key.toLowerCase();
      result[key] = SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive))
        ? '[REDACTED]'
        : sanitizeForLog(item, depth + 1);
      return result;
    },
    {} as Record<string, unknown>,
  );
}

export function compactQueryResult(result: unknown) {
  if (Array.isArray(result)) {
    return {
      type: 'array',
      count: result.length,
      sample: sanitizeForLog(result.slice(0, 3)),
    };
  }

  if (result && typeof result === 'object') {
    const record = result as Record<string, unknown>;
    return sanitizeForLog({
      affected: record.affected,
      raw: Array.isArray(record.raw)
        ? { count: record.raw.length, sample: record.raw.slice(0, 3) }
        : record.raw,
      records: record.records,
    });
  }

  return sanitizeForLog(result);
}

export function truncateForLog<T>(value: T, maxChars = 20000): T | string {
  const json = JSON.stringify(value);
  if (!json || json.length <= maxChars) return value;
  return `${json.slice(0, maxChars)}...[TRUNCATED]`;
}
