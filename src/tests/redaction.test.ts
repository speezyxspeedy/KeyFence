import { describe, expect, it } from 'vitest';
import {
  createMaskedPreview,
  maskLineWithSpan,
  maskSecretValue,
  sanitizeLineSecrets,
} from '../services/redactionService.ts';

describe('Secret Redaction & Masking', () => {
  it('masks prefix-based tokens without exposing middle characters', () => {
    const raw = 'sk-test-DEMO9876543210PLACEHOLDER0011';
    const masked = maskSecretValue(raw);
    expect(masked).toBe('sk-test-****...****11');
    expect(masked).not.toContain('9876543210');
    expect(masked).not.toContain('PLACEHOLDER');
  });

  it('masks database URI passwords while preserving host structure', () => {
    const raw = 'postgresql://demo_user:SuperSecretPw99@db.example.invalid:5432/app';
    const masked = maskSecretValue(raw);
    expect(masked).toContain('postgresql://demo_user:');
    expect(masked).not.toContain('SuperSecretPw99');
  });

  it('masks line previews and sanitizes neighboring lines', () => {
    const raw = 'AKIA1234567890ABCDEF';
    const line = `export const KEY = "${raw}";`;
    const start = line.indexOf(raw);
    const preview = createMaskedPreview(line, start, start + raw.length, raw);
    expect(preview).not.toContain(raw);
    expect(preview).toContain('AKIA****...****EF');

    const neighborLine = 'const backupSecret = "AnotherLongSecretValue_99887766";';
    const sanitized = sanitizeLineSecrets(neighborLine);
    expect(sanitized).not.toContain('AnotherLongSecretValue_99887766');

    const spanMasked = maskLineWithSpan(line, start, start + raw.length, raw);
    expect(spanMasked).not.toContain(raw);
  });
});
