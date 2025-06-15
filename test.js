const { consultarServidorJava } = require('./dist/index');

(async () => {
  try {
    const status = await consultarServidorJava('play.hypixel.net', 25565);
    console.log('Status do servidor:', status);
  } catch (err) {
    console.error('Erro ao consultar o servidor:', err);
  }
})();

