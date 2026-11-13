import { IgnoreConfig, ProjectFileInput, SkippedFileInfo } from '../types/index.ts';

export const DEFAULT_IGNORE_CONFIG: IgnoreConfig = {
  excludedFolders: [
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    'vendor',
    '.next',
    'target',
    '__pycache__',
    '.venv',
  ],
  excludedFileNames: [
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'Cargo.lock',
    'poetry.lock',
  ],
  excludedExtensions: ['.min.js', '.min.css', '.map', '.lock'],
  customPatterns: ['*.log', '*.tmp'],
  maxFileSizeBytes: 1024 * 1024, // 1 MB per file
  maxArchiveSizeBytes: 100 * 1024 * 1024, // 100 MB extracted ZIP limit
};

export const SUPPORTED_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.py',
  '.java',
  '.cpp',
  '.cc',
  '.cxx',
  '.c',
  '.h',
  '.hpp',
  '.cs',
  '.go',
  '.rs',
  '.php',
  '.rb',
  '.swift',
  '.kt',
  '.kts',
  '.html',
  '.htm',
  '.css',
  '.scss',
  '.sass',
  '.less',
  '.json',
  '.jsonc',
  '.yaml',
  '.yml',
  '.toml',
  '.xml',
  '.properties',
  '.env',
  '.sh',
  '.bash',
  '.zsh',
  '.ps1',
  '.md',
  '.txt',
  '.conf',
  '.cfg',
  '.ini',
  '.sql',
  '.tf',
  '.tfvars',
  '.hcl',
  '.pem',
  '.key',
  '.crt',
  '.pub',
  '.npmrc',
  '.pypirc',
  '.dockerignore',
  '.gitignore',
  '.editorconfig',
]);

export const SUPPORTED_BASENAMES = new Set([
  'dockerfile',
  'makefile',
  'jenkinsfile',
  'vagrantfile',
  'procfile',
  '.env',
  '.gitignore',
  '.dockerignore',
  '.npmrc',
  '.pypirc',
  '.htaccess',
]);

export const KNOWN_BINARY_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.bmp',
  '.tiff',
  '.svgz',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.eot',
  '.mp3',
  '.mp4',
  '.wav',
  '.ogg',
  '.webm',
  '.avi',
  '.mov',
  '.pdf',
  '.zip',
  '.tar',
  '.gz',
  '.7z',
  '.rar',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.bin',
  '.wasm',
  '.class',
  '.jar',
  '.pyc',
  '.sqlite',
  '.db',
  '.psd',
  '.ai',
]);

export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+/g, '/');
}

export function getFileExtension(filePath: string): string {
  const base = filePath.split('/').pop()?.toLowerCase() ?? '';
  if (base.startsWith('.env')) return '.env';
  if (base === '.gitignore') return '.gitignore';
  if (base === '.npmrc') return '.npmrc';
  if (base === '.pypirc') return '.pypirc';
  const dotIdx = base.lastIndexOf('.');
  if (dotIdx <= 0) return '';
  return base.slice(dotIdx);
}

export function isSupportedSourceFile(filePath: string): boolean {
  const normalized = normalizePath(filePath);
  const base = normalized.split('/').pop()?.toLowerCase() ?? '';
  if (!base) return false;

  if (SUPPORTED_BASENAMES.has(base)) return true;
  if (base.startsWith('.env.') || base.startsWith('dockerfile.')) return true;

  const ext = getFileExtension(normalized);
  if (!ext) return false;
  if (KNOWN_BINARY_EXTENSIONS.has(ext)) return false;

  return SUPPORTED_EXTENSIONS.has(ext);
}

export function isBinaryBuffer(bytes: Uint8Array): boolean {
  const sampleLen = Math.min(bytes.length, 4096);
  if (sampleLen === 0) return false;

  // Check common binary magic headers
  if (sampleLen >= 4) {
    // PNG
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return true;
    // PDF
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return true;
    // ZIP
    if (bytes[0] === 0x50 && bytes[1] === 0x4b && (bytes[2] === 0x03 || bytes[2] === 0x05)) return true;
    // ELF
    if (bytes[0] === 0x7f && bytes[1] === 0x45 && bytes[2] === 0x4c && bytes[3] === 0x46) return true;
    // WASM
    if (bytes[0] === 0x00 && bytes[1] === 0x61 && bytes[2] === 0x73 && bytes[3] === 0x6d) return true;
  }

  let suspiciousCount = 0;
  for (let i = 0; i < sampleLen; i++) {
    const b = bytes[i];
    if (b === 0x00) {
      return true; // Null byte strongly indicates binary
    }
    // Non-printable control characters outside tab/LF/CR
    if (b < 0x09 || (b > 0x0d && b < 0x20)) {
      suspiciousCount++;
    }
  }

  return suspiciousCount / sampleLen > 0.12;
}

