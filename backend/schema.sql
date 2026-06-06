-- =============================================
-- DoeBem - Schema do Banco de Dados
-- Execute este arquivo no Supabase ou PostgreSQL
-- =============================================

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('doador', 'voluntario', 'ong')),
  telefone VARCHAR(20),
  push_token TEXT,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela de doações
CREATE TABLE IF NOT EXISTS doacoes (
  id UUID PRIMARY KEY,
  doador_id UUID NOT NULL REFERENCES usuarios(id),
  voluntario_id UUID REFERENCES usuarios(id),
  ong_id UUID REFERENCES usuarios(id),
  tipo_alimento VARCHAR(100) NOT NULL,
  descricao TEXT,
  quantidade INTEGER NOT NULL,
  validade TIMESTAMP NOT NULL,
  endereco TEXT NOT NULL,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  foto_url TEXT,
  foto_confirmacao TEXT,
  qr_codigo TEXT,
  cancelada_motivo TEXT,
  cancelada_em TIMESTAMP,
  entregue_em TIMESTAMP,
  status VARCHAR(20) DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'em_coleta', 'entregue', 'cancelada')),
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo VARCHAR(120) NOT NULL,
  mensagem TEXT NOT NULL,
  dados JSONB DEFAULT '{}'::jsonb,
  lida BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Índices para melhorar performance de buscas por status e localização
CREATE INDEX IF NOT EXISTS idx_doacoes_status ON doacoes(status);
CREATE INDEX IF NOT EXISTS idx_doacoes_validade ON doacoes(validade);
CREATE INDEX IF NOT EXISTS idx_doacoes_doador ON doacoes(doador_id);
CREATE INDEX IF NOT EXISTS idx_doacoes_voluntario ON doacoes(voluntario_id);
CREATE INDEX IF NOT EXISTS idx_doacoes_ong ON doacoes(ong_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_doacoes_qr_codigo ON doacoes(qr_codigo) WHERE qr_codigo IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id, criado_em DESC);
