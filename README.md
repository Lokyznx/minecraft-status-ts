
# 🧠 Minecraft Server Query Utility

A simple and modern utility to query the status of **Minecraft: Java Edition** and **Bedrock Edition** servers.

## ✨ Features

- ✅ Supports both Java and Bedrock editions.
- ✅ Written in TypeScript with fully typed definitions.
- ✅ Promise-based — perfect for async/await usage.
- ✅ Zero production dependencies — clean and lightweight.

## 🚀 Usage

The package exports two main functions:

- `queryJavaServer`
- `queryBedrockServer`

---

## 🧱 Java Edition

### 🔍 Query Example

```ts
import { queryJavaServer } from './src/protocols/java/queryJavaServer';

async function checkJava() {
  try {
    const status = await queryJavaServer('mc.hypixel.net', 25565, { timeout: 5000 });
    console.log(status);
  } catch (error) {
    console.error('Query failed:', error);
  }
}

checkJava();
```

### 📦 Return (`JavaServerStatus`)

```ts
{
  online: boolean;
  host: string;
  port: number;
  version?: string;
  playersOnline?: number;
  playersMax?: number;
  description?: string; // Server's Message of the Day (MOTD)
  favicon?: string | null; // Base64 encoded favicon
  latency?: number; // Latency in milliseconds
}
```

---

## 📱 Bedrock Edition

### 🔍 Query Example

```ts
import { queryBedrockServer } from './src/protocols/bedrock/queryBedrockServer';

async function checkBedrock() {
  try {
    const status = await queryBedrockServer('play.cubecraft.net', 19132, { timeout: 5000 });
    console.log(status);
  } catch (error) {
    console.error('Query failed:', error);
  }
}

checkBedrock();
```

### 📦 Return (`BedrockServerStatus`)

```ts
{
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
  latency?: number; // Latency in milliseconds
}
```

---

## 🏗️ License

This project is open-source. Feel free to use, improve, and share it. 🚀
