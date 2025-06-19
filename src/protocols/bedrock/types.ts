export interface BedrockServerStatus {
  online: boolean;
  host: string;
  port: number;
  edition?: string;
  motd?: string;
  version?: string;
  protocol?: number;
  playersOnline?: number;
  playersMax?: number;
  serverId?: string;
  gameMode?: string;
  latency?: number;
}
