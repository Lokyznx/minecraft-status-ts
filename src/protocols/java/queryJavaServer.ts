import net from 'net';
import { createPacket, readVarInt, writeVarInt, parseDescription } from './packetHelpers';
import { JavaServerStatus, MinecraftJavaStatusResponse } from './types';

export class MinecraftQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MinecraftQueryError';
  }
}

export async function queryJavaServer(
  host: string,
  port = 25565,
  options: { timeout?: number; protocolVersion?: number } = {}
): Promise<JavaServerStatus> {
  const { timeout = 5000, protocolVersion = 770 } = options;

  return new Promise<JavaServerStatus>((resolve, reject) => {
    const socket = new net.Socket();
    let errored = false;
    let responseBuffer = Buffer.alloc(0);
    let partialStatus: Omit<JavaServerStatus, 'latency' | 'online'> | null = null;
    let pingSentAt: bigint | null = null;

    const cleanup = () => { if (!socket.destroyed) socket.destroy(); };

    socket.setTimeout(timeout, () => {
      errored = true;
      cleanup();
      reject(new MinecraftQueryError('Connection timeout'));
    });

    socket.on('error', (err) => {
      errored = true;
      cleanup();
      reject(new MinecraftQueryError('Connection error: ' + err.message));
    });

    socket.on('close', () => {
      if (!errored && !partialStatus) resolve({ online: false, host, port });
    });

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
        if (!partialStatus) {
          const varIntResult = readVarInt(responseBuffer);
          const packetLength = varIntResult.value;
          if (responseBuffer.length < packetLength + varIntResult.size) return;

          const packetData = responseBuffer.slice(varIntResult.size, varIntResult.size + packetLength);
          const packetIdResult = readVarInt(packetData);

          if (packetIdResult.value === 0x00) {
            const jsonStrResult = readVarInt(packetData, packetIdResult.size);
            const jsonStart = packetIdResult.size + jsonStrResult.size;
            const jsonString = packetData.slice(jsonStart).toString('utf8');
            const json: MinecraftJavaStatusResponse = JSON.parse(jsonString);

            // ALTERAÇÃO AQUI: Converte o favicon para Buffer
            let faviconBuffer: Buffer | null = null;
            if (json.favicon) {
              const base64Data = json.favicon.replace(/^data:image\/png;base64,/, '');
              faviconBuffer = Buffer.from(base64Data, 'base64');
            }

            partialStatus = {
              host, port,
              version: json.version.name,
              playersOnline: json.players.online,
              playersMax: json.players.max,
              description: parseDescription(json.description),
              favicon: json.favicon || null,
              faviconBuffer: faviconBuffer
            };

            pingSentAt = process.hrtime.bigint();
            const pingPayload = Buffer.alloc(8);
            pingPayload.writeBigInt64BE(pingSentAt, 0);
            socket.write(createPacket(Buffer.concat([Buffer.from([0x01]), pingPayload])));
            responseBuffer = responseBuffer.slice(varIntResult.size + packetLength);
          }
        }

        if (partialStatus && responseBuffer.length > 0) {
          const varIntResult = readVarInt(responseBuffer);
          if (responseBuffer.length < varIntResult.value + varIntResult.size) return;

          const packetData = responseBuffer.slice(varIntResult.size, varIntResult.size + varIntResult.value);
          if (readVarInt(packetData).value === 0x01) {
            const pongPayload = packetData.readBigInt64BE(1);
            if (pingSentAt === pongPayload) {
              const latencyNs = process.hrtime.bigint() - pingSentAt;
              resolve({ ...partialStatus, online: true, latency: Number(latencyNs / 1000000n) });
              cleanup();
            }
          }
        }
      } catch (err: any) {
        if (err.message.includes('Insufficient buffer')) return;
        errored = true;
        cleanup();
        reject(err instanceof MinecraftQueryError ? err : new MinecraftQueryError(err.message));
      }
    });
  });
}
