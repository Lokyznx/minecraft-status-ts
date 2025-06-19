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
  latencia?: number;
}

interface MinecraftStatusResponse {
  version: { name: string };
  players: { online: number; max: number };
  description: string | { text?: string; extra?: { text?: string }[] };
  favicon?: string;
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
  let result = 0, shift = 0, position = offset, byte: number;
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
  if (Array.isArray(desc?.extra)) {
    return desc.extra.map((e: any) => e?.text || '').join(' ').trim();
  }
  return '';
}

// --- Error Customizado ---
export class MinecraftQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MinecraftQueryError';
  }
}

// --- Função Principal ---
export async function consultarServidorJava(
  host: string,
  port = 25565,
  options: { timeout?: number; protocolVersion?: number } = {}
): Promise<ServidorStatus> {
  const { timeout = 5000, protocolVersion = 770 } = options;

  if (typeof host !== 'string' || !host.length) throw new MinecraftQueryError('Host inválido');
  if (typeof port !== 'number' || port <= 0 || port > 65535) throw new MinecraftQueryError('Porta inválida');

  return new Promise<ServidorStatus>((resolve, reject) => {
    const socket = new net.Socket();
    let erro = false;
    let responseBuffer = Buffer.alloc(0);

    let statusParcial: Omit<ServidorStatus, 'latencia' | 'online'> | null = null;
    let pingEnviadoEm: bigint | null = null;

    socket.setTimeout(timeout);

    socket.connect(port, host, () => {
      const hostBuffer = Buffer.from(host, 'utf8');
      const portBuffer = Buffer.alloc(2);
      portBuffer.writeUInt16BE(port, 0);

      const handshakeData = Buffer.concat([
        writeVarInt(0x00),
        writeVarInt(protocolVersion),
        writeVarInt(hostBuffer.length),
        hostBuffer,
        portBuffer,
        writeVarInt(1)
      ]);

      socket.write(createPacket(handshakeData));
      socket.write(createPacket(Buffer.from([0x00])));
    });

    socket.on('data', (data) => {
      responseBuffer = Buffer.concat([responseBuffer, data]);
      try {
        if (!statusParcial) {
          const { value: packetLength, size: lengthSize } = readVarInt(responseBuffer);
          if (responseBuffer.length < packetLength + lengthSize) return;

          const packetData = responseBuffer.slice(lengthSize, lengthSize + packetLength);
          const { value: packetID, size: idSize } = readVarInt(packetData);

          if (packetID === 0x00) {
            const { value: stringLength, size: strLenSize } = readVarInt(packetData, idSize);

            const jsonStart = idSize + strLenSize;
            const jsonEnd = jsonStart + stringLength;
            if (packetData.length < jsonEnd) {
              throw new MinecraftQueryError('Pacote de status incompleto');
            }

            const jsonString = packetData.slice(jsonStart, jsonEnd).toString('utf8');

            let json: MinecraftStatusResponse;
            try {
              json = JSON.parse(jsonString) as MinecraftStatusResponse;
            } catch {
              throw new MinecraftQueryError('Resposta JSON inválida');
            }

            if (!json.version?.name || !json.players) {
              throw new MinecraftQueryError('Resposta do servidor mal formatada');
            }

            statusParcial = {
              host,
              port,
              versao: json.version.name,
              jogadoresOnline: json.players.online,
              jogadoresMax: json.players.max,
              descricao: parseDescription(json.description),
              favicon: json.favicon || null
            };

            pingEnviadoEm = process.hrtime.bigint();
            const pingPayload = Buffer.alloc(8);
            pingPayload.writeBigInt64BE(pingEnviadoEm, 0);

            socket.write(createPacket(Buffer.concat([Buffer.from([0x01]), pingPayload])));

            responseBuffer = responseBuffer.slice(lengthSize + packetLength);
          }
        }

        if (statusParcial && responseBuffer.length > 0) {
          const { value: packetLength, size: lengthSize } = readVarInt(responseBuffer);
          if (responseBuffer.length < packetLength + lengthSize) return;

          const packetData = responseBuffer.slice(lengthSize, lengthSize + packetLength);
          const { value: packetID } = readVarInt(packetData);

          if (packetID === 0x01) {
            if (packetData.length < 9) {
              throw new MinecraftQueryError('Pacote Pong inválido');
            }

            const pongPayload = packetData.readBigInt64BE(1);
            if (pingEnviadoEm === pongPayload) {
              const latenciaNs = process.hrtime.bigint() - pingEnviadoEm;
              const latenciaMs = Number(latenciaNs / 1000000n);

              resolve({ ...statusParcial, online: true, latencia: latenciaMs });
              socket.end();
            }
          }

          responseBuffer = responseBuffer.slice(lengthSize + packetLength);
        }
      } catch (err: any) {
        if (err.message.includes('Buffer insuficiente')) return;
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
      if (!erro && !statusParcial) {
        resolve({ online: false, host, port });
      }
    });
  });
                }
