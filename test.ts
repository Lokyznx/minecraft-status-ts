import { queryJavaServer } from './src/protocols/java/queryJavaServer';
import { queryBedrockServer } from './src/protocols/bedrock/queryBedrockServer';

async function checkJavaServer() {
  console.log('--- Checking Java Server (mc.sparklypower.net) ---');
  try {
    const status = await queryJavaServer(
      'play.cubecraft.net', 
      25565,
      { timeout: 3000 }
    );

    if (status.online) {
      // ATUALIZAÇÃO: Adicionando a descrição (MOTD) para padronizar a saída
      console.log(`✅ Server Online! Ping: ${status.latency}ms`);
      console.log(`   Descrição (MOTD): ${status.description}`);
      console.log(`   Version: ${status.version}`);
      console.log(`   Players: ${status.playersOnline}/${status.playersMax}`);
    } else {
      console.log('❌ Server offline.');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`🔥 Query failed: ${error.message}`);
    } else {
      console.error('🔥 Query failed: Unknown error', error);
    }
  }
}

async function checkBedrockServer() {
  console.log('\n--- Checking Bedrock Server (play.cubecraft.net) ---');
  try {
    const status = await queryBedrockServer(
      'play.cubecraft.net',
      19132,
      { timeout: 3000 }
    );

    if (status.online) {
      console.log(`✅ Server Online! Ping: ${status.latency}ms`);
      console.log(`   MOTD: ${status.motd}`);
      console.log(`   Version: ${status.version}`);
      console.log(`   GameMode: ${status.gameMode}`);
      console.log(`   Players: ${status.playersOnline}/${status.playersMax}`);
    } else {
      console.log('❌ Server offline.');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`🔥 Query failed: ${error.message}`);
    } else {
      console.error('🔥 Query failed: Unknown error', error);
    }
  }
}

async function runTests() {
  await checkJavaServer();
  await checkBedrockServer();
}

runTests();
