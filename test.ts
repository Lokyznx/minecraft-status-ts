import { queryJavaServer } from './src/protocols/java/queryJavaServer';

async function checkServer() {
  try {
    const status = await queryJavaServer(
      'mc.sparklypower.net',
      25565,
      {
        timeout: 3000,
        protocolVersion: 770,
      }
    );

    if (status.online) {
      console.log(`✅ Server Online! Ping: ${status.latency}ms`);
      console.log(`Version: ${status.version}`);
      console.log(`Players: ${status.playersOnline}/${status.playersMax}`);
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

checkServer();
