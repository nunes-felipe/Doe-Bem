const pool = require('./database');

async function ensureSchema() {
  const statements = [
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS push_token TEXT`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT NOW()`,
    `ALTER TABLE doacoes ADD COLUMN IF NOT EXISTS qr_codigo TEXT`,
    `ALTER TABLE doacoes ADD COLUMN IF NOT EXISTS cancelada_motivo TEXT`,
    `ALTER TABLE doacoes ADD COLUMN IF NOT EXISTS cancelada_em TIMESTAMP`,
    `ALTER TABLE doacoes ADD COLUMN IF NOT EXISTS entregue_em TIMESTAMP`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_doacoes_qr_codigo ON doacoes(qr_codigo) WHERE qr_codigo IS NOT NULL`,
    `CREATE INDEX IF NOT EXISTS idx_doacoes_voluntario ON doacoes(voluntario_id)`,
    `CREATE INDEX IF NOT EXISTS idx_doacoes_ong ON doacoes(ong_id)`,
    `CREATE TABLE IF NOT EXISTS notificacoes (
      id UUID PRIMARY KEY,
      usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      titulo VARCHAR(120) NOT NULL,
      mensagem TEXT NOT NULL,
      dados JSONB DEFAULT '{}'::jsonb,
      lida BOOLEAN DEFAULT FALSE,
      criado_em TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id, criado_em DESC)`,
  ];

  for (const statement of statements) {
    await pool.query(statement);
  }
}

module.exports = ensureSchema;
