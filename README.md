
# 🟩 minecraft-query

> A TypeScript library to query the status of **Minecraft Java Edition** and **Minecraft Bedrock Edition** servers — simple, fast, and fully typed.

![NPM Version](https://img.shields.io/npm/v/minecraft-query-ts?style=for-the-badge&logo=npm)
![NPM Downloads](https://img.shields.io/npm/dm/minecraft-query-ts?style=for-the-badge&color=blue)
![License](https://img.shields.io/npm/l/minecraft-query-ts?style=for-the-badge&color=green)
![Typed](https://img.shields.io/npm/types/minecraft-query-ts?style=for-the-badge)

---

## 🚀 Installation

```bash
npm install minecraft-query-ts
```

---

## 🎯 Purpose

This library allows you to fetch information from any Minecraft server — both **Java Edition** and **Bedrock Edition** — directly from your Node + TypeScript applications, bots, APIs, or any backend service.

---

## 💻 Usage

### 🔗 Querying a **Java Edition** server

```ts
import { queryJavaServer } from 'minecraft-query-ts';
import type { JavaServerStatus } from 'minecraft-query-ts';

async function checkJava() {
  try {
    const status: JavaServerStatus = await queryJavaServer('mc.hypixel.net');
    console.log(status);
  } catch (error) {
    console.error('Failed to query server:', error);
  }
}

checkJava();
```

---

### 📱 Querying a **Bedrock Edition** server

```ts
import { queryBedrockServer } from 'minecraft-query-ts';
import type { BedrockServerStatus } from 'minecraft-query-ts';

async function checkBedrock() {
  try {
    const status: BedrockServerStatus = await queryBedrockServer('play.cubecraft.net');
    console.log(status);
  } catch (error) {
    console.error('Failed to query server:', error);
  }
}

checkBedrock();
```

---

## 🔍 API

### 🧠 `queryJavaServer(host, port?, options?)`

Query a **Minecraft Java Edition** server.

| Parameter | Type    | Required | Default | Description                                |
|-----------|---------|----------|---------|--------------------------------------------|
| `host`    | string  | ✅       | -       | Server address (IP or domain)              |
| `port`    | number  | ❌       | 25565   | Server port                                |
| `options` | object  | ❌       | -       | Optional settings like timeout, protocol   |

**Options:**

```ts
{
  timeout?: number;         // Timeout in ms (default: 5000)
  protocolVersion?: number; // Protocol version (default: 770)
}
```

**Returns:** `Promise<JavaServerStatus>`

```ts
{
  online: boolean;
  host: string;
  port: number;
  version?: string;
  playersOnline?: number;
  playersMax?: number;
  description?: string;     // Server MOTD
  favicon?: string | null;  // Favicon as Base64
  latency?: number;         // Latency in ms
}
```

---

### 📱 `queryBedrockServer(host, port?, options?)`

Query a **Minecraft Bedrock Edition** server.

| Parameter | Type    | Required | Default | Description                              |
|-----------|---------|----------|---------|------------------------------------------|
| `host`    | string  | ✅       | -       | Server address (IP or domain)            |
| `port`    | number  | ❌       | 19132   | Server port                              |
| `options` | object  | ❌       | -       | Optional settings like timeout           |

**Options:**

```ts
{
  timeout?: number; // Timeout in ms (default: 5000)
}
```

**Returns:** `Promise<BedrockServerStatus>`

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
  latency?: number; // Latency in ms
}
```

---

## 🏆 Features

- ✔️ Fully supports Java Edition and Bedrock Edition
- ✔️ 100% written in TypeScript with complete type definitions
- ✔️ Simple, clean API
- ✔️ No heavy dependencies
- ✔️ Lightweight and high performance

---

## 🔧 Tech Stack

- Node.js
- TypeScript
- ESModules

---

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for more information.

---

## 🌍 Links

- 🔗 [NPM](https://www.npmjs.com/package/minecraft-query-ts)
- 🔗 [GitHub Repository](https://github.com/Lokyznx/minecraft-query-ts) <!-- Replace with your repo URL -->

---
