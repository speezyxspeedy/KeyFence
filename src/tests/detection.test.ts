import { describe, expect, it } from 'vitest';
import {
  BUILTIN_DETECTION_RULES,
  validateCustomRegex,
} from '../services/detectionRules.ts';
import { evaluateConfidence } from '../services/confidenceEngine.ts';
import { findHighEntropyCandidates } from '../services/entropyAnalyzer.ts';
import { scanSingleTextContent } from '../services/scannerEngine.ts';

const DEFAULT_SCAN_SETTINGS = {
  enableEntropyHeuristic: true,
  entropyMinLength: 20,
  entropyThreshold: 3.8,
  contextLinesRadius: 2,
};

describe('Secret Detection Engine & Confidence Scoring', () => {
  it('detects fictional API keys, database URIs, config secrets, passwords, and private-key markers with accurate line numbers', () => {
    const sampleCode = [
      '// Line 1: benign comment',
      'export const PUBLIC_ENV = "staging";',
      'const apiKey = "sk-test-DEMO9876543210PLACEHOLDER0011";',
      'const dbUri = "postgresql://demo_user:DemoPass99@db.example.invalid:5432/dev";',
      'const admin_password = "DemoPasswordOnly2026!";',
      'JWT_SECRET=demo_jwt_signing_placeholder_99887766',
      '-----BEGIN RSA PRIVATE KEY-----',
    ].join('\n');

    const { findings } = scanSingleTextContent({
      scanId: 'SCAN-TEST1',
      filePath: 'src/config.ts',
      content: sampleCode,
      rules: BUILTIN_DETECTION_RULES,
      settings: DEFAULT_SCAN_SETTINGS,
      isDemo: true,
      detectedAt: '2026-11-13T00:00:00.000Z',
    });

    expect(findings.find((f) => f.lineNumber === 3 && f.category === 'API Authentication')).toBeTruthy();
    expect(findings.find((f) => f.lineNumber === 4 && f.category === 'Database Credentials')).toBeTruthy();
    expect(findings.find((f) => f.lineNumber === 5 && f.category === 'Generic Password Assignment')).toBeTruthy();
    expect(findings.find((f) => f.lineNumber === 6 && f.category === 'Configuration Secrets')).toBeTruthy();
    expect(findings.find((f) => f.lineNumber === 7 && f.category === 'Private Key Exposure')).toBeTruthy();
    // Line 2 is completely benign and should have zero findings
    expect(findings.find((f) => f.lineNumber === 2)).toBeUndefined();
  });

  it('avoids false positives on obvious non-secret code', () => {
    const cleanCode = [
      'export function addNumbers(a: number, b: number): number {',
      '  return a + b;',
      '}',
      'export const endpoint = "https://api.example.invalid/v1/health";',
      'export const requestId = "550e8400-e29b-41d4-a716-446655440000";',
    ].join('\n');

    const { findings } = scanSingleTextContent({
      scanId: 'SCAN-CLEAN',
      filePath: 'src/utils/math.ts',
      content: cleanCode,
      rules: BUILTIN_DETECTION_RULES,
      settings: DEFAULT_SCAN_SETTINGS,
      isDemo: false,
      detectedAt: '2026-11-13T00:00:00.000Z',
    });

    expect(findings).toHaveLength(0);
  });

  it('assigns High, Medium, and Low confidence levels appropriately', () => {
    const awsRule = BUILTIN_DETECTION_RULES.find((r) => r.id === 'KF-CLOUD-001')!;
    const bearerRule = BUILTIN_DETECTION_RULES.find((r) => r.id === 'KF-API-008')!;
    const pwdRule = BUILTIN_DETECTION_RULES.find((r) => r.id === 'KF-PWD-001')!;

    const highEval = evaluateConfidence({
      rule: awsRule,
      matchedValue: 'AKIAIOSFODNN7EXAMPLE99',
      line: 'AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE99"',
      filePath: '.env.production',
    });
    expect(highEval.confidence).toBe('High');

    const medEval = evaluateConfidence({
      rule: bearerRule,
      matchedValue: 'AbCdEf1234567890GhIjKlMnOpQr',
      line: 'Authorization: Bearer AbCdEf1234567890GhIjKlMnOpQr',
      filePath: 'src/client.ts',
    });
    expect(medEval.confidence).toBe('Medium');

    // Weak keyword-only match in a test file must never get High confidence
    const lowEval = evaluateConfidence({
      rule: pwdRule,
      matchedValue: 'changeme_placeholder',
      line: 'const password = "changeme_placeholder";',
      filePath: 'tests/auth.test.ts',
    });
    expect(lowEval.confidence).toBe('Low');
  });

  it('detects high-entropy heuristic strings while ignoring short/benign strings', () => {
    const candidates = findHighEntropyCandidates(
      'const unknownToken = "q9Z#mK8vP2xL7wR4nB6tY1cF5hJ3dG0s"; const shortStr = "abc123";',
      20,
      3.8
    );
    expect(candidates.length).toBe(1);
    expect(candidates[0].entropy).toBeGreaterThanOrEqual(3.8);
  });

  it('validates custom regex rules and blocks catastrophic backtracking patterns', () => {
    expect(validateCustomRegex('\\b(corp_tok_[A-Za-z0-9]{16,32})\\b').valid).toBe(true);
    expect(validateCustomRegex('(a+)+').valid).toBe(false);
    expect(validateCustomRegex('.*').valid).toBe(false);
    expect(validateCustomRegex('[unclosed').valid).toBe(false);
  });
});
