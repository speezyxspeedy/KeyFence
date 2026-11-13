/**
 * Shannon entropy calculation and heuristic token inspection.
 * Designed to avoid noisy false positives on URLs, hashes, paths, and identifiers.
 */

export interface EntropyCandidate {
  value: string;
  startIndex: number;
  endIndex: number;
  entropy: number;
  hasSecretContext: boolean;
}

const SECRET_CONTEXT_KEYWORDS =
  /\b(?:secret|token|api[_-]?key|apikey|auth|password|passwd|pwd|credential|private[_-]?key|client[_-]?secret|signing[_-]?key|encryption[_-]?key|bearer|access[_-]?key)\b/i;

const PLACEHOLDER_TOKENS =
  /^(?:your[_-]?.*|example[_-]?.*|placeholder.*|changeme.*|replace[_-]?me.*|insert[_-]?.*|dummy[_-]?.*|test[_-]?only.*|xxxx+|0000+|1111+|abcd.*)$/i;

export function calculateShannonEntropy(value: string): number {
  if (!value || value.length === 0) return 0;

  const frequencies = new Map<string, number>();
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    frequencies.set(ch, (frequencies.get(ch) ?? 0) + 1);
  }

  let entropy = 0;
  const len = value.length;
  for (const count of frequencies.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return Number(entropy.toFixed(3));
}

function isLikelyBenignToken(token: string, line: string): boolean {
  // Ignore URLs and file paths
  if (/^https?:\/\//i.test(token) || token.includes('/') && !token.includes('=')) {
    if (!/[A-Za-z0-9+/]{24,}={0,2}/.test(token)) return true;
  }

  // Ignore UUID v4 style identifiers unless explicit secret context exists
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    return true;
  }

  // Ignore pure lowercase hex strings (like git commit SHAs / sha256 digests) unless secret context keyword is on the line
  if (/^[0-9a-f]{32,128}$/i.test(token) && !SECRET_CONTEXT_KEYWORDS.test(line)) {
    return true;
  }

  // Ignore CSS class lists, import paths, data-uri image prefixes, repeated chars
  if (/^(?:data:image\/|sha256-|sha384-|sha512-|integrity)/i.test(token)) {
    return true;
  }
  if (/^(.)\1+$/.test(token)) {
    return true;
  }
  if (PLACEHOLDER_TOKENS.test(token)) {
    return true;
  }

  // Ignore camelCase or snake_case English-looking identifiers without digits/symbols
  if (/^[a-z]+(?:[A-Z][a-z]+){2,}$/.test(token) || /^[a-z]+(?:_[a-z]+){2,}$/.test(token)) {
    return true;
  }

  return false;
}

export function findHighEntropyCandidates(
  line: string,
  minLength = 20,
  threshold = 3.8
): EntropyCandidate[] {
  if (!line || line.length > 2000) {
    return [];
  }

  // Skip comment-only import/require lines or SVG path d=""
  const trimmed = line.trim();
  if (trimmed.startsWith('import ') || trimmed.includes(' d="M')) {
    return [];
  }

  const hasSecretContext = SECRET_CONTEXT_KEYWORDS.test(line);
  const candidates: EntropyCandidate[] = [];

  // Match quoted strings or high-entropy assignment values
  const tokenRegex = /(['"`])([A-Za-z0-9+/_.~!$@#%^&*=-]{16,160})\1|(?:=|:)\s*([A-Za-z0-9+/_.~!$@#%^&*=-]{20,160})(?:\s|$|;|,)/g;

  let match: RegExpExecArray | null;
  let guard = 0;

  while ((match = tokenRegex.exec(line)) !== null && guard < 20) {
    guard++;
    const value = match[2] || match[3];
    if (!value || value.length < minLength) continue;

    // Require character class diversity (at least 2 of: upper, lower, digit, symbol)
    const classes =
      (/[a-z]/.test(value) ? 1 : 0) +
      (/[A-Z]/.test(value) ? 1 : 0) +
      (/[0-9]/.test(value) ? 1 : 0) +
      (/[^A-Za-z0-9]/.test(value) ? 1 : 0);

    if (classes < 2) continue;
    if (isLikelyBenignToken(value, line)) continue;

    const entropy = calculateShannonEntropy(value);
    const effectiveThreshold = hasSecretContext ? Math.max(3.3, threshold - 0.35) : threshold;

    if (entropy >= effectiveThreshold) {
      const idx = line.indexOf(value, match.index);
      candidates.push({
        value,
        startIndex: idx,
        endIndex: idx + value.length,
        entropy,
        hasSecretContext,
      });
    }
  }

  return candidates;
}
