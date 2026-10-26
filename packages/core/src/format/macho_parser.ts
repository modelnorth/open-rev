/**
 * OpenRev Pure Native Mach-O 64-bit Binary Parser
 * 
 * Supports iOS & macOS Mach-O binaries (ARM64 / ARM64e).
 * Parses Mach-O headers, load commands (LC_LOAD_DYLIB, LC_SEGMENT_64),
 * extracts imported dynamic libraries, Objective-C class names, and Swift mangled symbols.
 * Zero external disassembler dependencies (no Hopper or Ghidra needed for inventory).
 */

const MH_MAGIC_64 = 0xfeedfacf;
const MH_CIGAM_64 = 0xcffaedfe;

const LC_SEGMENT_64 = 0x19;
const LC_LOAD_DYLIB = 0x0c;
const LC_LOAD_WEAK_DYLIB = 0x18 | 0x80000000;
const LC_RPATH = 0x1c | 0x80000000;

export interface MachOParsedSummary {
  cpuType: string;
  fileType: string;
  is64Bit: boolean;
  isLittleEndian: boolean;
  dylibDependencies: string[];
  objcClasses: string[];
  swiftSymbols: string[];
  rpaths: string[];
}

export class MachOParser {
  public static parse(buf: Buffer): MachOParsedSummary {
    if (buf.length < 32) {
      throw new Error('Buffer too small for Mach-O header');
    }

    const magic = buf.readUInt32LE(0);
    let isLittleEndian = true;
    let is64Bit = false;

    if (magic === MH_MAGIC_64) {
      is64Bit = true;
      isLittleEndian = true;
    } else if (magic === MH_CIGAM_64) {
      is64Bit = true;
      isLittleEndian = false;
    } else {
      // Check for Fat/Universal binary magic (0xcafebabe or 0xbebafeca)
      const fatMagic = buf.readUInt32BE(0);
      if (fatMagic === 0xcafebabe) {
        // FAT binary: read first slice offset
        if (buf.length >= 28) {
          const sliceOffset = buf.readUInt32BE(16);
          if (sliceOffset < buf.length) {
            return this.parse(buf.subarray(sliceOffset));
          }
        }
      }
      throw new Error(`Unsupported Mach-O magic: 0x${magic.toString(16)}`);
    }

    const readU32 = (offset: number) => isLittleEndian ? buf.readUInt32LE(offset) : buf.readUInt32BE(offset);

    const cputype = readU32(4);
    let cpuTypeStr = 'Unknown';
    if (cputype === 0x0100000c) cpuTypeStr = 'ARM64 / ARM64e';
    else if (cputype === 0x01000007) cpuTypeStr = 'x86_64';

    const filetype = readU32(12);
    let fileTypeStr = 'Executable';
    if (filetype === 0x6) fileTypeStr = 'Dylib';
    else if (filetype === 0x8) fileTypeStr = 'Bundle';

    const ncmds = readU32(16);
    const sizeofcmds = readU32(20);

    const dylibDependencies: string[] = [];
    const rpaths: string[] = [];

    // Parse Load Commands
    let cmdOffset = 32; // Mach-O 64 header size
    for (let i = 0; i < ncmds && cmdOffset + 8 <= buf.length; i++) {
      const cmd = readU32(cmdOffset);
      const cmdsize = readU32(cmdOffset + 4);
      if (cmdsize < 8 || cmdOffset + cmdsize > buf.length) break;

      if (cmd === LC_LOAD_DYLIB || (cmd & 0x7fffffff) === (LC_LOAD_DYLIB & 0x7fffffff)) {
        // Offset to dylib name string is at offset + 8
        const strOffset = readU32(cmdOffset + 8);
        if (strOffset < cmdsize) {
          const dylibNameBuf = buf.subarray(cmdOffset + strOffset, cmdOffset + cmdsize);
          const nullIdx = dylibNameBuf.indexOf(0);
          const dylibName = (nullIdx !== -1 ? dylibNameBuf.subarray(0, nullIdx) : dylibNameBuf).toString('utf8');
          if (dylibName) dylibDependencies.push(dylibName);
        }
      } else if (cmd === LC_RPATH || (cmd & 0x7fffffff) === (LC_RPATH & 0x7fffffff)) {
        const strOffset = readU32(cmdOffset + 8);
        if (strOffset < cmdsize) {
          const pathBuf = buf.subarray(cmdOffset + strOffset, cmdOffset + cmdsize);
          const nullIdx = pathBuf.indexOf(0);
          const rpath = (nullIdx !== -1 ? pathBuf.subarray(0, nullIdx) : pathBuf).toString('utf8');
          if (rpath) rpaths.push(rpath);
        }
      }

      cmdOffset += cmdsize;
    }

    // Fast heuristic scan for Objective-C class names and Swift 5 mangled symbols ($s...)
    const latinStr = buf.toString('latin1');
    const swiftMatches = latinStr.match(/\$s[a-zA-Z0-9_]{4,60}/g) || [];
    const swiftSymbols = Array.from(new Set(swiftMatches)).slice(0, 50);

    // ObjC Class references often appear with OBJC_CLASS_$_<Name>
    const objcMatches = latinStr.match(/OBJC_CLASS_\$_([a-zA-Z0-9_]+)/g) || [];
    const objcClasses = Array.from(new Set(objcMatches.map(m => m.replace('OBJC_CLASS_$_', '')))).slice(0, 50);

    return {
      cpuType: cpuTypeStr,
      fileType: fileTypeStr,
      is64Bit,
      isLittleEndian,
      dylibDependencies,
      objcClasses,
      swiftSymbols,
      rpaths
    };
  }
}
