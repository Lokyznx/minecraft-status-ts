# minecraft-query-ts

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Node.js](https://img.shields.io/badge/node-%3E%3D16-brightgreen) ![TypeScript](https://img.shields.io/badge/typescript-%5E5.8.3-blue)

> Biblioteca TypeScript para consulta de servidores Minecraft via protocolo Query.

---

## 📌 Sobre

O **minecraft-query-ts** é uma ferramenta robusta para desenvolvedores que precisam coletar informações de servidores Minecraft de forma rápida e confiável, utilizando o protocolo Query nativo do jogo. Implementado em TypeScript, garante tipagem forte, segurança e escalabilidade para projetos modernos.

---

## 🚀 Features

- Conexão simples e direta com servidores Minecraft
- Retorno tipado com todas as informações principais do servidor
- Tratamento de erros robusto e mensagens claras
- Compatível com Node.js >= 16 e TypeScript 5.8+
- Fácil integração em qualquer aplicação backend ou CLI

---

## ⚙️ Instalação

```bash
npm install minecraft-query-ts
```

---

## 🛠️ Uso Básico

```typescript
import { MinecraftQuery } from 'minecraft-query-ts';

async function main() {
  const query = new MinecraftQuery('ip.do.servidor', 25565);
  try {
    const status = await query.getStatus();
    console.log('Status do servidor:', status);
  } catch (error) {
    console.error('Erro ao consultar servidor:', error);
  }
}

main();
```

---

## 📄 API

### `new MinecraftQuery(host: string, port?: number)`

Construtor para criar uma instância de consulta.

- `host`: endereço IP ou hostname do servidor Minecraft
- `port`: porta de consulta (padrão: 25565)

---

### `getStatus(): Promise<ServerStatus>`

Retorna as informações do servidor Minecraft consultado.

`ServerStatus` possui as propriedades:

- `hostname`: string — nome do servidor
- `version`: string — versão do Minecraft
- `players`: { online: number; max: number } — jogadores online e máximo
- `plugins`: string[] — plugins instalados (quando disponível)
- `map`: string — nome do mapa atual
- `motd`: string — mensagem do dia do servidor

---

## 🧪 Testes

Para rodar os testes, execute:

```bash
npm run test
```

---

## 📚 Documentação

Documentação completa está disponível em [docs/minecraft-query-ts.md](docs/minecraft-query-ts.md) *(adicione caso tenha mesmo)*.

---

## 🤝 Contribuição

Contribuições são super bem-vindas! Sinta-se livre para abrir issues, enviar PRs e melhorar o projeto.

---

## 📝 Licença

MIT © Lokyznx

---

**Feito com 💙 por Lokyznx*
