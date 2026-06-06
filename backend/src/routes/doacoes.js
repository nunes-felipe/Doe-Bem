const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const autenticar = require('../middleware/autenticar');
const { extrairOngId } = require('../utils/qrcode');
const {
  criarNotificacao,
  notificarVoluntariosNovaDoacao,
} = require('../services/notificacoes');

function selectDoacoesBase(extraSelect = '') {
  return `
    SELECT d.*,
      doador.nome AS doador_nome,
      voluntario.nome AS voluntario_nome,
      ong.nome AS ong_nome
      ${extraSelect}
    FROM doacoes d
    LEFT JOIN usuarios doador ON doador.id = d.doador_id
    LEFT JOIN usuarios voluntario ON voluntario.id = d.voluntario_id
    LEFT JOIN usuarios ong ON ong.id = d.ong_id
  `;
}

// GET /api/doacoes - Lista doacoes disponiveis, priorizadas por urgencia e distancia
router.get('/', autenticar, async (req, res) => {
  const { lat, lng } = req.query;

  try {
    let query;
    let params = [];

    if (lat && lng) {
      query = `
        ${selectDoacoesBase(`,
          ROUND(
            CAST(
              6371 * acos(
                LEAST(
                  1,
                  GREATEST(
                    -1,
                    cos(radians($1)) * cos(radians(d.latitude)) *
                    cos(radians(d.longitude) - radians($2)) +
                    sin(radians($1)) * sin(radians(d.latitude))
                  )
                )
              ) AS numeric
            ), 2
          ) AS distancia_km
        `)}
        WHERE d.status = 'disponivel'
        ORDER BY
          CASE WHEN d.validade < NOW() + INTERVAL '1 day' THEN 0 ELSE 1 END,
          distancia_km ASC NULLS LAST,
          d.validade ASC
      `;
      params = [parseFloat(lat), parseFloat(lng)];
    } else {
      query = `
        ${selectDoacoesBase()}
        WHERE d.status = 'disponivel'
        ORDER BY
          CASE WHEN d.validade < NOW() + INTERVAL '1 day' THEN 0 ELSE 1 END,
          d.validade ASC
      `;
    }

    const resultado = await pool.query(query, params);
    res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar doacoes' });
  }
});

// GET /api/doacoes/minhas - Lista doacoes relacionadas ao usuario logado
router.get('/minhas', autenticar, async (req, res) => {
  const filtrosPorTipo = {
    doador: 'd.doador_id = $1',
    voluntario: 'd.voluntario_id = $1',
    ong: 'd.ong_id = $1',
  };

  try {
    const resultado = await pool.query(
      `
        ${selectDoacoesBase()}
        WHERE ${filtrosPorTipo[req.usuario.tipo]}
        ORDER BY d.atualizado_em DESC, d.criado_em DESC
      `,
      [req.usuario.id]
    );

    res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar suas doacoes' });
  }
});

