import dgram from 'dgram';
import { BedrockServerStatus } from './types';

// Classe de erro personalizada para manter o padrão do projeto
export class MinecraftQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MinecraftQueryError';
  }
}

// Pacote "Unconnected Ping" que o servidor Bedrock espera
// 0x01 (ID do Ping) + Timestamp (8 bytes) + Magic (16 bytes) + Client GUID (8 bytes, opcional)
const requestPacket = Buffer.from([
  0x01,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // Timestamp (pode ser qualquer coisa)
  0x00, 0xff, 0xff, 0x00, 0xfe, 0xfe, 0xfe, 0xfe, // Magic bytes
  0xfd, 0xfd, 0xfd, 0xfd, 0x12, 0x34, 0x56, 0x78
]);

export async function queryBedrockServer(
  host: string,
  port = 19132, // Porta padrão do Bedrock
  options: { timeout?: number } = {}
): Promise<BedrockServerStatus> {
  const { timeout = 5000 } = options;

  if (typeof host !== 'string' || !host.length) {
    throw new MinecraftQueryError('Invalid host');
  }
  if (typeof port !== 'number' || port <= 0 || port > 65535) {
    throw new MinecraftQueryError('Invalid port');
  }

  return new Promise<BedrockServerStatus>((resolve, reject) => {
    const socket = dgram.createSocket('udp4');
    let timeoutHandle: NodeJS.Timeout | null = null;
    const startTime = process.hrtime.bigint();

    // Função para limpar tudo (socket e timeout)
    const cleanup = () => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        timeoutHandle = null;
      }
      socket.close();
    };

    // Configura o timeout
    timeoutHandle = setTimeout(() => {
      cleanup();
      reject(new MinecraftQueryError('Connection timeout'));
    }, timeout);
    
    // Evento de erro no socket
    socket.on('error', (err) => {
      cleanup();
      reject(new MinecraftQueryError('Socket error: ' + err.message));
    });

    // Evento que recebe a resposta do servidor
    socket.on('message', (msg) => {
      cleanup();
      const latency = Number(process.hrtime.bigint() - startTime) / 1_000_000;

      // O primeiro byte da resposta é 0x1c (ID da resposta)
      if (msg.length > 35 && msg[0] === 0x1c) {
        // Remove o ID (1 byte) e o timestamp (8 bytes) e o Server GUID (8 bytes)
        const responseStr = msg.slice(35).toString('utf-8');
        const parts = responseStr.split(';');

        if (parts.length >= 8) {
          resolve({
            online: true,
            host,
            port,
            edition: parts[0],
            motd: parts[1],
            protocol: parseInt(parts[2], 10),
            version: parts[3],
            playersOnline: parseInt(parts[4], 10),
            playersMax: parseInt(parts[5], 10),
            serverId: parts[6],
            gameMode: parts[8],
            latency: Math.round(latency)
          });
        } else {
          reject(new MinecraftQueryError('Invalid response format from server'));
        }
      } else {
        reject(new MinecraftQueryError('Invalid response packet'));
      }
    });

    // Envia o pacote de consulta
    socket.send(requestPacket, port, host, (err) => {
      if (err) {
        cleanup();
        reject(new MinecraftQueryError('Failed to send packet: ' + err.message));
      }
    });
  });
}
