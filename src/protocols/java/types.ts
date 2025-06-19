export interface JavaServerStatus {
  online: boolean;
  host: string;
  port: number;
  version?: string;
  playersOnline?: number;
  playersMax?: number;
  description?: string;
  favicon?: string | null;
  faviconBuffer?: Buffer | null;
  latency?: number;
}

export interface MinecraftJavaStatusResponse {
  version: { name: string };
  players: { online: number; max: number };
  description: string | { text?: string; extra?: { text?: string }[] };
  favicon?: string;
}
