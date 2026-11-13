import { CustomRuleInput, DetectionRule } from '../types/index.ts';

export const BUILTIN_DETECTION_RULES: DetectionRule[] = [
  // 1. Cloud Credentials
  {
    id: 'KF-CLOUD-001',
    name: 'AWS Access Key ID',
    category: 'Cloud Credentials',
    description: 'Detects AWS IAM access key identifiers beginning with AKIA or ASIA.',
    severity: 'CRITICAL',
    pattern: '\\b((?:AKIA|ASIA)[0-9A-Z]{16})\\b',
    flags: 'g',
    baseConfidence: 'High',
    captureGroup: 1,
    remediation: [
      'Remove the AWS Access Key ID and associated secret key from source files.',
      'Deactivate and rotate the key immediately in AWS IAM Console.',
      'Use IAM roles, AWS SSO, or environment variables instead of static keys.',
    ],
    enabled: true,
  },
  {
    id: 'KF-CLOUD-002',
    name: 'AWS Secret Access Key Assignment',
    category: 'Cloud Credentials',
    description: 'Detects explicit assignments to AWS secret access key variables.',
    severity: 'CRITICAL',
    pattern:
      '\\baws_secret_access_key\\b\\s*[:=]\\s*[\'"]?([A-Za-z0-9/+=]{32,48})[\'"]?',
    flags: 'gi',
    baseConfidence: 'High',
    captureGroup: 1,
    remediation: [
      'Remove the secret access key from configuration or source code.',
      'Rotate the IAM credential in AWS IAM immediately.',
      'Load AWS credentials via standard AWS SDK credential chains or IAM roles.',
    ],
    enabled: true,
  },
  {
    id: 'KF-CLOUD-003',
    name: 'GCP Service Account Key Indicator',
    category: 'Cloud Credentials',
    description: 'Detects Google Cloud service account JSON credential structures.',
    severity: 'CRITICAL',
    pattern: '"private_key_id"\\s*:\\s*"([a-f0-9]{20,64})"',
    flags: 'gi',
    baseConfidence: 'High',
    captureGroup: 1,
    remediation: [
      'Remove service account JSON files from the project directory.',
      'Revoke the compromised key in Google Cloud IAM & Admin.',
      'Use Workload Identity Federation or GOOGLE_APPLICATION_CREDENTIALS outside the repo.',
    ],
    enabled: true,
  },
  {
    id: 'KF-CLOUD-004',
    name: 'Azure Storage Account Key',
    category: 'Cloud Credentials',
    description: 'Detects Azure Storage connection strings containing AccountKey values.',
    severity: 'CRITICAL',
    pattern: 'AccountKey=([A-Za-z0-9+/=]{32,96})',
    flags: 'g',
    baseConfidence: 'High',
    captureGroup: 1,
    remediation: [
      'Remove Azure connection strings from tracked source files.',
      'Regenerate the storage account access key in Azure Portal.',
      'Prefer Microsoft Entra ID managed identities or Azure Key Vault.',
    ],
    enabled: true,
  },

  // 2. API Authentication
  {
    id: 'KF-API-001',
    name: 'GitHub Personal Access Token',
    category: 'API Authentication',
    description: 'Detects GitHub classic or fine-grained personal access token prefixes.',
    severity: 'CRITICAL',
    pattern: '\\b((?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,60}|github_pat_[A-Za-z0-9_]{22,90})\\b',
    flags: 'g',
    baseConfidence: 'High',
    captureGroup: 1,
    remediation: [
      'Remove the GitHub token from source files immediately.',
      'Revoke the token under GitHub Developer Settings -> Personal Access Tokens.',
      'Use GitHub Actions secrets or local environment variables.',
    ],
    enabled: true,
  },
  {
    id: 'KF-API-002',
    name: 'GitLab Personal Access Token',
    category: 'API Authentication',
    description: 'Detects GitLab personal, project, or group access tokens.',
    severity: 'CRITICAL',
    pattern: '\\b(glpat-[A-Za-z0-9\\-_]{18,48})\\b',
    flags: 'g',
    baseConfidence: 'High',
    captureGroup: 1,
    remediation: [
      'Delete the hardcoded GitLab token.',
      'Revoke and regenerate it in GitLab User Settings -> Access Tokens.',
      'Inject tokens at runtime via CI/CD variables.',
    ],
    enabled: true,
  },
  {
    id: 'KF-API-003',
    name: 'Stripe Secret API Key',
    category: 'API Authentication',
    description: 'Detects Stripe live or restricted secret key formats.',
    severity: 'CRITICAL',
    pattern: '\\b((?:sk|rk)_(?:live|test)_[0-9A-Za-z]{16,64})\\b',
    flags: 'g',
    baseConfidence: 'High',
    captureGroup: 1,
    remediation: [
      'Remove Stripe secret keys from client and server source files.',
      'Roll the exposed API key in the Stripe Dashboard.',
      'Store Stripe secret keys strictly in server-side environment variables.',
    ],
    enabled: true,
  },
  {
    id: 'KF-API-004',
    name: 'Provider Secret API Key Prefix',
    category: 'API Authentication',
    description: 'Detects common sk-prefixed secret API tokens (e.g. sk-proj-, sk-ant-, sk-...).',
    severity: 'HIGH',
    pattern: '\\b(sk-(?:proj-|ant-|live-|test-)?[A-Za-z0-9_\\-]{20,80})\\b',
    flags: 'g',
    baseConfidence: 'High',
    captureGroup: 1,
    remediation: [
      'Remove the API key from application source files.',
      'Revoke and reissue the key in the corresponding provider console.',
      'Use server-side environment configuration and secret managers.',
    ],
    enabled: true,
  },
  {
    id: 'KF-API-005',
    name: 'Slack Bot or User Token',
    category: 'API Authentication',
    description: 'Detects Slack workspace tokens beginning with xoxb-, xoxp-, xoxa-, or xoxr-.',
    severity: 'HIGH',
    pattern: '\\b(xox[baprs]-[0-9A-Za-z-]{16,80})\\b',
    flags: 'g',
    baseConfidence: 'High',
    captureGroup: 1,
    remediation: [
      'Remove the Slack token from code or configuration files.',
      'Regenerate the app token in the Slack API App Management portal.',
      'Provide the token via secure runtime environment variables.',
    ],
    enabled: true,
  },
  {
    id: 'KF-API-006',
    name: 'Google Cloud / Maps API Key',
    category: 'API Authentication',
    description: 'Detects Google API keys starting with AIza.',
    severity: 'HIGH',
    pattern: '\\b(AIza[0-9A-Za-z\\-_]{35})\\b',
    flags: 'g',
    baseConfidence: 'High',
    captureGroup: 1,
    remediation: [
      'Remove unrestricted Google API keys from tracked files.',
      'Rotate the key in Google Cloud Credentials and enforce HTTP referrer or API restrictions.',
      'Use backend proxies for sensitive APIs.',
    ],
    enabled: true,
  },
  {
    id: 'KF-API-007',
    name: 'SendGrid API Key',
    category: 'API Authentication',
    description: 'Detects SendGrid API keys beginning with SG.',
    severity: 'HIGH',
    pattern: '\\b(SG\\.[A-Za-z0-9_-]{16,32}\\.[A-Za-z0-9_-]{20,64})\\b',
    flags: 'g',
    baseConfidence: 'High',
    captureGroup: 1,
    remediation: [
      'Delete the SendGrid key from your codebase.',
      'Revoke the key in SendGrid Settings -> API Keys.',
      'Load mail credentials from environment configuration.',
    ],
    enabled: true,
  },
  {
    id: 'KF-API-008',
    name: 'Hardcoded Bearer Token',
    category: 'API Authentication',
    description: 'Detects hardcoded Authorization Bearer token strings in source or headers.',
    severity: 'HIGH',
    pattern: '\\bBearer\\s+([A-Za-z0-9\\-._~+/]{20,128}=*)',
    flags: 'gi',
    baseConfidence: 'Medium',
    captureGroup: 1,
    remediation: [
      'Replace hardcoded Bearer tokens with dynamic authentication flows.',
      'Invalidate the exposed token or session if still active.',
      'Never commit authorization headers into tests or scripts.',
    ],
    enabled: true,
  },
  {
    id: 'KF-API-009',
    name: 'Hardcoded JSON Web Token (JWT)',
    category: 'API Authentication',
    description: 'Detects hardcoded three-segment JWT strings (eyJ...).',
    severity: 'MEDIUM',
    pattern: '\\b(eyJ[A-Za-z0-9_-]{8,120}\\.eyJ[A-Za-z0-9_-]{8,240}\\.[A-Za-z0-9_-]{16,120})\\b',
    flags: 'g',
    baseConfidence: 'Medium',
    captureGroup: 1,
    remediation: [
      'Remove hardcoded JWTs from fixtures, headers, or configuration files.',
      'If the token grants access to an environment, invalidate its signing key or session.',
      'Generate ephemeral test tokens dynamically during test execution.',
    ],
    enabled: true,
  },
  {
    id: 'KF-API-010',
    name: 'Generic API Key or Token Assignment',
    category: 'API Authentication',
    description: 'Detects assignments to variables named api_key, auth_token, or access_token.',
    severity: 'MEDIUM',
    pattern:
      '\\b(?:api[_-]?key|apikey|access[_-]?token|auth[_-]?token|service[_-]?token|bearer[_-]?token)\\b\\s*[:=]\\s*[\'"`]([A-Za-z0-9_\\-+/=.]{10,120})[\'"`]',
    flags: 'gi',
    baseConfidence: 'Medium',
    captureGroup: 1,
    remediation: [
      'Remove hardcoded API keys and tokens from source files.',
      'Rotate any exposed credential with the issuing service provider.',
      'Reference environment variables (e.g. process.env.API_KEY) instead.',
    ],
    enabled: true,
  },

  // 3. Database Credentials
  {
    id: 'KF-DB-001',
    name: 'Database Connection URI with Credentials',
    category: 'Database Credentials',
    description: 'Detects PostgreSQL, MySQL, MongoDB, Redis, or AMQP URIs containing an embedded password.',
    severity: 'CRITICAL',
    pattern:
      '((?:postgres(?:ql)?|mysql|mariadb|mongodb(?:\\+srv)?|redis|rediss|amqp|amqps|mssql):\\/\\/[^:\\s/@"\']+?:[^@\\s"\']{4,64}@[^\\s"\'<>]+)',
    flags: 'gi',
    baseConfidence: 'High',
    captureGroup: 1,
    remediation: [
      'Remove database URIs with embedded passwords from source and config files.',
      'Rotate the database user password immediately.',
      'Inject DATABASE_URL via a secrets manager or protected .env file excluded by .gitignore.',
    ],
    enabled: true,
  },
  {
    id: 'KF-DB-002',
    name: 'Database Password Assignment',
    category: 'Database Credentials',
    description: 'Detects explicit database password fields such as db_password or DB_PASS.',
    severity: 'HIGH',
    pattern:
      '\\b(?:db[_-]?pass(?:word)?|database[_-]?password|postgres[_-]?password|mysql[_-]?password|mongo[_-]?password|redis[_-]?password)\\b\\s*[:=]\\s*[\'"`]?([^\\s\'"`,;}{]{6,64})[\'"`]?',
    flags: 'gi',
    baseConfidence: 'Medium',
    captureGroup: 1,
    remediation: [
      'Remove hardcoded database passwords from code and deployment templates.',
      'Rotate database credentials and enforce least-privilege accounts.',
      'Use managed database IAM authentication or injected secrets.',
    ],
    enabled: true,
  },

  // 4. Private Key Exposure
  {
    id: 'KF-KEY-001',
    name: 'PEM Private Key Header',
    category: 'Private Key Exposure',
    description: 'Detects RSA, EC, DSA, OpenSSH, or generic PEM private key blocks.',
    severity: 'CRITICAL',
    pattern: '(-----BEGIN\\s+(?:RSA|EC|DSA|OPENSSH|ENCRYPTED|PGP)?\\s*PRIVATE KEY-----)',
    flags: 'g',
    baseConfidence: 'High',
    captureGroup: 1,
    remediation: [
      'Remove private key material from tracked project directories immediately.',
      'Revoke and reissue the compromised certificate or SSH/signing keypair.',
      'Check whether the file was previously committed and rotate affected trusts.',
    ],
    enabled: true,
  },
  {
    id: 'KF-KEY-002',
    name: 'Private Key Inline Assignment',
    category: 'Private Key Exposure',
    description: 'Detects private_key or signing_key variable assignments containing key material.',
    severity: 'HIGH',
    pattern:
      '\\b(?:private[_-]?key|signing[_-]?key|ssh[_-]?key)\\b\\s*[:=]\\s*[\'"`]([^\'"`]{16,200})[\'"`]',
    flags: 'gi',
    baseConfidence: 'Medium',
    captureGroup: 1,
    remediation: [
      'Remove inline private keys from source code and configuration.',
      'Rotate the exposed keypair.',
      'Mount private keys securely at runtime or load from a KMS/vault.',
    ],
    enabled: true,
  },

  // 5. Generic Password Assignment
  {
    id: 'KF-PWD-001',
    name: 'Generic Password Assignment',
    category: 'Generic Password Assignment',
    description: 'Detects hardcoded literal assignments to password, passwd, or admin_password.',
    severity: 'MEDIUM',
    pattern:
      '\\b(?:password|passwd|pwd|admin[_-]?password|root[_-]?password|user[_-]?password)\\b\\s*[:=]\\s*[\'"`]([^\'"`\\r\\n]{6,64})[\'"`]',
    flags: 'gi',
    baseConfidence: 'Low',
    captureGroup: 1,
    remediation: [
      'Avoid storing literal passwords in source files or test configurations.',
      'Rotate the password if it corresponds to a real environment or service.',
      'Read passwords from environment variables or a secret store.',
    ],
    enabled: true,
  },

  // 6. Webhook Credentials
  {
    id: 'KF-HOOK-001',
    name: 'Slack Incoming Webhook URL',
    category: 'Webhook Credentials',
    description: 'Detects Slack webhook URLs containing embedded secret paths.',
    severity: 'HIGH',
    pattern: '(https:\\/\\/hooks\\.slack\\.com\\/services\\/T[A-Z0-9]{6,14}\\/B[A-Z0-9]{6,14}\\/[A-Za-z0-9]{16,36})',
    flags: 'g',
    baseConfidence: 'High',
    captureGroup: 1,
    remediation: [
      'Remove the Slack webhook URL from source code.',
      'Regenerate or disable the webhook in your Slack app settings.',
      'Provide webhook URLs via runtime environment variables.',
    ],
    enabled: true,
  },
  {
    id: 'KF-HOOK-002',
    name: 'Discord Webhook URL',
    category: 'Webhook Credentials',
    description: 'Detects Discord webhook URLs containing embedded webhook tokens.',
    severity: 'HIGH',
    pattern: '(https:\\/\\/(?:ptb\\.|canary\\.)?discord(?:app)?\\.com\\/api\\/webhooks\\/[0-9]{15,22}\\/[A-Za-z0-9_\\-]{30,90})',
    flags: 'g',
    baseConfidence: 'High',
    captureGroup: 1,
    remediation: [
      'Remove the Discord webhook URL from your repository.',
      'Delete and recreate the webhook in Discord Channel Integrations.',
      'Store the webhook endpoint in protected environment config.',
    ],
    enabled: true,
  },
  {
    id: 'KF-HOOK-003',
    name: 'Webhook Signing Secret Assignment',
    category: 'Webhook Credentials',
    description: 'Detects webhook secret or Stripe whsec_ signing secrets.',
    severity: 'HIGH',
    pattern:
      '(?:\\b(whsec_[A-Za-z0-9]{20,64})\\b|\\bwebhook[_-]?secret\\b\\s*[:=]\\s*[\'"`]([^\'"`\\r\\n]{10,80})[\'"`])',
    flags: 'gi',
    baseConfidence: 'High',
    captureGroup: 1,
    remediation: [
      'Remove hardcoded webhook signing secrets.',
      'Rotate the webhook signing secret in the provider dashboard.',
      'Load webhook verification secrets via environment variables.',
    ],
    enabled: true,
  },

  // 7. Configuration Secrets
  {
    id: 'KF-CFG-001',
    name: 'OAuth Client Secret Assignment',
    category: 'Configuration Secrets',
    description: 'Detects hardcoded OAuth client_secret values in code or config.',
    severity: 'HIGH',
    pattern:
      '\\b(?:oauth[_-]?)?client[_-]?secret\\b\\s*[:=]\\s*[\'"`]?([A-Za-z0-9_\\-+/=.]{10,96})[\'"`]?',
    flags: 'gi',
    baseConfidence: 'Medium',
    captureGroup: 1,
    remediation: [
      'Remove OAuth client secrets from client code and repository config.',
      'Reset the client secret in your OAuth identity provider.',
      'Keep OAuth client secrets strictly server-side or use PKCE for public clients.',
    ],
    enabled: true,
  },
  {
    id: 'KF-CFG-002',
    name: 'Application / JWT / Session Secret',
    category: 'Configuration Secrets',
    description: 'Detects hardcoded JWT_SECRET, SESSION_SECRET, APP_SECRET, or ENCRYPTION_KEY values.',
    severity: 'HIGH',
    pattern:
      '\\b(?:JWT_SECRET|SESSION_SECRET|APP_SECRET|SECRET_KEY|ENCRYPTION_KEY|SIGNING_SECRET|COOKIE_SECRET)\\b\\s*[:=]\\s*[\'"`]?([^\\s\'"`,;}{]{8,120})[\'"`]?',
    flags: 'g',
    baseConfidence: 'Medium',
    captureGroup: 1,
    remediation: [
      'Remove cryptographic signing or session secrets from committed files.',
      'Rotate the signing key (note: rotating session/JWT secrets invalidates active tokens).',
      'Provide secrets through environment variables or a secret manager.',
    ],
    enabled: true,
  },
  {
    id: 'KF-CFG-003',
    name: 'NPM or PyPI Authentication Token',
    category: 'Configuration Secrets',
    description: 'Detects npm_ tokens or .npmrc _authToken / .pypirc password entries.',
    severity: 'CRITICAL',
    pattern: '(?:\\b(npm_[A-Za-z0-9]{24,48})\\b|_authToken\\s*=\\s*([A-Za-z0-9\\-_]{16,96}))',
    flags: 'g',
    baseConfidence: 'High',
    captureGroup: 1,
    remediation: [
      'Remove registry authentication tokens from .npmrc or project config.',
      'Revoke the token in npmjs.com or PyPI account settings.',
      'Use CI/CD OIDC trusted publishing or user-home ~/.npmrc.',
    ],
    enabled: true,
  },

  // 8. High Entropy Values (handled by specialized heuristic analyzer, exposed as a rule toggle)
  {
    id: 'KF-ENT-001',
    name: 'High Entropy Secret Heuristic',
    category: 'High Entropy Values',
    description:
      'Flags suspicious high-randomness tokens above the configured Shannon entropy threshold.',
    severity: 'MEDIUM',
    pattern: '__ENTROPY_HEURISTIC__',
    baseConfidence: 'Low',
    isHeuristic: true,
    remediation: [
      'Inspect whether the high-entropy string is a live credential, salt, or non-sensitive hash.',
      'If it is a real secret, remove it from source files, rotate it, and move it to environment config.',
      'If it is a benign fixture or public identifier, mark this finding as False Positive.',
    ],
    enabled: true,
  },
];

