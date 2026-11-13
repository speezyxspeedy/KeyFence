import JSZip from 'jszip';
import { IgnoreConfig, ProjectFileInput, SkippedFileInfo } from '../types/index.ts';
import {
  checkFileExclusion,
  isBinaryBuffer,
  normalizePath,
} from './fileService.ts';

export interface ZipExtractionResult {
  projectLabel: string;
  files: ProjectFileInput[];
  skipped: SkippedFileInfo[];
  totalEntries: number;
  totalBytes: number;
  rejectedTraversalCount: number;
}

const MAX_ARCHIVE_ENTRIES = 10000;

/**
 * Protects against ZIP Slip / path traversal attacks and malformed entry names.
 */
export function isSafeZipEntryPath(rawPath: string): boolean {
  if (!rawPath || rawPath.includes('\0')) return false;
  // Block Windows drive prefixes (e.g. C:\) or UNC paths
  if (/^[a-zA-Z]:/.test(rawPath) || rawPath.startsWith('\\\\')) return false;
  // Block leading slashes
  if (rawPath.startsWith('/') || rawPath.startsWith('\\')) return false;

  const segments = rawPath.replace(/\\/g, '/').split('/');
  for (const seg of segments) {
    if (seg === '..' || seg === '.') {
      return false;
    }
  }
  return true;
}

export async function extractZipArchive(
  zipSource: File | ArrayBuffer | Uint8Array,
  archiveName: string,
  ignoreConfig: IgnoreConfig,
  onProgress?: (percent: number, currentEntry: string) => void
): Promise<ZipExtractionResult> {
  if (zipSource instanceof File && zipSource.size === 0) {
    throw new Error('The selected ZIP archive is empty (0 bytes).');
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(zipSource);
  } catch {
    throw new Error(
      'Unable to open ZIP archive. The file may be corrupted, encrypted, or not a valid ZIP format.'
    );
  }

  const allEntries = Object.values(zip.files).filter((entry) => !entry.dir);
  if (allEntries.length === 0) {
    throw new Error('The ZIP archive contains no files.');
  }

  if (allEntries.length > MAX_ARCHIVE_ENTRIES) {
    throw new Error(
      `Archive contains ${allEntries.length.toLocaleString()} files, exceeding the safety limit of ${MAX_ARCHIVE_ENTRIES.toLocaleString()} entries.`
    );
  }

  const files: ProjectFileInput[] = [];
  const skipped: SkippedFileInfo[] = [];
  let totalExtractedBytes = 0;
  let totalBytes = 0;
  let rejectedTraversalCount = 0;

  for (let idx = 0; idx < allEntries.length; idx++) {
    const entry = allEntries[idx];
    const rawEntryPath =
      (entry as unknown as { unsafeOriginalName?: string }).unsafeOriginalName ||
      entry.name;
    const percent = Math.round(((idx + 1) / allEntries.length) * 100);
    onProgress?.(percent, entry.name);

    if (!isSafeZipEntryPath(rawEntryPath)) {
      rejectedTraversalCount++;
      skipped.push({
        path: rawEntryPath,
        size: 0,
        reason: 'Rejected unsafe archive path (path traversal protection)',
      });
      continue;
    }

    const cleanPath = normalizePath(entry.name);
    const fileName = cleanPath.split('/').pop() ?? cleanPath;

    // Pre-check uncompressed size hint if available in JSZip internal metadata
    const uncompressedSizeHint =
      (entry as unknown as { _data?: { uncompressedSize?: number } })._data
        ?.uncompressedSize ?? 0;

    if (
      uncompressedSizeHint > 0 &&
      uncompressedSizeHint > ignoreConfig.maxFileSizeBytes
    ) {
      totalBytes += uncompressedSizeHint;
      skipped.push({
        path: cleanPath,
        size: uncompressedSizeHint,
        reason: `File size (${Math.round(uncompressedSizeHint / 1024).toLocaleString()} KB) exceeds ${Math.round(ignoreConfig.maxFileSizeBytes / 1024).toLocaleString()} KB limit`,
      });
      continue;
    }

    // Check exclusion rules before decompressing when size isn't needed
    const prelimCheck = checkFileExclusion(cleanPath, uncompressedSizeHint, ignoreConfig);
    if (prelimCheck.excluded) {
      totalBytes += uncompressedSizeHint;
      skipped.push({
        path: cleanPath,
        size: uncompressedSizeHint,
        reason: prelimCheck.reason ?? 'Excluded by configuration',
      });
      continue;
    }

    let bytes: Uint8Array;
    try {
      bytes = await entry.async('uint8array');
    } catch {
      skipped.push({
        path: cleanPath,
        size: 0,
        reason: 'Failed to decompress ZIP entry (corrupted or unsupported compression)',
      });
      continue;
    }

    totalBytes += bytes.byteLength;
    totalExtractedBytes += bytes.byteLength;

    if (totalExtractedBytes > ignoreConfig.maxArchiveSizeBytes) {
      throw new Error(
        `Archive expansion aborted: extracted content exceeded the ${Math.round(ignoreConfig.maxArchiveSizeBytes / (1024 * 1024))} MB memory safety limit.`
      );
    }

    const postCheck = checkFileExclusion(cleanPath, bytes.byteLength, ignoreConfig);
    if (postCheck.excluded) {
      skipped.push({
        path: cleanPath,
        size: bytes.byteLength,
        reason: postCheck.reason ?? 'Excluded by configuration',
      });
      continue;
    }

    if (bytes.byteLength === 0) {
      skipped.push({
        path: cleanPath,
        size: 0,
        reason: 'Empty file',
      });
      continue;
    }

    if (isBinaryBuffer(bytes)) {
      skipped.push({
        path: cleanPath,
        size: bytes.byteLength,
        reason: 'Binary content detected',
      });
      continue;
    }

    const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    files.push({
      path: cleanPath,
      name: fileName,
      size: bytes.byteLength,
      content: text,
    });
  }

  const label = archiveName.replace(/\.zip$/i, '') || 'ZIP Archive';

  return {
    projectLabel: label,
    files,
    skipped,
    totalEntries: allEntries.length,
    totalBytes,
    rejectedTraversalCount,
  };
}
