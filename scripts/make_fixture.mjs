import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { deflateRawSync, inflateRawSync, crc32 } from 'node:zlib';
import { join, dirname } from 'node:path';

const SRC_APK = 'C:/Users/DELL/Documents/antigravity/stitch_two_rings_flutter_frontend/build/app/outputs/apk/debug/app-debug.apk';
const OUT = join('tests', 'fixtures', 'FixtureApp.apk');

const zipBuf = await readFile(SRC_APK);
const srcEocd = zipBuf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
const cdOffset = zipBuf.readUInt32LE(srcEocd + 16);
const cdEntries = zipBuf.readUInt16LE(srcEocd + 10);
const centralDir = zipBuf.subarray(cdOffset);

const entries = new Map();
for (let i = 0, pos = cdOffset; i < cdEntries; i++) {
  const sig = centralDir.readUInt32LE(pos - cdOffset);
  if (sig !== 0x02014b50) break;
  const nameLen = centralDir.readUInt16LE(pos - cdOffset + 28);
  const extraLen = centralDir.readUInt16LE(pos - cdOffset + 30);
  const commentLen = centralDir.readUInt16LE(pos - cdOffset + 32);
  const localOffset = centralDir.readUInt32LE(pos - cdOffset + 42);
  const method = centralDir.readUInt16LE(pos - cdOffset + 10);
  const compSize = centralDir.readUInt32LE(pos - cdOffset + 20);
  const name = centralDir.subarray(pos - cdOffset + 46, pos - cdOffset + 46 + nameLen).toString();
  entries.set(name, { name, localOffset, method, compSize });
  pos += 46 + nameLen + extraLen + commentLen;
}

async function readEntry(name) {
  const { localOffset, method, compSize } = entries.get(name);
  const lh = zipBuf.subarray(localOffset);
  const nameLen = lh.readUInt16LE(26);
  const extraLen = lh.readUInt16LE(28);
  const raw = zipBuf.subarray(localOffset + 30 + nameLen + extraLen, localOffset + 30 + nameLen + extraLen + compSize);
  return method === 8 ? inflateRawSync(raw) : raw;
}

function makeEntry(name, data, compress = true) {
  const nameBuf = Buffer.from(name);
  const stored = compress ? deflateRawSync(data) : data;
  const method = compress ? 8 : 0;
  const crc = crc32(data) >>> 0;
  const localHeader = Buffer.alloc(30);
  localHeader.writeUInt32LE(0x04034b50, 0);
  localHeader.writeUInt16LE(20, 4);
  localHeader.writeUInt16LE(0x0800, 6);
  localHeader.writeUInt16LE(method, 8);
  localHeader.writeUInt16LE(0, 10);
  localHeader.writeUInt16LE(0, 12);
  localHeader.writeUInt32LE(crc, 14);
  localHeader.writeUInt32LE(stored.length, 18);
  localHeader.writeUInt32LE(data.length, 22);
  localHeader.writeUInt16LE(nameBuf.length, 26);
  localHeader.writeUInt16LE(0, 28);
  return {
    local: Buffer.concat([localHeader, nameBuf, stored]),
    central: {
      crc, method, storedLen: stored.length, dataLen: data.length, nameBuf
    }
  };
}

const mf = await readEntry('AndroidManifest.xml');
const resArsc = await readEntry('resources.arsc');

const chunks = [];
const centralChunks = [];
const offsets = [];

const all = [
  ['AndroidManifest.xml', mf],
  ['resources.arsc', resArsc],
  ['classes.dex', Buffer.from([0x64, 0x65, 0x78, 0x0a, 0x30, 0x33, 0x35, 0x00])],
  ['META-INF/MANIFEST.MF', Buffer.from('Manifest-Version: 1.0\r\n\r\n')]
];

for (const [name, data] of all) {
  const entry = makeEntry(name, data);
  offsets.push(chunks.reduce((s, c) => s + c.length, 0));
  chunks.push(entry.local);
  centralChunks.push(entry.central);
}

const centralStart = chunks.reduce((s, c) => s + c.length, 0);

centralChunks.forEach((c, i) => {
  const buf = Buffer.alloc(46 + c.nameBuf.length);
  buf.writeUInt32LE(0x02014b50, 0);
  buf.writeUInt16LE(20, 4);
  buf.writeUInt16LE(20, 6);
  buf.writeUInt16LE(0x0800, 8);
  buf.writeUInt16LE(c.method, 10);
  buf.writeUInt16LE(0, 12);
  buf.writeUInt16LE(0, 14);
  buf.writeUInt32LE(c.crc, 16);
  buf.writeUInt32LE(c.storedLen, 20);
  buf.writeUInt32LE(c.dataLen, 24);
  buf.writeUInt16LE(c.nameBuf.length, 28);
  buf.writeUInt16LE(0, 30);
  buf.writeUInt16LE(0, 32);
  buf.writeUInt16LE(0, 34);
  buf.writeUInt16LE(0, 36);
  buf.writeUInt32LE(0, 38);
  buf.writeUInt32LE(offsets[i], 42);
  c.nameBuf.copy(buf, 46);
  chunks.push(buf);
});

const eocdBuf = Buffer.alloc(22);
eocdBuf.writeUInt32LE(0x06054b50, 0);
eocdBuf.writeUInt16LE(0, 4);
eocdBuf.writeUInt16LE(0, 6);
eocdBuf.writeUInt16LE(all.length, 8);
eocdBuf.writeUInt16LE(all.length, 10);
eocdBuf.writeUInt32LE(chunks.length ? chunks.reduce((s, c) => s + c.length, 0) - centralStart : 0, 12);
eocdBuf.writeUInt32LE(centralStart, 16);
eocdBuf.writeUInt16LE(0, 20);
chunks.push(eocdBuf);

const out = Buffer.concat(chunks);
await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, out);
console.log('Fixture written:', OUT, out.length, 'bytes,', all.length, 'entries');
