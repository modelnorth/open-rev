/**
 * ElfProvider — EXPERIMENTAL (header-level parsing only)
 *
 * Reads the real ELF header (magic, class, endianness, machine/architecture,
 * entry point) directly from file bytes. Symbol extraction is NOT implemented
 * here — this provider never fabricates symbols. Use the Ghidra adapter
 * (`provider.ghidra` → analyzeHeadless) for real symbol tables.
 *
 * Status: experimental. The symbol-table reader is a known gap.
 */

import { OpenRevError, OpenRevErrorCode } from '../../core/src/errors/openrev_error.ts';

const ELF_MAGIC = 0x7f454c46; // "\x7fELF"
const EM_MACHINE: Record<number, string> = {
  3: 'x86',
  8: 'MIPS',
  20: 'PowerPC',
  21: 'PowerPC64',
  40: 'ARM',
  62: 'x86_64',
  183: 'AArch64',
  243: 'RISC-V'
};

export interface ElfHeader {
  architecture: string;
  bits: 32 | 64;
  littleEndian: boolean;
  entryPoint: bigint;
  machineCode: number;
}

export class ElfProvider {
  public static readonly providerId = 'provider.elf';
  public static readonly supportedArtifacts = ['ELF', 'SO'];

  public async inspectBinary(binaryPath: string): Promise<{ header: ElfHeader; symbols: string[] }> {
    const { readFile } = await import('node:fs/promises');
    const data = await readFile(binaryPath);

    if (data.length < 64 || data.readUInt32LE(0) !== ELF_MAGIC) {
      throw new OpenRevError({
        code: OpenRevErrorCode.INVALID_APK,
        message: `Not a valid ELF binary: ${binaryPath}`,
        context: { binaryPath }
      });
    }

    const eiClass = data[4];
    const eiData = data[5];
    if (eiClass !== 1 && eiClass !== 2) {
      throw new OpenRevError({
        code: OpenRevErrorCode.INVALID_APK,
        message: `Unknown ELF class byte ${eiClass}`,
        context: { binaryPath }
      });
    }
    const bits: 32 | 64 = eiClass === 1 ? 32 : 64;
    const littleEndian = eiData === 1;
    const machineCode = data.readUInt16LE(18);

    const header: ElfHeader = {
      architecture: EM_MACHINE[machineCode] ?? `machine_0x${machineCode.toString(16)}`,
      bits,
      littleEndian,
      entryPoint: littleEndian
        ? bits === 64
          ? data.readBigUInt64LE(24)
          : BigInt(data.readUInt32LE(24))
        : bits === 64
          ? data.readBigUInt64BE(24)
          : BigInt(data.readUInt32BE(24)),
      machineCode
    };

    return { header, symbols: [] };
  }
}
