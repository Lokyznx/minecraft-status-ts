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

  if (typeof host !== 'string' || !host.length) {
    throw new MinecraftQueryError('Invalid host');
  }
  if (typeof port !== 'number' || port <= 0 || port > 65535) {
    throw new MinecraftQueryError('Invalid port');
  }

  return new Promise<JavaServerStatus>((resolve, reject) => {
    const socket = new net.Socket();
    let errored = false;
    let responseBuffer = Buffer.alloc(0);

    let partialStatus: Omit<JavaServerStatus, 'latency' | 'online'> | null = null;
    let pingSentAt: bigint | null = null;

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
        if (!partialStatus) {
          const { value: packetLength, size: lengthSize } = readVarInt(responseBuffer);
          if (responseBuffer.length < packetLength + lengthSize) return;

          const packetData = responseBuffer.slice(lengthSize, lengthSize + packetLength);
          const { value: packetID, size: idSize } = readVarInt(packetData);

          if (packetID === 0x00) {
            const { value: stringLength, size: strLenSize } = readVarInt(packetData, idSize);

            const jsonStart = idSize + strLenSize;
            const jsonEnd = jsonStart + stringLength;
            if (packetData.length < jsonEnd) {
              throw new MinecraftQueryError('Incomplete status packet');
            }

            const jsonString = packetData.slice(jsonStart, jsonEnd).toString('utf8');

            let json: MinecraftJavaStatusResponse;
            try {
              json = JSON.parse(jsonString) as MinecraftJavaStatusResponse;
            } catch {
              throw new MinecraftQueryError('Invalid JSON response');
            }

            if (!json.version?.name || !json.players) {
              throw new MinecraftQueryError('Malformed server response');
            }

            partialStatus = {
              host,
              port,
              version: json.version.name,
              playersOnline: json.players.online,
              playersMax: json.players.max,
              description: parseDescription(json.description),
              favicon: json.favicon || null
            };

            pingSentAt = process.hrtime.bigint();
            const pingPayload = Buffer.alloc(8);
            pingPayload.writeBigInt64BE(pingSentAt, 0);

            socket.write(createPacket(Buffer.concat([Buffer.from([0x01]), pingPayload])));

            responseBuffer = responseBuffer.slice(lengthSize + packetLength);
          }
        }

        if (partialStatus && responseBuffer.length > 0) {
          const { value: packetLength, size: lengthSize } = readVarInt(responseBuffer);
          if (responseBuffer.length < packetLength + lengthSize) return;

          const packetData = responseBuffer.slice(lengthSize, lengthSize + packetLength);
          const { value: packetID } = readVarInt(packetData);

          if (packetID === 0x01) {
            if (packetData.length < 9) {
              throw new MinecraftQueryError('Invalid Pong packet');
            }

            const pongPayload = packetData.readBigInt64BE(1);
            if (pingSentAt === pongPayload) {
              const latencyNs = process.hrtime.bigint() - pingSentAt;
              const latencyMs = Number(latencyNs / 1000000n);

              resolve({ ...partialStatus, online: true, latency: latencyMs });
              socket.end();
            }
          }

          responseBuffer = responseBuffer.slice(lengthSize + packetLength);
        }
      } catch (err: any) {
        if (err.message.includes('Insufficient buffer')) return;
        errored = true;
        socket.destroy();
        reject(err instanceof MinecraftQueryError ? err : new MinecraftQueryError(err.message));
      }
    });

    socket.on('error', (err) => {
      errored = true;
      socket.destroy();
      reject(new MinecraftQueryError('Connection error: ' + err.message));
    });

    socket.on('timeout', () => {
      errored = true;
      socket.destroy();
      reject(new MinecraftQueryError('Connection timeout'));
    });

    socket.on('close', () => {
      if (!errored && !partialStatus) {
        resolve({ online: false, host, port });
      }
    });
  });
        }
