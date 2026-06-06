const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

// POST /api/auth/cadastro
router.post('/cadastro', async (req, res) => {
  const { nome, email, senha, tipo, telefone } = req.body;

  if (!nome || !email || !senha || !tipo) {
    return res.status(400).json({ erro: 'Campos obrigatórios: nome, email, senha, tipo' });
  }

  // tipo deve ser: doador | voluntario | ong
  const tiposValidos = ['doador', 'voluntario', 'ong'];
  if (!tiposValidos.includes(tipo)) {
    return res.status(400).json({ erro: 'Tipo inválido. Use: doador, voluntario ou ong' });
  }

  try {
    const jaExiste = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (jaExiste.rows.length > 0) {
      return res.status(409).json({ erro: 'E-mail já cadastrado' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const id = uuidv4();

    await pool.query(
      'INSERT INTO usuarios (id, nome, email, senha, tipo, telefone) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, nome, email, senhaHash, tipo, telefone || null]
    );

    const token = jwt.sign({ id, email, tipo }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ mensagem: 'Cadastro realizado!', token, usuario: { id, nome, email, tipo } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao cadastrar usuário' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios' });
  }

  try {
    const resultado = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    const usuario = resultado.rows[0];

    if (!usuario) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, tipo: usuario.tipo },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
});

module.exports = router;
