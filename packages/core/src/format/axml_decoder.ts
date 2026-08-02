/**
 * OpenRev Binary Android XML (AXML) Decoder
 *
 * Decodes the binary AndroidManifest.xml format (AXML) found inside APK files.
 * This is a from-scratch implementation of the AXML chunk format, not a wrapper
 * around any external tool. It supports string pools (UTF-8 and UTF-16),
 * resource map chaining, namespaces, and typed attribute values.
 *
 * Node-only: operates on Buffer via dynamic import.
 */

import { OpenRevError, OpenRevErrorCode } from '../errors/openrev_error.ts';

const CHUNK_STRING_POOL = 0x0001;
const CHUNK_XML = 0x0003;
const CHUNK_RESOURCE_MAP = 0x0180;
const CHUNK_NAMESPACE_START = 0x0100;
const CHUNK_NAMESPACE_END = 0x0101;
const CHUNK_ELEMENT_START = 0x0102;
const CHUNK_ELEMENT_END = 0x0103;
const CHUNK_CDATA = 0x0104;

const TYPE_STRING = 0x03;
const TYPE_INT = 0x10;
const TYPE_INT_BOOLEAN = 0x12;
const TYPE_REFERENCE = 0x01;
const TYPE_ATTRIBUTE = 0x02;
const TYPE_FLOAT = 0x04;
const TYPE_DIMENSION = 0x05;
const TYPE_FRACTION = 0x06;
const TYPE_DYNAMIC_REFERENCE = 0x07;

export interface XmlAttribute {
  name: string;
  namespace?: string;
  value?: string;
  valueType: number;
  rawValue?: number;
  resourceId?: number;
}

export interface XmlElement {
  tag: string;
  namespace?: string;
  attributes: XmlAttribute[];
  children: XmlElement[];
  text?: string;
}

export interface DecodedXml {
  root: XmlElement;
}

export class AxmlDecoder {
  private data: Buffer;
  private offset = 0;
  private stringPool: { strings: string[]; utf8: boolean } | null = null;
  private resourceMap: number[] = [];

  private constructor(data: Buffer) {
    this.data = data;
  }

  public static decode(data: Buffer): DecodedXml {
    const decoder = new AxmlDecoder(data);
    return decoder.run();
  }

  private run(): DecodedXml {
    this.parseChunks();
    if (!this.stringPool) {
      throw new OpenRevError({
        code: 'INVALID_APK',
        message: 'AXML string pool chunk missing',
      });
    }
    if (!this.rootElement) {
      throw new OpenRevError({
        code: 'INVALID_APK',
        message: 'AXML document contains no root element',
      });
    }
    return { root: this.rootElement };
  }

  private rootElement: XmlElement | null = null;
  private elementStack: XmlElement[] = [];

  private parseChunks(): void {
    const header = this.readU16();
    if (header !== CHUNK_XML) {
      throw new OpenRevError({
        code: 'INVALID_APK',
        message: `Not a binary XML document (header 0x${header.toString(16)})`,
      });
    }
    const headerSize = this.readU16();
    const totalSize = this.readU32();
    if (totalSize > this.data.length) {
      throw new OpenRevError({
        code: 'INVALID_APK',
        message: `AXML declares size ${totalSize} but buffer is ${this.data.length}`,
      });
    }

    while (this.offset < totalSize && this.offset < this.data.length) {
      const chunkType = this.readU16();
      const chunkHeaderSize = this.readU16();
      const chunkSize = this.readU32();
      const chunkStart = this.offset - 8;
      if (chunkSize === 0 || chunkStart + chunkSize > this.data.length) {
        break;
      }
      const chunkEnd = chunkStart + chunkSize;

      switch (chunkType) {
        case CHUNK_STRING_POOL:
          this.parseStringPool(chunkStart, chunkEnd);
          break;
        case CHUNK_RESOURCE_MAP:
          this.parseResourceMap(chunkEnd);
          break;
        case CHUNK_NAMESPACE_START:
          break;
        case CHUNK_NAMESPACE_END:
          break;
        case CHUNK_ELEMENT_START:
          this.parseElementStart();
          break;
        case CHUNK_ELEMENT_END:
          this.parseElementEnd();
          break;
        case CHUNK_CDATA:
          this.parseCData();
          break;
        default:
          break;
      }

      this.offset = Math.min(totalSize, chunkEnd);
    }
  }

  private parseStringPool(chunkStart: number, chunkEnd: number): void {
    const stringCount = this.readU32();
    const styleCount = this.readU32();
    const flags = this.readU32();
    const stringsStart = this.readU32();
    const stylesStart = this.readU32();

    const utf8 = (flags & 0x100) !== 0;
    const offsets: number[] = [];
    for (let i = 0; i < stringCount; i++) {
      offsets.push(this.readU32());
    }
    const stringsBase = chunkStart + stringsStart;
    const strings: string[] = [];
    for (let i = 0; i < stringCount; i++) {
      const strOffset = stringsBase + offsets[i];
      if (strOffset >= this.data.length) {
        strings.push('');
        continue;
      }
      const saved = this.offset;
      this.offset = strOffset;
      strings.push(utf8 ? this.readUtf8String() : this.readUtf16String());
      this.offset = saved;
    }

    this.stringPool = { strings, utf8 };
    this.offset = chunkEnd;
  }

