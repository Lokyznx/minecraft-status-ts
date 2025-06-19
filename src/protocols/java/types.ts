export interface JavaServerStatus {
  online: boolean;
  host: string;
  port: number;
  version?: string;
  playersOnline?: number;
  playersMax?: number;
  description?: string;
  favicon?: string | null;         // O favicon original em Base64 (string)
  faviconBuffer?: Buffer | null;   // NOVO: O favicon já como Buffer
  latency?: number;
}

export interface MinecraftJavaStatusResponse {
  version: { name: string };
  players: { online: number; max: number };
  description: string | { text?: string; extra?: { text?: string }[] };
  favicon?: string;
}
