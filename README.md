
# minecraft-query-ts

[![npm version](https://img.shields.io/npm/v/minecraft-query-ts.svg)](https://www.npmjs.com/package/minecraft-query-ts)  
[![Downloads](https://img.shields.io/npm/dm/minecraft-query-ts.svg)](https://www.npmjs.com/package/minecraft-query-ts)  
[![License](https://img.shields.io/npm/l/minecraft-query-ts.svg)](https://opensource.org/licenses/MIT)  
[![TypeScript](https://img.shields.io/badge/TypeScript-%3E%3D5.8-blue.svg)](https://www.typescriptlang.org/)  
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D16-green.svg)](https://nodejs.org/)

---

## 📦 About

**minecraft-query-ts** is a lightweight and reliable TypeScript library for querying Minecraft Java Edition servers using the native Query protocol. Built with strong typing and modern TypeScript features, it ensures safety and scalability for backend applications and CLI tools.

---

## 🚀 Features

- Simple and direct connection to Minecraft servers  
- Fully typed responses with server details  
- Robust error handling with clear messages  
- Supports Node.js >= 16 and TypeScript >= 5.8  
- Easy integration into any backend or CLI project  

---

## ⚙️ Installation

```bash
npm install minecraft-query-ts
```

or

```bash
yarn add minecraft-query-ts
```

---

## 🛠️ Basic Usage

```ts
import { queryJavaServer } from 'minecraft-query-ts';

async function main() {
  try {
    const status = await queryJavaServer('mc.hypixel.net', 25565, { timeout: 3000 });
    if (status.online) {
      console.log(`✅ Server is online! Ping: ${status.latency}ms`);
      console.log(`Version: ${status.version}`);
      console.log(`Players: ${status.playersOnline}/${status.playersMax}`);
    } else {
      console.log('❌ Server is offline.');
    }
  } catch (error) {
    console.error('🔥 Query failed:', error);
  }
}

main();
```

---

## 📄 API

`queryJavaServer(host: string, port?: number, options?: { timeout?: number; protocolVersion?: number }): Promise<ServerStatus>`

Queries a Minecraft Java Edition server for status information.

| Parameter | Type | Description |
| --- | --- | --- |
| host | string | Server IP address or hostname |
| port | number (optional, default: 25565) | Server port |
| options | object (optional) | Additional options |
| options.timeout | number (optional, default: 5000) | Connection timeout in milliseconds |
| options.protocolVersion | number (optional, default: 770) | Minecraft protocol version |

---

### ServerStatus Interface

| Property | Type | Description |
| --- | --- | --- |
| online | boolean | Whether server is online |
| host | string | Hostname or IP |
| port | number | Server port |
| version | string (optional) | Minecraft server version |
| playersOnline | number (optional) | Number of online players |
| playersMax | number (optional) | Maximum players allowed |
| description | string (optional) | Server MOTD |
| favicon | string or null (optional) | Server favicon (base64) |
| latency | number (optional) | Ping latency in milliseconds |

---

## 🧪 Testing

Run the tests with:

```bash
npm run test
```

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or pull requests.

---

## 📝 License

MIT © Taylon

---

Built with 💙 by Taylon
