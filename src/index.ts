import net from 'net';

// --- Tipos ---
// A interface foi atualizada para incluir a latência.
export interface ServidorStatus {
  online: boolean;
  host: string;
  port: number;
  versao?: string;
  jogadoresOnline?: number;
  jogadoresMax?: number;
  descricao?: string;
  favicon?: string | null;
  latencia?: number; // NOVO: Latência da conexão em milissegundos.
}

// --- Helpers (Funções Auxiliares) ---
// Estas funções não precisaram de alteração.
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

// --- Função principal (versão melhorada) ---
export async function consultarServidorJava(
  host: string,
  port = 25565,
  // NOVO: Parâmetros opcionais agrupados em um objeto para clareza e flexibilidade.
  options: { timeout?: number; protocolVersion?: number } = {}
): Promise<ServidorStatus> {
  // Define valores padrão para as opções.
  const { timeout = 5000, protocolVersion = 770 } = options;

  if (typeof host !== 'string' || !host.length) throw new MinecraftQueryError('Host inválido');
  if (typeof port !== 'number' || port <= 0 || port > 65535) throw new MinecraftQueryError('Porta inválida');

  return new Promise<ServidorStatus>((resolve, reject) => {
    const socket = new net.Socket();
    let erro = false;
    let responseBuffer = Buffer.alloc(0);

    // NOVO: Variáveis para controlar o estado da nossa "conversa" com o servidor.
    let statusParcial: Omit<ServidorStatus, 'latencia' | 'online'> | null = null;
    let pingEnviadoEm: bigint | null = null;

    socket.setTimeout(timeout);

    socket.connect(port, host, () => {
      const hostBuffer = Buffer.from(host, 'utf8');
      const portBuffer = Buffer.alloc(2);
      portBuffer.writeUInt16BE(port, 0);

      const handshakeData = Buffer.concat([
        writeVarInt(0x00), // Packet ID: Handshake
        writeVarInt(protocolVersion),
        writeVarInt(hostBuffer.length),
        hostBuffer,
        portBuffer,
        writeVarInt(1) // Próximo estado: Status
      ]);

      socket.write(createPacket(handshakeData));
      socket.write(createPacket(Buffer.from([0x00]))); // Packet ID: Status Request
    });

    socket.on('data', (data) => {
      responseBuffer = Buffer.concat([responseBuffer, data]);
      try {
        // Se ainda não recebemos o status, tentamos processar a resposta JSON.
        if (!statusParcial) {
          const { value: packetLength, size: lengthSize } = readVarInt(responseBuffer);
          if (responseBuffer.length < packetLength + lengthSize) return; // Aguarda mais dados.

          const packetData = responseBuffer.slice(lengthSize, lengthSize + packetLength);
          const { value: packetID, size: idSize } = readVarInt(packetData);

          if (packetID === 0x00) { // Resposta de Status
            const { value: stringLength, size: strLenSize } = readVarInt(packetData, idSize);
            const jsonString = packetData.slice(idSize + strLenSize).toString('utf8');
            const json = JSON.parse(jsonString);

            // Guarda o status parcial. Não finalizamos ainda!
            statusParcial = {
              host,
              port,
              versao: json.version.name,
              jogadoresOnline: json.players.online,
              jogadoresMax: json.players.max,
              descricao: parseDescription(json.description),
              favicon: json.favicon || null
            };

            // Agora, enviamos o pacote de Ping para medir a latência.
            pingEnviadoEm = process.hrtime.bigint(); // Usa tempo de alta precisão.
            const pingPayload = Buffer.alloc(8);
            pingPayload.writeBigInt64BE(pingEnviadoEm, 0);
            socket.write(createPacket(Buffer.concat([Buffer.from([0x01]), pingPayload])));

            // Remove o pacote de status do buffer.
            responseBuffer = responseBuffer.slice(lengthSize + packetLength);
          }
        }

        // Se o status já foi recebido, procuramos pela resposta de Pong.
        if (statusParcial && responseBuffer.length > 0) {
          const { value: packetLength, size: lengthSize } = readVarInt(responseBuffer);
          if (responseBuffer.length < packetLength + lengthSize) return; // Aguarda mais dados.
          
          const packetData = responseBuffer.slice(lengthSize, lengthSize + packetLength);
          const { value: packetID } = readVarInt(packetData);

          if (packetID === 0x01) { // Resposta de Pong
            const pongPayload = packetData.readBigInt64BE(1);
            if (pingEnviadoEm === pongPayload) {
              const latenciaNs = process.hrtime.bigint() - pingEnviadoEm;
              const latenciaMs = Number(latenciaNs / 1000000n); // Converte nanossegundos para milissegundos.

              // SUCESSO! Agora temos todos os dados.
              resolve({ ...statusParcial, online: true, latencia: latenciaMs });
              socket.end(); // Fechamos a conexão.
            }
          }
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
      // Só resolve como 'offline' se não tivermos obtido um status parcial e nenhum erro ocorreu.
      if (!erro && !statusParcial) {
        resolve({ online: false, host, port });
      }
    });
  });
}
