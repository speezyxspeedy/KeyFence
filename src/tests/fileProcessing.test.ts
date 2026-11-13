import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import {
  classifyProjectFiles,
  DEFAULT_IGNORE_CONFIG,
  isBinaryBuffer,
  isSupportedSourceFile,
} from '../services/fileService.ts';
import { extractZipArchive, isSafeZipEntryPath } from '../services/zipService.ts';
import { analyzeGitignoreCoverage } from '../services/gitignoreAnalyzer.ts';

describe('File Processing, Binary Detection & Safe ZIP Handling', () => {
  it('recognizes supported source/config files and skips unsupported or excluded files', () => {
    expect(isSupportedSourceFile('src/index.ts')).toBe(true);
    expect(isSupportedSourceFile('.env.production')).toBe(true);
    expect(isSupportedSourceFile('Dockerfile')).toBe(true);
    expect(isSupportedSourceFile('assets/logo.png')).toBe(false);
    expect(isSupportedSourceFile('bin/tool.exe')).toBe(false);

    const classified = classifyProjectFiles(
      [
        { path: 'src/app.ts', name: 'app.ts', size: 120, content: 'export const x = 1;' },
        { path: 'node_modules/pkg/index.js', name: 'index.js', size: 100 },
        { path: 'huge/bundle.js', name: 'bundle.js', size: 5 * 1024 * 1024 },
        { path: 'assets/photo.png', name: 'photo.png', size: 1024 },
      ],
      DEFAULT_IGNORE_CONFIG
    );

    expect(classified.supported).toHaveLength(1);
    expect(classified.supported[0].path).toBe('src/app.ts');
    expect(classified.skipped).toHaveLength(3);
  });

  it('detects binary buffers via magic bytes and null bytes', () => {
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(isBinaryBuffer(pngBytes)).toBe(true);

    const nullBytes = new Uint8Array([0x61, 0x62, 0x00, 0x63]);
    expect(isBinaryBuffer(nullBytes)).toBe(true);

    const textBytes = new TextEncoder().encode('const hello = "world";\n');
    expect(isBinaryBuffer(textBytes)).toBe(false);
  });

  it('rejects ZIP path traversal sequences and corrupted archives', async () => {
    expect(isSafeZipEntryPath('../../etc/passwd')).toBe(false);
    expect(isSafeZipEntryPath('/etc/shadow')).toBe(false);
    expect(isSafeZipEntryPath('C:\\Windows\\System32\\cmd.exe')).toBe(false);
    expect(isSafeZipEntryPath('src/config/app.ts')).toBe(true);

    // Corrupted ZIP bytes
    const badZip = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]);
    await expect(
      extractZipArchive(badZip, 'corrupted.zip', DEFAULT_IGNORE_CONFIG)
    ).rejects.toThrow(/Unable to open ZIP archive/i);

    // Valid ZIP containing one genuine path-traversal entry ('../evil.txt') and one normal file
    const zip = new JSZip();
    zip.file('xx/evil.txt', 'secret=123');
    zip.file('project/index.ts', 'export const ok = true;');
    const buffer = await zip.generateAsync({ type: 'uint8array' });

    // Replace 'xx/evil.txt' with '../evil.txt' directly in the ZIP binary headers (same 11-byte length)
    const needle = new TextEncoder().encode('xx/evil.txt');
    const replacement = new TextEncoder().encode('../evil.txt');
    for (let i = 0; i <= buffer.length - needle.length; i++) {
      let match = true;
      for (let j = 0; j < needle.length; j++) {
        if (buffer[i + j] !== needle[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        buffer.set(replacement, i);
      }
    }

    const extracted = await extractZipArchive(
      buffer,
      'sample.zip',
      DEFAULT_IGNORE_CONFIG
    );
    expect(extracted.rejectedTraversalCount).toBe(1);
    expect(extracted.files.map((f) => f.path)).toEqual(['project/index.ts']);
  });

  it('analyzes .gitignore coverage for sensitive filenames', () => {
    const result = analyzeGitignoreCoverage(
      ['.env', '.env.production', 'certs/dev.key', 'src/index.ts'],
      [{ path: '.gitignore', content: '.env\n' }]
    );

    expect(result.hasGitignore).toBe(true);
    expect(result.uncoveredCount).toBe(2); // .env.production and certs/dev.key
    expect(result.suggestedRules.length).toBeGreaterThan(0);
  });
});