// Detect nested quantifiers / catastrophic backtracking constructs before compiling custom regex
const DANGEROUS_REGEX_PATTERNS: RegExp[] = [
  /\([^)]*[+*][^)]*\)[+*]/, // e.g. (a+)+, (.*)*, ([a-z]+)+
  /\([^)]*\|[^)]*\)[+*]{1,2}\s*[+*]/, // alternation with stacked quantifiers
  /\{\d{3,},?\}/, // huge quantifier bounds like {500,}
];

export function validateCustomRegex(pattern: string): { valid: boolean; error?: string } {
  const trimmed = pattern.trim();
  if (!trimmed) {
    return { valid: false, error: 'Regex pattern cannot be empty.' };
  }
  if (trimmed.length > 300) {
    return { valid: false, error: 'Regex pattern is too long (maximum 300 characters).' };
  }
  if (trimmed === '.*' || trimmed === '.+' || trimmed === '^.*$') {
    return { valid: false, error: 'Overly broad wildcard patterns are blocked to protect scan performance.' };
  }

  for (const danger of DANGEROUS_REGEX_PATTERNS) {
    if (danger.test(trimmed)) {
      return {
        valid: false,
        error: 'Pattern contains nested or unbounded quantifiers that can cause catastrophic backtracking.',
      };
    }
  }

  try {
    const compiled = new RegExp(trimmed, 'g');
    // Verify it does not match empty strings endlessly
    const emptyTest = compiled.exec('');
    if (emptyTest && emptyTest[0] === '') {
      return {
        valid: false,
        error: 'Pattern matches empty strings, which can cause infinite matching loops.',
      };
    }
    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Invalid regular expression syntax.',
    };
  }
}

export function createCustomRule(input: CustomRuleInput): DetectionRule {
  const slug = Math.random().toString(36).slice(2, 6).toUpperCase();
  return {
    id: `KF-CUSTOM-${slug}`,
    name: input.name.trim(),
    category: input.category,
    description: input.description.trim() || 'User-defined local regex detection rule.',
    severity: input.severity,
    pattern: input.pattern.trim(),
    flags: 'g',
    baseConfidence: input.baseConfidence,
    remediation: input.remediation
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
    enabled: true,
    isCustom: true,
  };
}
