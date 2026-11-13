import { ProjectFileInput } from '../types/index.ts';

/**
 * Fictional demonstration project using clearly labeled fake placeholder values.
 * Executed through the real KeyFence scanning engine.
 */
export function getDemoProjectFiles(): ProjectFileInput[] {
  const files: Array<{ path: string; content: string }> = [
    {
      path: 'demo-service/src/config/apiClient.ts',
      content: [
        'export interface ApiConfig {',
        '  endpoint: string;',
        '  timeoutMs: number;',
        '  apiKey: string;',
        '}',
        '',
        '// DEMO PLACEHOLDER ONLY — NOT A REAL CREDENTIAL',
        'export const demoBillingConfig: ApiConfig = {',
        '  endpoint: "https://api.example.invalid/v2",',
        '  timeoutMs: 5000,',
        '  apiKey: "sk-test-DEMO9876543210PLACEHOLDER0011",',
        '};',
        '',
        'export function getPublicFeatureFlags() {',
        '  return { darkMode: true, region: "us-west-2", maxRetries: 3 };',
        '}',
      ].join('\n'),
    },
    {
      path: 'demo-service/src/db/connection.ts',
      content: [
        'export const DB_POOL_OPTIONS = {',
        '  maxConnections: 10,',
        '  idleTimeoutMillis: 30000,',
        '};',
        '',
        '// Fictional connection string placeholder for KeyFence demo',
        'export const DEMO_DATABASE_URL =',
        '  "postgresql://demo_reader:Demo_Placeholder_Pw99@db.example.invalid:5432/app_dev";',
      ].join('\n'),
    },
    {
      path: 'demo-service/.env.development',
      content: [
        'APP_NAME=KeyFenceDemoApp',
        'PORT=8080',
        'LOG_LEVEL=info',
        'ADMIN_PASSWORD="DemoOnly!Placeholder2026"',
        'JWT_SECRET=demo_jwt_signing_placeholder_9a8b7c6d5e4f3a2b1c',
        'DEMO_HIGH_ENTROPY_TOKEN="q9Z#mK8vP2xL7wR4nB6tY1cF5hJ3dG0s"',
      ].join('\n'),
    },
    {
      path: 'demo-service/certs/demo-signing-placeholder.pem',
      content: [
        '-----BEGIN RSA PRIVATE KEY-----',
        'DEMO_PLACEHOLDER_NOT_A_REAL_KEY_MATERIAL_LINE_0001',
        'DEMO_PLACEHOLDER_NOT_A_REAL_KEY_MATERIAL_LINE_0002',
        '-----END RSA PRIVATE KEY-----',
      ].join('\n'),
    },
    {
      path: 'demo-service/config/notifications.json',
      content: JSON.stringify(
        {
          serviceName: 'keyfence-demo-notifier',
          retryPolicy: { attempts: 3, backoffMs: 500 },
          webhook_secret: 'whsec_DEMOPLACEHOLDER9876543210ABCDEF',
          channel: '#security-alerts',
        },
        null,
        2
      ),
    },
    {
      path: 'demo-service/src/utils/logger.ts',
      content: [
        'export function formatLogMessage(level: "info" | "warn" | "error", msg: string): string {',
        '  const timestamp = new Date().toISOString();',
        '  return `[${timestamp}] [${level.toUpperCase()}] ${msg}`;',
        '}',
      ].join('\n'),
    },
    {
      path: 'demo-service/.gitignore',
      content: [
        'node_modules/',
        'dist/',
        '.env',
        '# Note: .env.development and *.pem are intentionally omitted here to demonstrate the Gitignore Analyzer',
      ].join('\n'),
    },
  ];

  return files.map((f) => ({
    path: f.path,
    name: f.path.split('/').pop() ?? f.path,
    size: new TextEncoder().encode(f.content).byteLength,
    content: f.content,
  }));
}
