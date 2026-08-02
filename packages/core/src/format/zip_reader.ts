/**
 * OpenRev ZIP Archive Reader
 *
 * Pure-Node ZIP parser built on node:zlib. Reads the end-of-central-directory
 * record and central directory, then decompresses entries with CRC32
 * verification. Supports the two methods found in APKs: STORED (0) and
 * DEFLATE (8).
 *
 * Node-only: uses node: buffer/zlib via dynamic import so this module remains
 * importable in browser bundles.
 */

import { OpenRevError, OpenRevErrorCode } from '../errors/openrev_error.ts';

export interface ZipEntry {
  name: string;
  compressedSize: number;
  uncompressedSize: number;
  compressionMethod: number;
  crc32: number;
  localHeaderOffset: number;
  isDirectory: boolean;
}

function err(code: OpenRevErrorCode, message: string, context?: Record<string, any>): OpenRevError {
  return new OpenRevError({ code, message, context });
}

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_DIR_SIGNATURE = 0x02014b50;
const LOCAL_FILE_SIGNATURE = 0x04034b50;

export class ZipReader {
  private data: Buffer;
  private entries: Map<string, ZipEntry> = new Map();
  private sortedEntries: ZipEntry[] = [];

  private constructor(data: Buffer) {
    this.data = data;
  }

  public static async open(data: Buffer): Promise<ZipReader> {
    const reader = new ZipReader(data);
    reader.parse();
    return reader;
  }

  public static async fromFile(path: string): Promise<ZipReader> {
    const { readFile } = await import('node:fs/promises');
    const data = await readFile(path);
    return ZipReader.open(data);
  }

  public getEntryNames(): string[] {
    return this.sortedEntries.map((e) => e.name);
  }

  public hasEntry(name: string): boolean {
    return this.entries.has(normalizeEntryName(name));
  }

  public getEntry(name: string): ZipEntry | undefined {
    return this.entries.get(normalizeEntryName(name));
  }

  public getEntries(): ZipEntry[] {
    return this.sortedEntries;
  }

  public async readEntry(name: string): Promise<Buffer> {
    const entry = this.entries.get(normalizeEntryName(name));
    if (!entry) {
      throw err(
        OpenRevErrorCode.ZIP_SLIP_ATTEMPT,
        `ZIP entry not found: ${name}`,
        { name }
      );
    }
    return this.extract(entry);
  }

  public async extractAll(outputDir: string, options: { maxEntrySizeBytes?: number } = {}): Promise<string[]> {
    const { mkdir, writeFile } = await import('node:fs/promises');
    const { join, normalize, sep } = await import('node:path');
    const { resolve } = await import('node:path');
    const root = resolve(outputDir);

    const written: string[] = [];
    for (const entry of this.sortedEntries) {
      if (entry.isDirectory) continue;
      const safePath = resolve(root, normalize(entry.name));
      if (!safePath.startsWith(root + sep) && safePath !== root) {
        throw err(
          OpenRevErrorCode.ZIP_SLIP_ATTEMPT,
          `Refusing to extract entry outside target directory: ${entry.name}`
        );
      }
      const data = await this.extract(entry, options);
      await mkdir(join(safePath, '..'), { recursive: true });
      await writeFile(safePath, data);
      written.push(safePath);
    }
    return written;
  }

  private parse(): void {
    const eocd = this.findEocd();
    const dirOffset = eocd.readUInt32LE(16);
    const entryCount = eocd.readUInt16LE(10);

    let offset = dirOffset;
    for (let i = 0; i < entryCount; i++) {
      if (offset + 46 > this.data.length) break;
      if (this.data.readUInt32LE(offset) !== CENTRAL_DIR_SIGNATURE) break;

      const method = this.data.readUInt16LE(offset + 10);
      const crc32 = this.data.readUInt32LE(offset + 16);
      const compressedSize = this.data.readUInt32LE(offset + 20);
      const uncompressedSize = this.data.readUInt32LE(offset + 24);
      const nameLen = this.data.readUInt16LE(offset + 28);
      const extraLen = this.data.readUInt16LE(offset + 30);
      const commentLen = this.data.readUInt16LE(offset + 32);
      const localHeaderOffset = this.data.readUInt32LE(offset + 42);
      const name = this.data.subarray(offset + 46, offset + 46 + nameLen).toString('utf8');

      const entry: ZipEntry = {
        name,
        compressedSize,
        uncompressedSize,
        compressionMethod: method,
        crc32,
        localHeaderOffset,
        isDirectory: name.endsWith('/')
      };

      this.entries.set(normalizeEntryName(name), entry);
      this.sortedEntries.push(entry);
      offset += 46 + nameLen + extraLen + commentLen;
    }
  }

  private findEocd(): Buffer {
    const minOffset = Math.max(0, this.data.length - 65557);
    for (let i = this.data.length - 22; i >= minOffset; i--) {
      if (this.data.readUInt32LE(i) === EOCD_SIGNATURE) {
        return this.data.subarray(i);
      }
    }
    throw err(OpenRevErrorCode.INVALID_APK, 'ZIP end-of-central-directory record not found');
  }

  private async extract(entry: ZipEntry, options: { maxEntrySizeBytes?: number } = {}): Promise<Buffer> {
    const maxSize = options.maxEntrySizeBytes ?? 500 * 1024 * 1024;
    if (entry.uncompressedSize > maxSize) {
      throw err(
        OpenRevErrorCode.FILE_TOO_LARGE,
        `ZIP entry exceeds size limit (${entry.name}, ${entry.uncompressedSize} bytes)`
      );
    }

    const localOffset = entry.localHeaderOffset;
    if (localOffset + 30 > this.data.length) {
      throw err(OpenRevErrorCode.INVALID_APK, `Corrupt local header for ${entry.name}`);
    }
    const nameLen = this.data.readUInt16LE(localOffset + 26);
    const extraLen = this.data.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + nameLen + extraLen;
    const dataEnd = dataStart + entry.compressedSize;
    if (dataEnd > this.data.length) {
      throw err(OpenRevErrorCode.INVALID_APK, `Truncated data for ${entry.name}`);
    }

    const compressed = this.data.subarray(dataStart, dataEnd);
    let raw: Buffer;

    if (entry.compressionMethod === 0) {
      raw = Buffer.from(compressed);
    } else if (entry.compressionMethod === 8) {
      const { inflateRawSync } = await import('node:zlib');
      try {
        raw = inflateRawSync(compressed);
      } catch (inflateErr) {
        throw err(
          OpenRevErrorCode.INVALID_APK,
          `Failed to inflate entry ${entry.name}: ${(inflateErr as Error).message}`
        );
      }
    } else {
      throw err(
        OpenRevErrorCode.UNSUPPORTED_FORMAT,
        `Unsupported ZIP compression method ${entry.compressionMethod} for ${entry.name}`
      );
    }

    if (entry.uncompressedSize > 0 && raw.length !== entry.uncompressedSize) {
      throw err(
        OpenRevErrorCode.INVALID_APK,
        `Size mismatch for ${entry.name}: expected ${entry.uncompressedSize}, got ${raw.length}`
      );
    }

    const { crc32 } = await import('node:zlib');
    const actualCrc = crc32(raw) >>> 0;
    if (entry.crc32 !== 0 && actualCrc !== entry.crc32) {
      throw err(OpenRevErrorCode.CORRUPT_ARTIFACT, `CRC32 mismatch for ${entry.name}`);
    }

    return raw;
  }
}

function normalizeEntryName(name: string): string {
  return name.replace(/\\/g, '/');
}
