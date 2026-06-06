const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const autenticar = require('../middleware/autenticar');

// GET /api/usuarios/perfil
router.get('/perfil', autenticar, async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id, nome, email, tipo, telefone, push_token, criado_em
       FROM usuarios
       WHERE id = $1`,
      [req.usuario.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Usuario nao encontrado' });
    }

    res.json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar perfil' });
  }
});

// GET /api/usuarios/impacto
router.get('/impacto', autenticar, async (req, res) => {
  try {
    const doacoes = await pool.query(
      `SELECT COUNT(*) AS total_doacoes,
              COALESCE(SUM(quantidade), 0) AS total_alimentos
       FROM doacoes
       WHERE doador_id = $1 AND status = 'entregue'`,
      [req.usuario.id]
    );

    const coletas = await pool.query(
      `SELECT COUNT(*) AS total_coletas,
              COALESCE(SUM(quantidade), 0) AS total_alimentos_coletados
       FROM doacoes
       WHERE voluntario_id = $1 AND status = 'entregue'`,
      [req.usuario.id]
    );

    const recebimentos = await pool.query(
      `SELECT COUNT(*) AS total_recebimentos,
              COALESCE(SUM(quantidade), 0) AS total_alimentos_recebidos
       FROM doacoes
       WHERE ong_id = $1 AND status = 'entregue'`,
      [req.usuario.id]
    );

    res.json({
      doacoes_realizadas: parseInt(doacoes.rows[0].total_doacoes, 10),
      alimentos_doados: parseInt(doacoes.rows[0].total_alimentos, 10),
      coletas_realizadas: parseInt(coletas.rows[0].total_coletas, 10),
      alimentos_coletados: parseInt(coletas.rows[0].total_alimentos_coletados, 10),
      recebimentos_ong: parseInt(recebimentos.rows[0].total_recebimentos, 10),
      alimentos_recebidos: parseInt(recebimentos.rows[0].total_alimentos_recebidos, 10),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar impacto' });
  }
});

// GET /api/usuarios/impacto/mensal
router.get('/impacto/mensal', autenticar, async (req, res) => {
  const filtroPorTipo = {
    doador: 'doador_id = $1',
    voluntario: 'voluntario_id = $1',
    ong: 'ong_id = $1',
  };

  try {
    const resultado = await pool.query(
      `SELECT TO_CHAR(date_trunc('month', COALESCE(entregue_em, atualizado_em)), 'YYYY-MM') AS mes,
              COUNT(*)::int AS doacoes,
              COALESCE(SUM(quantidade), 0)::int AS alimentos
       FROM doacoes
       WHERE status = 'entregue'
         AND ${filtroPorTipo[req.usuario.tipo]}
         AND COALESCE(entregue_em, atualizado_em) >= date_trunc('month', NOW()) - INTERVAL '5 months'
       GROUP BY 1
       ORDER BY 1 ASC`,
      [req.usuario.id]
    );

    res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar impacto mensal' });
  }
});

// GET /api/usuarios/dashboard-ong
router.get('/dashboard-ong', autenticar, async (req, res) => {
  if (req.usuario.tipo !== 'ong') {
    return res.status(403).json({ erro: 'Apenas ONGs podem acessar este dashboard' });
  }

  try {
    const resumo = await pool.query(
      `SELECT COUNT(*)::int AS recebimentos,
              COALESCE(SUM(quantidade), 0)::int AS alimentos,
              COUNT(*) FILTER (WHERE entregue_em >= NOW() - INTERVAL '30 days')::int AS recebimentos_30_dias
       FROM doacoes
       WHERE ong_id = $1 AND status = 'entregue'`,
      [req.usuario.id]
    );

    const recentes = await pool.query(
      `SELECT d.id, d.tipo_alimento, d.quantidade, d.endereco, d.entregue_em,
              doador.nome AS doador_nome,
              voluntario.nome AS voluntario_nome
       FROM doacoes d
       LEFT JOIN usuarios doador ON doador.id = d.doador_id
       LEFT JOIN usuarios voluntario ON voluntario.id = d.voluntario_id
       WHERE d.ong_id = $1 AND d.status = 'entregue'
       ORDER BY d.entregue_em DESC NULLS LAST, d.atualizado_em DESC
       LIMIT 20`,
      [req.usuario.id]
    );

    const mensal = await pool.query(
      `SELECT TO_CHAR(date_trunc('month', COALESCE(entregue_em, atualizado_em)), 'YYYY-MM') AS mes,
              COUNT(*)::int AS doacoes,
              COALESCE(SUM(quantidade), 0)::int AS alimentos
       FROM doacoes
       WHERE ong_id = $1
         AND status = 'entregue'
         AND COALESCE(entregue_em, atualizado_em) >= date_trunc('month', NOW()) - INTERVAL '5 months'
       GROUP BY 1
       ORDER BY 1 ASC`,
      [req.usuario.id]
    );

    res.json({
      resumo: resumo.rows[0],
      recentes: recentes.rows,
      mensal: mensal.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar dashboard da ONG' });
  }
});

// GET /api/usuarios/qr-recebimento
router.get('/qr-recebimento', autenticar, (req, res) => {
  if (req.usuario.tipo !== 'ong') {
    return res.status(403).json({ erro: 'Apenas ONGs possuem QR de recebimento' });
  }

  res.json({ qr_codigo: `doebem:ong:${req.usuario.id}` });
});

// PATCH /api/usuarios/push-token
router.patch('/push-token', autenticar, async (req, res) => {
  const { push_token } = req.body;

  if (!push_token) {
    return res.status(400).json({ erro: 'push_token e obrigatorio' });
  }

  try {
    await pool.query(
      `UPDATE usuarios SET push_token = $1, atualizado_em = NOW() WHERE id = $2`,
      [push_token, req.usuario.id]
    );

    res.json({ mensagem: 'Token de notificacao atualizado!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar token de notificacao' });
  }
});

// GET /api/usuarios/notificacoes
router.get('/notificacoes', autenticar, async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id, titulo, mensagem, dados, lida, criado_em
       FROM notificacoes
       WHERE usuario_id = $1
       ORDER BY criado_em DESC
       LIMIT 50`,
      [req.usuario.id]
    );

    res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar notificacoes' });
  }
});

// PATCH /api/usuarios/notificacoes/:id/lida
router.patch('/notificacoes/:id/lida', autenticar, async (req, res) => {
  try {
    const resultado = await pool.query(
      `UPDATE notificacoes
       SET lida = TRUE
       WHERE id = $1 AND usuario_id = $2
       RETURNING id`,
      [req.params.id, req.usuario.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Notificacao nao encontrada' });
    }

    res.json({ mensagem: 'Notificacao marcada como lida' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar notificacao' });
  }
});

// PATCH /api/usuarios/perfil
router.patch('/perfil', autenticar, async (req, res) => {
  const { nome, telefone } = req.body;

  try {
    const resultado = await pool.query(
      `UPDATE usuarios
       SET nome = COALESCE($1, nome),
           telefone = COALESCE($2, telefone),
           atualizado_em = NOW()
       WHERE id = $3
       RETURNING id, nome, email, tipo, telefone`,
      [nome || null, telefone || null, req.usuario.id]
    );

    res.json({ mensagem: 'Perfil atualizado!', usuario: resultado.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar perfil' });
  }
});

module.exports = router;
