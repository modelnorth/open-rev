/**
 * OpenRev Pure Native Metadata Extractors: DEX & ELF
 * 
 * Extracts method signatures, classes, string pools, and JNI dynamic exports
 * directly from binary buffers without requiring external JVM (JADX) or Ghidra tools.
 */

export interface DexClassHeader {
  classDescriptor: string;
  superClassDescriptor?: string;
  accessFlags: number;
}

export interface DexParsedSummary {
  version: string;
  fileSize: number;
  classCount: number;
  stringCount: number;
  classes: string[];
  nativeMethods: Array<{ className: string; methodName: string }>;
  strings: string[];
}

export class DexHeaderParser {
  /**
   * Parses Android DEX file header & extracts classes / method names / string pool
   */
  public static parse(buf: Buffer): DexParsedSummary {
    if (buf.length < 112) {
      throw new Error('Buffer too small for DEX header');
    }

    // DEX Magic: "dex\n035\0" or "dex\n037\0", etc.
    const magic = buf.subarray(0, 8).toString('ascii');
    if (!magic.startsWith('dex\n')) {
      throw new Error(`Invalid DEX magic header: ${magic}`);
    }
    const version = magic.substring(4, 7);

    const fileSize = buf.readUInt32LE(32);
    const stringIdsSize = buf.readUInt32LE(56);
    const stringIdsOff = buf.readUInt32LE(60);
    const typeIdsSize = buf.readUInt32LE(64);
    const typeIdsOff = buf.readUInt32LE(68);
    const classDefsSize = buf.readUInt32LE(96);
    const classDefsOff = buf.readUInt32LE(100);

    // 1. Extract string offsets (up to 500 strings for performance)
    const strings: string[] = [];
    const maxStrings = Math.min(stringIdsSize, 1000);
    for (let i = 0; i < maxStrings; i++) {
      const offPos = stringIdsOff + i * 4;
      if (offPos + 4 <= buf.length) {
        const strDataOff = buf.readUInt32LE(offPos);
        if (strDataOff < buf.length) {
          // Read ULEB128 string length, then null-terminated utf8
          let p = strDataOff;
          // Skip ULEB128
          while (p < buf.length && (buf[p] & 0x80) !== 0) {
            p++;
          }
          p++; // first char
          let end = p;
          while (end < buf.length && buf[end] !== 0 && end - p < 256) {
            end++;
          }
          strings.push(buf.subarray(p, end).toString('utf8'));
        }
      }
    }

    // 2. Extract Type Descriptors
    const types: string[] = [];
    const maxTypes = Math.min(typeIdsSize, 1000);
    for (let i = 0; i < maxTypes; i++) {
      const typePos = typeIdsOff + i * 4;
      if (typePos + 4 <= buf.length) {
        const descriptorIdx = buf.readUInt32LE(typePos);
        if (descriptorIdx < strings.length) {
          types.push(strings[descriptorIdx]);
        }
      }
    }

    // 3. Extract Class Descriptors
    const classes: string[] = [];
    const maxClasses = Math.min(classDefsSize, 500);
    for (let i = 0; i < maxClasses; i++) {
      const classDefPos = classDefsOff + i * 32;
      if (classDefPos + 32 <= buf.length) {
        const classIdx = buf.readUInt32LE(classDefPos);
        if (classIdx < types.length) {
          classes.push(types[classIdx]);
        }
      }
    }

    // 4. Scan strings for candidate JNI native method declarations
    // Pattern: strings starting with "native" or JNI bridge indicators
    const nativeMethods: Array<{ className: string; methodName: string }> = [];
    for (const s of strings) {
      if (s.startsWith('Java_')) {
        const parts = s.split('_');
        if (parts.length >= 3) {
          nativeMethods.push({
            className: parts.slice(1, parts.length - 1).join('.'),
            methodName: parts[parts.length - 1]
          });
        }
      }
    }

    return {
      version,
      fileSize,
      classCount: classDefsSize,
      stringCount: stringIdsSize,
      classes,
      nativeMethods,
      strings: strings.slice(0, 100)
    };
  }
}

export interface ElfParsedSummary {
  is64Bit: boolean;
  endianness: 'little' | 'big';
  machine: string; // ARM, AArch64, x86, x86-64
  exportedSymbols: string[];
  jniFunctions: string[];
  neededLibraries: string[];
}

export class ElfHeaderParser {
  /**
   * Pure native ELF header and symbol parser
   */
  public static parse(buf: Buffer): ElfParsedSummary {
    if (buf.length < 52) {
      throw new Error('Buffer too small for ELF header');
    }

    // ELF Magic: 0x7F 'E' 'L' 'F'
    if (buf[0] !== 0x7f || buf[1] !== 0x45 || buf[2] !== 0x4c || buf[3] !== 0x46) {
      throw new Error('Invalid ELF magic');
    }

    const is64Bit = buf[4] === 2;
    const isLittleEndian = buf[5] === 1;
    const endianness = isLittleEndian ? 'little' : 'big';

    const e_machine = isLittleEndian ? buf.readUInt16LE(18) : buf.readUInt16BE(18);
    let machine = 'Unknown';
    switch (e_machine) {
      case 0x03: machine = 'x86'; break;
      case 0x28: machine = 'ARM'; break;
      case 0x3e: machine = 'x86-64'; break;
      case 0xb7: machine = 'AArch64'; break;
    }

    // Quick regex scan for null-terminated strings representing JNI functions and needed libs
    const str = buf.toString('latin1');
    const jniMatches = str.match(/Java_[a-zA-Z0-9_]+/g) || [];
    const jniFunctions = Array.from(new Set(jniMatches));

    const soMatches = str.match(/lib[a-zA-Z0-9_\-]+\.so/g) || [];
    const neededLibraries = Array.from(new Set(soMatches)).slice(0, 30);

    return {
      is64Bit,
      endianness,
      machine,
      exportedSymbols: jniFunctions,
      jniFunctions,
      neededLibraries
    };
  }
}