export function isBinaryTextContent(text: string): boolean {
  const sampleLen = Math.min(text.length, 4096);
  if (sampleLen === 0) return false;

  let controlOrReplacement = 0;
  for (let i = 0; i < sampleLen; i++) {
    const code = text.charCodeAt(i);
    if (code === 0) return true;
    if (code === 0xfffd || (code < 0x09 || (code > 0x0d && code < 0x20))) {
      controlOrReplacement++;
    }
  }
  return controlOrReplacement / sampleLen > 0.1;
}

function globToRegex(glob: string): RegExp {
  const escaped = glob
    .trim()
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '.');
  return new RegExp(`(^|/)${escaped}$`, 'i');
}

export function checkFileExclusion(
  filePath: string,
  sizeBytes: number,
  config: IgnoreConfig
): { excluded: boolean; reason?: string } {
  const normalized = normalizePath(filePath);
  const parts = normalized.split('/');
  const fileName = parts[parts.length - 1] ?? '';

  // 1. Folder exclusions
  for (const folder of config.excludedFolders) {
    const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
    if (!cleanFolder) continue;
    if (parts.slice(0, -1).some((seg) => seg.toLowerCase() === cleanFolder.toLowerCase())) {
      return { excluded: true, reason: `Excluded directory (${cleanFolder}/)` };
    }
  }

  // 2. Exact filename exclusions
  if (config.excludedFileNames.some((n) => n.toLowerCase() === fileName.toLowerCase())) {
    return { excluded: true, reason: `Excluded filename (${fileName})` };
  }

  // 3. Extension exclusions (supports compound suffixes like .min.js)
  const lowerName = fileName.toLowerCase();
  for (const ext of config.excludedExtensions) {
    const cleanExt = ext.trim().toLowerCase();
    if (cleanExt && lowerName.endsWith(cleanExt)) {
      return { excluded: true, reason: `Excluded extension (${cleanExt})` };
    }
  }

  // 4. Custom glob patterns
  for (const pattern of config.customPatterns) {
    const trimmed = pattern.trim();
    if (!trimmed) continue;
    try {
      const re = globToRegex(trimmed);
      if (re.test(normalized) || re.test(fileName)) {
        return { excluded: true, reason: `Matched custom ignore pattern (${trimmed})` };
      }
    } catch {
      // Ignore malformed custom glob
    }
  }

  // 5. Known binary extension
  const ext = getFileExtension(normalized);
  if (ext && KNOWN_BINARY_EXTENSIONS.has(ext)) {
    return { excluded: true, reason: `Binary file format (${ext})` };
  }

  // 6. Supported source check
  if (!isSupportedSourceFile(normalized)) {
    return { excluded: true, reason: 'Unsupported file type' };
  }

  // 7. File size limit
  if (sizeBytes > config.maxFileSizeBytes) {
    const maxKb = Math.round(config.maxFileSizeBytes / 1024);
    const fileKb = Math.round(sizeBytes / 1024);
    return {
      excluded: true,
      reason: `File size (${fileKb.toLocaleString()} KB) exceeds ${maxKb.toLocaleString()} KB limit`,
    };
  }

  return { excluded: false };
}

export function classifyProjectFiles(
  inputs: ProjectFileInput[],
  config: IgnoreConfig
): {
  supported: ProjectFileInput[];
  skipped: SkippedFileInfo[];
  totalBytes: number;
} {
  const supported: ProjectFileInput[] = [];
  const skipped: SkippedFileInfo[] = [];
  let totalBytes = 0;

  for (const item of inputs) {
    const cleanPath = normalizePath(item.path || item.name);
    totalBytes += item.size;

    const check = checkFileExclusion(cleanPath, item.size, config);
    if (check.excluded) {
      skipped.push({
        path: cleanPath,
        size: item.size,
        reason: check.reason ?? 'Excluded by configuration',
      });
    } else {
      supported.push({
        ...item,
        path: cleanPath,
      });
    }
  }

  return { supported, skipped, totalBytes };
}

export async function readProjectFileText(
  item: ProjectFileInput
): Promise<{ ok: true; text: string } | { ok: false; reason: string }> {
  if (typeof item.content === 'string') {
    if (item.content.length === 0) {
      return { ok: false, reason: 'Empty file' };
    }
    if (isBinaryTextContent(item.content)) {
      return { ok: false, reason: 'Binary content detected' };
    }
    return { ok: true, text: item.content };
  }

  if (!item.file) {
    return { ok: false, reason: 'File reference unavailable' };
  }

  if (item.file.size === 0) {
    return { ok: false, reason: 'Empty file' };
  }

  try {
    const buffer = await item.file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (isBinaryBuffer(bytes)) {
      return { ok: false, reason: 'Binary content detected' };
    }
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const text = decoder.decode(bytes);
    if (isBinaryTextContent(text)) {
      return { ok: false, reason: 'Binary content detected' };
    }
    return { ok: true, text };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? `Read failure: ${err.message}` : 'File read failure',
    };
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, i);
  return `${value >= 10 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}
