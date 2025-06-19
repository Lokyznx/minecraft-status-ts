import { consultarServidorJava } from './src/index';

async function checarServidor() {
  try {
    const status = await consultarServidorJava(
      'mc.sparklypower.net',
      25565,
      {
        timeout: 3000,
        protocolVersion: 765,
      }
    );

    if (status.online) {
      console.log(`✅ Servidor Online! Ping: ${status.latencia}ms`);
      console.log(`Versão: ${status.versao}`);
      console.log(`Jogadores: ${status.jogadoresOnline}/${status.jogadoresMax}`);
    } else {
      console.log('❌ Servidor offline.');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`🔥 Falha na consulta: ${error.message}`);
    } else {
      console.error('🔥 Falha na consulta: Erro desconhecido', error);
    }
  }
}

checarServidor();
