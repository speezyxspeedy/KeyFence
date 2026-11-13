/**
 * Redaction and masking service.
 * Ensures sensitive credential material is masked before UI presentation, storage, or export.
 */

const SECONDARY_SECRET_PATTERNS: RegExp[] = [
  // Key/value assignments with quoted high-risk tokens (supports camelCase like backupSecret)
  /[A-Za-z0-9_]*(?:api[_-]?key|secret|access[_-]?token|auth[_-]?token|client[_-]?secret|private[_-]?key|password|passwd|pwd|db[_-]?pass|webhook[_-]?secret)\b\s*[:=]\s*(['"`])([^'"`\r\n]{6,})\1/gi,
  // Known token prefixes
  /\b(?:AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{16,}|github_pat_[A-Za-z0-9_]{20,}|glpat-[A-Za-z0-9\-_]{16,}|xox[baprs]-[A-Za-z0-9-]{10,}|sk-(?:live|test|proj)?-?[A-Za-z0-9_\-]{12,}|pk_(?:live|test)_[A-Za-z0-9]{12,}|SG\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}|AIza[0-9A-Za-z\-_]{25,})\b/g,
  // URI embedded passwords: scheme://user:password@host
  /([a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^:\s/@]+:)([^@\s/]{4,})(@)/g,
  // Bearer tokens
  /(\bBearer\s+)([A-Za-z0-9\-._~+/]{12,}=*)/gi,
];

export function maskSecretValue(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '****';

  // Preserve structural prefix if recognizable (e.g. sk-, AKIA, ghp_, xoxb-)
  const prefixMatch = trimmed.match(/^(sk-(?:live|test|proj)?-?|pk_(?:live|test)_|gh[pousr]_|github_pat_|glpat-|xox[baprs]-|AKIA|ASIA|AIza|SG\.|kf_demo_)/);
  if (prefixMatch && trimmed.length >= 12) {
    const prefix = prefixMatch[1];
    const suffix = trimmed.slice(-2);
    return `${prefix}****...****${suffix}`;
  }

  // Handle PEM private key headers safely without leaking body
  if (trimmed.includes('-----BEGIN') && trimmed.includes('PRIVATE KEY-----')) {
    const headerEnd = trimmed.indexOf('-----', 10);
    const header = headerEnd > 0 ? trimmed.slice(0, headerEnd + 5) : '-----BEGIN PRIVATE KEY-----';
    return `${header} [REDACTED KEY MATERIAL]`;
  }

  // Handle connection strings (mask password segment only)
  const uriMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^:\s/@]+:)([^@\s]+)(@.+)$/);
  if (uriMatch) {
    const pw = uriMatch[2];
    const maskedPw = pw.length > 4 ? `${pw[0]}****${pw.slice(-1)}` : '****';
    return `${uriMatch[1]}${maskedPw}${uriMatch[3]}`;
  }

  if (trimmed.length <= 6) {
    return '****';
  }
  if (trimmed.length <= 12) {
    return `${trimmed.slice(0, 2)}****${trimmed.slice(-2)}`;
  }

  const head = trimmed.slice(0, 3);
  const tail = trimmed.slice(-2);
  return `${head}****...****${tail}`;
}

/**
 * Masks a specific span inside a line and also sanitizes any other obvious
 * credential-like patterns on the same line or neighboring context lines.
 */
export function maskLineWithSpan(
  line: string,
  matchStart?: number,
  matchEnd?: number,
  rawSecret?: string
): string {
  let result = line;

  if (
    typeof matchStart === 'number' &&
    typeof matchEnd === 'number' &&
    matchStart >= 0 &&
    matchEnd > matchStart &&
    matchEnd <= line.length
  ) {
    const target = rawSecret ?? line.slice(matchStart, matchEnd);
    const masked = maskSecretValue(target);
    result = line.slice(0, matchStart) + masked + line.slice(matchEnd);
  }

  return sanitizeLineSecrets(result);
}

/**
 * Defensive pass to redact sensitive patterns on surrounding context lines
 * so neighboring lines never expose credentials either.
 */
export function sanitizeLineSecrets(line: string): string {
  let sanitized = line;

  // Mask PEM base64-like body lines if accidentally captured
  if (/^[A-Za-z0-9+/=]{48,}$/.test(sanitized.trim())) {
    return '[REDACTED BASE64 BLOCK]';
  }

  // Mask assignments
  sanitized = sanitized.replace(
    SECONDARY_SECRET_PATTERNS[0],
    (full, quote: string, val: string) => {
      if (val.includes('****')) return full;
      const idx = full.lastIndexOf(val);
      if (idx === -1) return full;
      return full.slice(0, idx) + maskSecretValue(val) + quote;
    }
  );

  // Mask known token prefixes
  sanitized = sanitized.replace(SECONDARY_SECRET_PATTERNS[1], (token: string) => {
    if (token.includes('****')) return token;
    return maskSecretValue(token);
  });

  // Mask URI credentials
  sanitized = sanitized.replace(
    SECONDARY_SECRET_PATTERNS[2],
    (_full, prefix: string, pw: string, at: string) => {
      if (pw.includes('****')) return `${prefix}${pw}${at}`;
      const maskedPw = pw.length > 4 ? `${pw[0]}****${pw.slice(-1)}` : '****';
      return `${prefix}${maskedPw}${at}`;
    }
  );

  // Mask Bearer tokens
  sanitized = sanitized.replace(
    SECONDARY_SECRET_PATTERNS[3],
    (_full, bearer: string, token: string) => {
      if (token.includes('****')) return `${bearer}${token}`;
      return `${bearer}${maskSecretValue(token)}`;
    }
  );

  return sanitized;
}

export function createMaskedPreview(
  line: string,
  matchStart: number,
  matchEnd: number,
  rawSecret: string
): string {
  const maskedLine = maskLineWithSpan(line, matchStart, matchEnd, rawSecret).trim();
  if (maskedLine.length <= 160) {
    return maskedLine;
  }
  const safeStart = Math.max(0, matchStart - 40);
  const slice = maskedLine.slice(safeStart, safeStart + 140);
  return `${safeStart > 0 ? '...' : ''}${slice}...`;
}
