import net from 'net';

// --- Tipos ---
export interface ServidorStatus {
  online: boolean;
  host: string;
  port: number;
  versao?: string;
  jogadoresOnline?: number;
  jogadoresMax?: number;
  descricao?: string;
  favicon?: string | null;
}

// --- Helpers ---
function writeVarInt(value: number): Buffer {
  const bytes: number[] = [];
  do {
    let temp = value & 0x7F;
    value >>>= 7;
    if (value !== 0) temp |= 0x80;
    bytes.push(temp);
  } while (value !== 0);
  return Buffer.from(bytes);
}

function readVarInt(buffer: Buffer, offset = 0): { value: number; size: number } {
  let result = 0,
    shift = 0,
    position = offset,
    byte: number;
  do {
    if (position >= buffer.length) throw new Error('Buffer insuficiente para ler VarInt');
    byte = buffer[position++];
    result |= (byte & 0x7F) << shift;
    shift += 7;
    if (shift > 35) throw new Error('VarInt muito grande');
  } while (byte & 0x80);
  return { value: result, size: position - offset };
}

function createPacket(data: Buffer): Buffer {
  const length = writeVarInt(data.length);
  return Buffer.concat([length, data]);
}

function parseDescription(desc: any): string {
  if (typeof desc === 'string') return desc;
  if (desc?.text) return desc.text;
  if (Array.isArray(desc?.extra)) return desc.extra.map((e: any) => e.text).join(' ');
  return '';
}

// --- Custom error class ---
export class MinecraftQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MinecraftQueryError';
  }
}

// --- Função principal ---
export async function consultarServidorJava(
  host: string,
  port = 25565,
  timeout = 5000
): Promise<ServidorStatus> {
  if (typeof host !== 'string' || !host.length) throw new MinecraftQueryError('Host inválido');
  if (typeof port !== 'number' || port <= 0 || port > 65535) throw new MinecraftQueryError('Porta inválida');

  return new Promise<ServidorStatus>((resolve, reject) => {
    const socket = new net.Socket();
    let erro = false;
    let responseBuffer = Buffer.alloc(0);

    socket.setTimeout(timeout);

    socket.connect(port, host, () => {
      const protocolVersion = 770; // Protocolo Minecraft 1.20.4
      const hostBuffer = Buffer.from(host, 'utf8');
      const portBuffer = Buffer.alloc(2);
      portBuffer.writeUInt16BE(port, 0);

      const handshakeData = Buffer.concat([
        writeVarInt(0x00), // Packet ID handshake
        writeVarInt(protocolVersion),
        writeVarInt(hostBuffer.length),
        hostBuffer,
        portBuffer,
        writeVarInt(1) // Next state: status
      ]);

      const handshakePacket = createPacket(handshakeData);
      const requestPacket = createPacket(Buffer.from([0x00]));

      socket.write(handshakePacket);
      socket.write(requestPacket);
    });

    socket.on('data', (data) => {
      responseBuffer = Buffer.concat([responseBuffer, data]);
      try {
        const { value: packetLength, size: lengthSize } = readVarInt(responseBuffer, 0);
        if (responseBuffer.length < packetLength + lengthSize) return; // aguarda mais dados

        const { value: packetID, size: idSize } = readVarInt(responseBuffer, lengthSize);
        if (packetID !== 0x00) throw new MinecraftQueryError(`ID do pacote inesperado: ${packetID}`);

        const { value: stringLength, size: strLenSize } = readVarInt(responseBuffer, lengthSize + idSize);
        const jsonStart = lengthSize + idSize + strLenSize;
        const jsonEnd = jsonStart + stringLength;

        if (responseBuffer.length < jsonEnd) return; // aguarda mais dados

        const jsonString = responseBuffer.slice(jsonStart, jsonEnd).toString('utf8');
        const json = JSON.parse(jsonString);

        socket.end();
        resolve({
          online: true,
          host,
          port,
          versao: json.version.name,
          jogadoresOnline: json.players.online,
          jogadoresMax: json.players.max,
          descricao: parseDescription(json.description),
          favicon: json.favicon || null
        });
      } catch (err: any) {
        if (err.message.includes('Buffer insuficiente')) return; // espera mais dados
        erro = true;
        socket.destroy();
        reject(err instanceof MinecraftQueryError ? err : new MinecraftQueryError(err.message));
      }
    });

    socket.on('error', (err) => {
      erro = true;
      socket.destroy();
      reject(new MinecraftQueryError('Erro na conexão: ' + err.message));
    });

    socket.on('timeout', () => {
      erro = true;
      socket.destroy();
      reject(new MinecraftQueryError('Timeout na conexão'));
    });

    socket.on('close', () => {
      if (!erro) {
        resolve({
          online: false,
          host,
          port
        });
      }
    });
  });
}
