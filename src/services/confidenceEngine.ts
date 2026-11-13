import { Confidence, DetectionRule } from '../types/index.ts';
import { calculateShannonEntropy } from './entropyAnalyzer.ts';

export interface ConfidenceEvaluation {
  confidence: Confidence;
  score: number;
  notes: string[];
}

const PLACEHOLDER_REGEX =
  /\b(?:placeholder|example|sample|dummy|fake|changeme|your[_-]?(?:api|secret|key|token|password)|replace[_-]?me|insert[_-]?here|todo|fixme|redacted)\b/i;

const TEST_OR_DOC_PATH_REGEX =
  /(?:^|\/)(?:tests?|__tests__|specs?|fixtures?|mocks?|docs?|examples?|samples?)(?:\/|$)|\.(?:test|spec|stories|md|txt)$/i;

const HIGH_RISK_CONFIG_PATH_REGEX =
  /(?:^|\/)\.env(?:\.[^/]*)?$|\.(?:pem|key|p12|pfx|tfstate|tfvars|npmrc|pypirc)$|credentials\.json$|secrets?\.(?:json|ya?ml)$/i;

export function evaluateConfidence(params: {
  rule: DetectionRule;
  matchedValue: string;
  line: string;
  filePath: string;
}): ConfidenceEvaluation {
  const { rule, matchedValue, line, filePath } = params;
  const notes: string[] = [];

  // Base score mapped from rule's base confidence
  let score =
    rule.baseConfidence === 'High' ? 85 : rule.baseConfidence === 'Medium' ? 60 : 35;

  const entropy = calculateShannonEntropy(matchedValue);

  if (rule.isHeuristic) {
    // Heuristic-only findings start capped unless contextual evidence is strong
    score = Math.min(score, 58);
    if (entropy >= 4.2) {
      score += 10;
      notes.push(`High character randomness (Shannon entropy ${entropy.toFixed(2)})`);
    }
  } else {
    if (entropy >= 3.8 && matchedValue.length >= 16) {
      score += 8;
      notes.push(`High entropy value (${entropy.toFixed(2)})`);
    } else if (entropy < 2.3 && matchedValue.length < 16 && !rule.id.includes('PRIVATE_KEY')) {
      score -= 12;
      notes.push('Low character entropy suggests simple string');
    }
  }

  // Check for placeholder / dummy indicators
  if (PLACEHOLDER_REGEX.test(matchedValue) || PLACEHOLDER_REGEX.test(line)) {
    score -= 22;
    notes.push('Contains placeholder or example terminology');
  }

  // Check file context
  if (HIGH_RISK_CONFIG_PATH_REGEX.test(filePath)) {
    score += 10;
    notes.push('Located in sensitive configuration file');
  } else if (TEST_OR_DOC_PATH_REGEX.test(filePath)) {
    score -= 15;
    notes.push('Located in test, fixture, or documentation path');
  }

  // Never allow weak keyword-only or heuristic-only rules to become High confidence
  if (rule.baseConfidence === 'Low' || rule.isHeuristic) {
    score = Math.min(score, 69);
  }

  // Clamp score
  score = Math.max(10, Math.min(99, Math.round(score)));

  let confidence: Confidence;
  if (score >= 75) {
    confidence = 'High';
  } else if (score >= 48) {
    confidence = 'Medium';
  } else {
    confidence = 'Low';
  }

  return { confidence, score, notes };
}
