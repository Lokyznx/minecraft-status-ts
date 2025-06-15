
# minecraft-query-ts

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)

> Cliente TypeScript para consulta de servidores Minecraft. Simples, rápido e tipado.

---

## 🚀 Instalação

```bash
npm install minecraft-query-ts
```

---

## 💻 Exemplo de Uso

```ts
import { MinecraftQuery } from 'minecraft-query-ts';

const query = new MinecraftQuery('play.minecraftserver.com', 25565);

async function main() {
  try {
    const status = await query.getStatus();
    console.log('Servidor está online:', status.online);
    console.log('Jogadores online:', status.players.online);
    console.log('Versão do servidor:', status.version.name);
  } catch (error) {
    console.error('Erro ao consultar o servidor:', error);
  }
}

main();
```

---

## 📦 Scripts

- `npm run build` — Compila o TypeScript para JavaScript
- `npm test` — Roda os testes (se tiver)
- `npm run start` — Executa o app (se aplicável)

---

## 🤝 Contribuição

Quer contribuir? Ótimo! Abra um pull request seguindo o padrão de commits, mantenha o código limpo e documentado. Feedbacks são sempre bem-vindos!

---

## 📄 Licença

MIT © Lokyznx
