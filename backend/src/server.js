require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const doacaoRoutes = require('./routes/doacoes');
const usuarioRoutes = require('./routes/usuarios');
const uploadRoutes = require('./routes/uploads');
const ensureSchema = require('./config/migrations');

const app = express();

app.use(cors());
app.use(express.json({ limit: '12mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rota de saúde — útil para confirmar que o servidor está rodando
app.get('/', (req, res) => {
  res.json({ status: 'DoeBem API rodando!', versao: '1.0.0' });
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/doacoes', doacaoRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/uploads', uploadRoutes);

// Tratamento de rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

// Tratamento global de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ erro: 'Erro interno no servidor' });
});

const PORT = process.env.PORT || 3000;
ensureSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Erro ao preparar banco de dados:', err);
    process.exit(1);
  });