  private readUtf8String(): string {
    let length = this.data[this.offset++];
    if ((length & 0x80) !== 0) {
      length = ((length & 0x7f) << 8) | this.data[this.offset++];
    }
    let byteLength = this.data[this.offset++];
    if ((byteLength & 0x80) !== 0) {
      byteLength = ((byteLength & 0x7f) << 8) | this.data[this.offset++];
    }
    const str = this.data.subarray(this.offset, this.offset + byteLength).toString('utf8');
    this.offset += byteLength;
    return str;
  }

  private readUtf16String(): string {
    let length = this.readU16();
    if ((length & 0x8000) !== 0) {
      length = ((length & 0x7fff) << 16) | this.readU16();
    }
    const bytes = length * 2;
    const str = this.data.subarray(this.offset, this.offset + bytes).toString('utf16le');
    this.offset += bytes;
    this.offset += 2; // null terminator
    return str;
  }

  private parseResourceMap(chunkEnd: number): void {
    const count = (chunkEnd - this.offset) / 4;
    for (let i = 0; i < count; i++) {
      this.resourceMap.push(this.readU32());
    }
  }

  private parseElementStart(): void {
    const lineNumber = this.readU32();
    const commentIdx = this.readU32();
    const nsIdx = this.readU32();
    const nameIdx = this.readU32();
    const attributeStart = this.readU16();
    const attributeSize = this.readU16();
    const attributeCount = this.readU16();
    this.readU16(); // idIndex
    this.readU16(); // classIndex
    this.readU16(); // styleIndex

    const ns = this.stringPool ? this.stringPool.strings[nsIdx] : undefined;
    const name = this.stringPool ? this.stringPool.strings[nameIdx] : '';

    const element: XmlElement = { tag: name, attributes: [], children: [] };
    if (ns) element.namespace = ns;

    const base = this.offset;
    for (let i = 0; i < attributeCount; i++) {
      const attrOffset = base + i * attributeSize;
      const saved = this.offset;
      this.offset = attrOffset;
      const attrNsIdx = this.readU32();
      const attrNameIdx = this.readU32();
      const rawValueIdx = this.readU32();
      const valueType = (this.readU32() >> 24) & 0xff;
      const typedValue = this.readU32();
      this.offset = saved;

      const attrName = this.stringPool ? this.stringPool.strings[attrNameIdx] : '';
      const attrNs = attrNsIdx !== 0xffffffff && this.stringPool ? this.stringPool.strings[attrNsIdx] : undefined;
      const rawValue = rawValueIdx !== 0xffffffff && this.stringPool ? this.stringPool.strings[rawValueIdx] : undefined;

      const attr: XmlAttribute = {
        name: attrName,
        namespace: attrNs,
        valueType,
        resourceId: this.resourceMap[i]
      };
      if (rawValue !== undefined) {
        attr.value = rawValue;
      } else {
        const decoded = this.decodeTypedValue(valueType, typedValue);
        if (decoded !== undefined) attr.value = decoded;
        attr.rawValue = typedValue;
      }
      element.attributes.push(attr);
    }
    this.offset = base + attributeCount * attributeSize;

    if (this.elementStack.length === 0) {
      this.rootElement = element;
    } else {
      const parent = this.elementStack[this.elementStack.length - 1];
      parent.children.push(element);
    }
    this.elementStack.push(element);
  }

  private parseElementEnd(): void {
    this.elementStack.pop();
  }

  private parseCData(): void {
    const lineNumber = this.readU32();
    const commentIdx = this.readU32();
    const dataIdx = this.readU32();
    const valueType = this.readU32();
    const value = this.readU32();
    if (this.elementStack.length > 0 && this.stringPool) {
      const text = this.stringPool.strings[dataIdx];
      if (text) {
        this.elementStack[this.elementStack.length - 1].text = text;
      }
    }
  }

  private decodeTypedValue(type: number, value: number): string | undefined {
    switch (type) {
      case TYPE_STRING:
        return this.stringPool ? this.stringPool.strings[value] : undefined;
      case TYPE_INT:
      case TYPE_ATTRIBUTE:
      case TYPE_REFERENCE:
      case TYPE_DYNAMIC_REFERENCE:
        return value.toString();
      case TYPE_INT_BOOLEAN:
        return value !== 0 ? 'true' : 'false';
      case TYPE_FLOAT: {
        const buf = Buffer.alloc(4);
        buf.writeUInt32LE(value, 0);
        const f = buf.readFloatLE(0);
        return Number.isInteger(f) ? f.toString() : f.toPrecision(6);
      }
      case TYPE_DIMENSION:
        return this.decodeDimension(value);
      case TYPE_FRACTION:
        return this.decodeFraction(value);
      default:
        return undefined;
    }
  }

  private decodeDimension(value: number): string {
    const unit = value & 0xff;
    const mantissa = (value >> 8) & 0xffffff;
    const units = ['px', 'dp', 'sp', 'pt', 'in', 'mm'];
    return `${mantissa}${units[unit] ?? '?'}`;
  }

  private decodeFraction(value: number): string {
    const unit = value & 0xff;
    const mantissa = (value >> 8) & 0xffffff;
    const units = ['%', '%p'];
    return `${mantissa}${units[unit] ?? '?'}`;
  }

  private readU16(): number {
    const v = this.data.readUInt16LE(this.offset);
    this.offset += 2;
    return v;
  }

  private readU32(): number {
    const v = this.data.readUInt32LE(this.offset);
    this.offset += 4;
    return v;
  }
}
