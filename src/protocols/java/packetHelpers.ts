export function writeVarInt(value: number): Buffer {
  const bytes: number[] = [];
  do {
    let temp = value & 0x7F;
    value >>>= 7;
    if (value !== 0) temp |= 0x80;
    bytes.push(temp);
  } while (value !== 0);
  return Buffer.from(bytes);
}

export function readVarInt(buffer: Buffer, offset = 0): { value: number; size: number } {
  let result = 0, shift = 0, position = offset, byte: number;
  do {
    if (position >= buffer.length) throw new Error('Insufficient buffer to read VarInt');
    byte = buffer[position++];
    result |= (byte & 0x7F) << shift;
    shift += 7;
    if (shift > 35) throw new Error('VarInt is too big');
  } while (byte & 0x80);
  return { value: result, size: position - offset };
}

export function createPacket(data: Buffer): Buffer {
  const length = writeVarInt(data.length);
  return Buffer.concat([length, data]);
}

export function parseDescription(desc: any): string {
  if (typeof desc === 'string') return desc;
  if (desc?.text) return desc.text;
  if (Array.isArray(desc?.extra)) {
    return desc.extra.map((e: any) => e?.text || '').join(' ').trim();
  }
  return '';
}
