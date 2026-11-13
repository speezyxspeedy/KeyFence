import { GitignoreAnalysisResult, SensitiveFileCheck } from '../types/index.ts';
import { normalizePath } from './fileService.ts';

interface SensitiveCandidateRule {
  test: (filePath: string, fileName: string) => boolean;
  reason: string;
  suggestedRule: string;
}

const SENSITIVE_FILE_CANDIDATES: SensitiveCandidateRule[] = [
  {
    test: (_p, name) => name === '.env',
    reason: 'Primary environment variable file',
    suggestedRule: '.env',
  },
  {
    test: (_p, name) => /^\.env\.(?!example$|sample$|template$).+/i.test(name),
    reason: 'Environment-specific secret configuration (.env.*)',
    suggestedRule: '.env.*',
  },
  {
    test: (_p, name) => /^credentials\.json$/i.test(name),
    reason: 'Credentials JSON file',
    suggestedRule: 'credentials.json',
  },
  {
    test: (_p, name) => /service[-_]?account.*\.json$/i.test(name),
    reason: 'Cloud service account key file',
    suggestedRule: '*service-account*.json',
  },
  {
    test: (_p, name) => /\.(?:pem|key|p12|pfx|jks)$/i.test(name),
    reason: 'Private key or certificate bundle',
    suggestedRule: '*.pem\n*.key',
  },
  {
    test: (_p, name) => /^(?:id_rsa|id_ed25519|id_ecdsa|id_dsa)$/i.test(name),
    reason: 'SSH private key file',
    suggestedRule: 'id_rsa\nid_ed25519',
  },
  {
    test: (_p, name) => /^(?:secrets?|tokens?)\.(?:ya?ml|json|toml|ini)$/i.test(name),
    reason: 'Local secret configuration file',
    suggestedRule: 'secrets.*',
  },
  {
    test: (_p, name) => /^\.(?:npmrc|pypirc|netrc)$/i.test(name),
    reason: 'Package registry / authentication configuration',
    suggestedRule: '.npmrc\n.pypirc',
  },
  {
    test: (_p, name) => /\.tfvars$/i.test(name),
    reason: 'Terraform variables file (often holds credentials)',
    suggestedRule: '*.tfvars',
  },
];

interface ParsedGitignoreRule {
  raw: string;
  negated: boolean;
  regex: RegExp;
}

function compileGitignorePattern(rawPattern: string): RegExp | null {
  let pattern = rawPattern.trim();
  if (!pattern || pattern.startsWith('#')) return null;

  const anchored = pattern.startsWith('/');
  if (anchored) pattern = pattern.slice(1);

  const dirOnly = pattern.endsWith('/');
  if (dirOnly) pattern = pattern.slice(0, -1);

  // Escape regex metacharacters except glob tokens
  let regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '___DOUBLE_STAR___')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]')
    .replace(/___DOUBLE_STAR___/g, '.*');

  const prefix = anchored ? '^' : '(?:^|/)';
  const suffix = dirOnly ? '(?:/|$)' : '(?:$|/)';

  try {
    return new RegExp(`${prefix}${regexStr}${suffix}`, 'i');
  } catch {
    return null;
  }
}

export function parseGitignoreRules(content: string): ParsedGitignoreRule[] {
  const rules: ParsedGitignoreRule[] = [];
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const negated = trimmed.startsWith('!');
    const patternBody = negated ? trimmed.slice(1).trim() : trimmed;
    const regex = compileGitignorePattern(patternBody);
    if (regex) {
      rules.push({ raw: trimmed, negated, regex });
    }
  }
  return rules;
}

export function analyzeGitignoreCoverage(
  allFilePaths: string[],
  gitignoreFiles: Array<{ path: string; content: string }>
): GitignoreAnalysisResult {
  const parsedRules: Array<{ source: string; rule: ParsedGitignoreRule }> = [];

  for (const gi of gitignoreFiles) {
    const rules = parseGitignoreRules(gi.content);
    for (const rule of rules) {
      parsedRules.push({ source: gi.path, rule });
    }
  }

  const sensitiveFilesFound: SensitiveFileCheck[] = [];
  const suggestedSet = new Set<string>();

  for (const rawPath of allFilePaths) {
    const normalized = normalizePath(rawPath);
    const fileName = normalized.split('/').pop() ?? '';

    const matchedCandidate = SENSITIVE_FILE_CANDIDATES.find((c) =>
      c.test(normalized, fileName)
    );
    if (!matchedCandidate) continue;

    // Evaluate parsed .gitignore rules sequentially (last matching rule wins)
    let isIgnored = false;
    let matchedRuleText: string | undefined;

    for (const { rule } of parsedRules) {
      if (rule.regex.test(normalized) || rule.regex.test(fileName)) {
        if (rule.negated) {
          isIgnored = false;
          matchedRuleText = undefined;
        } else {
          isIgnored = true;
          matchedRuleText = rule.raw;
        }
      }
    }

    if (!isIgnored) {
      for (const line of matchedCandidate.suggestedRule.split('\n')) {
        if (line.trim()) suggestedSet.add(line.trim());
      }
    }

    sensitiveFilesFound.push({
      filePath: normalized,
      reason: matchedCandidate.reason,
      covered: isIgnored,
      matchedRule: matchedRuleText,
      suggestedRule: matchedCandidate.suggestedRule,
    });
  }

  return {
    hasGitignore: gitignoreFiles.length > 0,
    gitignoreFiles: gitignoreFiles.map((g) => g.path),
    parsedPatternsCount: parsedRules.length,
    sensitiveFilesFound,
    uncoveredCount: sensitiveFilesFound.filter((f) => !f.covered).length,
    suggestedRules: Array.from(suggestedSet),
  };
}