// GET /api/doacoes/:id - Detalhes de uma doacao
router.get('/:id', autenticar, async (req, res) => {
  try {
    const resultado = await pool.query(
      `${selectDoacoesBase()} WHERE d.id = $1`,
      [req.params.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Doacao nao encontrada' });
    }

    res.json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar doacao' });
  }
});

// POST /api/doacoes - Cria nova doacao
router.post('/', autenticar, async (req, res) => {
  if (req.usuario.tipo !== 'doador') {
    return res.status(403).json({ erro: 'Apenas doadores podem criar doacoes' });
  }

  const {
    tipo_alimento,
    descricao,
    quantidade,
    validade,
    endereco,
    latitude,
    longitude,
    foto_url,
  } = req.body;

  if (!tipo_alimento || !quantidade || !validade || !endereco) {
    return res.status(400).json({ erro: 'Campos obrigatorios: tipo_alimento, quantidade, validade, endereco' });
  }

  try {
    const id = uuidv4();
    const qrCodigo = `doebem:doacao:${id}:${uuidv4()}`;
    const resultado = await pool.query(
      `INSERT INTO doacoes
        (id, doador_id, tipo_alimento, descricao, quantidade, validade, endereco,
         latitude, longitude, foto_url, status, qr_codigo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'disponivel', $11)
       RETURNING *`,
      [
        id,
        req.usuario.id,
        tipo_alimento,
        descricao || null,
        quantidade,
        validade,
        endereco,
        latitude || null,
        longitude || null,
        foto_url || null,
        qrCodigo,
      ]
    );

    notificarVoluntariosNovaDoacao(resultado.rows[0]).catch((err) => {
      console.error('Erro ao notificar voluntarios:', err.message);
    });

    res.status(201).json({ mensagem: 'Doacao publicada!', doacao: resultado.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar doacao' });
  }
});

// PATCH /api/doacoes/:id/aceitar - Voluntario aceita a coleta
router.patch('/:id/aceitar', autenticar, async (req, res) => {
  if (req.usuario.tipo !== 'voluntario') {
    return res.status(403).json({ erro: 'Apenas voluntarios podem aceitar coletas' });
  }

  try {
    const doacao = await pool.query('SELECT * FROM doacoes WHERE id = $1', [req.params.id]);
    if (doacao.rows.length === 0) {
      return res.status(404).json({ erro: 'Doacao nao encontrada' });
    }
    if (doacao.rows[0].status !== 'disponivel') {
      return res.status(409).json({ erro: 'Esta doacao ja foi aceita por outro voluntario' });
    }

    const resultado = await pool.query(
      `UPDATE doacoes
       SET status = 'em_coleta', voluntario_id = $1, atualizado_em = NOW()
       WHERE id = $2
       RETURNING *`,
      [req.usuario.id, req.params.id]
    );

    await criarNotificacao(
      doacao.rows[0].doador_id,
      'Coleta aceita',
      'Um voluntario aceitou buscar sua doacao.',
      { tipo: 'coleta_aceita', doacao_id: req.params.id }
    );

    res.json({ mensagem: 'Coleta aceita!', doacao: resultado.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao aceitar coleta' });
  }
});

// PATCH /api/doacoes/:id/cancelar - Doador cancela uma doacao
router.patch('/:id/cancelar', autenticar, async (req, res) => {
  const { motivo } = req.body;

  try {
    const doacao = await pool.query('SELECT * FROM doacoes WHERE id = $1', [req.params.id]);
    if (doacao.rows.length === 0) {
      return res.status(404).json({ erro: 'Doacao nao encontrada' });
    }

    if (req.usuario.tipo !== 'doador' || doacao.rows[0].doador_id !== req.usuario.id) {
      return res.status(403).json({ erro: 'Apenas o doador responsavel pode cancelar esta doacao' });
    }

    if (['entregue', 'cancelada'].includes(doacao.rows[0].status)) {
      return res.status(409).json({ erro: 'Esta doacao nao pode mais ser cancelada' });
    }

    const resultado = await pool.query(
      `UPDATE doacoes
       SET status = 'cancelada',
           cancelada_motivo = $1,
           cancelada_em = NOW(),
           atualizado_em = NOW()
       WHERE id = $2
       RETURNING *`,
      [motivo || null, req.params.id]
    );

    if (doacao.rows[0].voluntario_id) {
      await criarNotificacao(
        doacao.rows[0].voluntario_id,
        'Doacao cancelada',
        'Uma coleta aceita por voce foi cancelada pelo doador.',
        { tipo: 'doacao_cancelada', doacao_id: req.params.id }
      );
    }

    res.json({ mensagem: 'Doacao cancelada!', doacao: resultado.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao cancelar doacao' });
  }
});

// PATCH /api/doacoes/:id/confirmar - Confirma entrega por QR Code da ONG
router.patch('/:id/confirmar', autenticar, async (req, res) => {
  if (req.usuario.tipo !== 'voluntario') {
    return res.status(403).json({ erro: 'Apenas voluntarios podem confirmar entregas' });
  }

  const { foto_confirmacao, ong_id, qr_codigo } = req.body;

  try {
    const doacao = await pool.query(
      `SELECT * FROM doacoes WHERE id = $1 AND voluntario_id = $2`,
      [req.params.id, req.usuario.id]
    );

    if (doacao.rows.length === 0) {
      return res.status(404).json({ erro: 'Doacao nao encontrada ou sem permissao' });
    }

    if (doacao.rows[0].status !== 'em_coleta') {
      return res.status(409).json({ erro: 'Esta doacao nao esta em coleta' });
    }

    const ongIdConfirmada = extrairOngId(qr_codigo) || ong_id;
    if (!ongIdConfirmada) {
      return res.status(400).json({ erro: 'QR Code da ONG e obrigatorio para confirmar a entrega' });
    }

    const ong = await pool.query(
      `SELECT id FROM usuarios WHERE id = $1 AND tipo = 'ong'`,
      [ongIdConfirmada]
    );

    if (ong.rows.length === 0) {
      return res.status(400).json({ erro: 'QR Code de ONG invalido' });
    }

    const resultado = await pool.query(
      `UPDATE doacoes
       SET status = 'entregue',
           foto_confirmacao = $1,
           ong_id = $2,
           entregue_em = NOW(),
           atualizado_em = NOW()
       WHERE id = $3 AND voluntario_id = $4
       RETURNING *`,
      [foto_confirmacao || null, ongIdConfirmada, req.params.id, req.usuario.id]
    );

    await Promise.all([
      criarNotificacao(
        doacao.rows[0].doador_id,
        'Doacao entregue',
        'Sua doacao foi entregue a uma ONG.',
        { tipo: 'doacao_entregue', doacao_id: req.params.id }
      ),
      criarNotificacao(
        ongIdConfirmada,
        'Recebimento confirmado',
        'Uma nova doacao foi registrada para sua ONG.',
        { tipo: 'recebimento_ong', doacao_id: req.params.id }
      ),
    ]);

    res.json({ mensagem: 'Entrega confirmada!', doacao: resultado.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao confirmar entrega' });
  }
});

module.exports = router;
