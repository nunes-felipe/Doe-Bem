const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

async function criarNotificacao(usuarioId, titulo, mensagem, dados = {}) {
  const id = uuidv4();
  await pool.query(
    `INSERT INTO notificacoes (id, usuario_id, titulo, mensagem, dados)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, usuarioId, titulo, mensagem, dados]
  );
}

async function enviarExpoPush(tokens, titulo, mensagem, dados = {}) {
  const tokensValidos = tokens.filter((token) => typeof token === 'string' && token.startsWith('ExpoPushToken'));

  if (tokensValidos.length === 0 || process.env.SEND_PUSH_NOTIFICATIONS === 'false') {
    return;
  }

  const mensagens = tokensValidos.map((to) => ({
    to,
    sound: 'default',
    title: titulo,
    body: mensagem,
    data: dados,
  }));

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mensagens),
    });
    clearTimeout(timeout);
  } catch (err) {
    console.error('Erro ao enviar push Expo:', err.message);
  }
}

async function notificarVoluntariosNovaDoacao(doacao) {
  const resultado = await pool.query(
    `SELECT id, push_token FROM usuarios WHERE tipo = 'voluntario'`
  );

  const titulo = 'Nova doacao disponivel';
  const mensagem = `${doacao.tipo_alimento} para coleta em ${doacao.endereco}`;
  const dados = { tipo: 'nova_doacao', doacao_id: doacao.id };

  await Promise.all(
    resultado.rows.map((usuario) => criarNotificacao(usuario.id, titulo, mensagem, dados))
  );

  await enviarExpoPush(
    resultado.rows.map((usuario) => usuario.push_token),
    titulo,
    mensagem,
    dados
  );
}

module.exports = {
  criarNotificacao,
  enviarExpoPush,
  notificarVoluntariosNovaDoacao,
};
