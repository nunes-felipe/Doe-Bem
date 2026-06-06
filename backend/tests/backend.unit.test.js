const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const autenticar = require('../src/middleware/autenticar');
const { extrairOngId } = require('../src/utils/qrcode');
const {
  decodeBase64,
  extensionFromMime,
  sanitizeFileName,
} = require('../src/services/storage');

function criarRespostaFake() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('extrairOngId aceita QR Code da ONG e UUID puro', () => {
  const ongId = '123e4567-e89b-12d3-a456-426614174000';

  assert.equal(extrairOngId(`doebem:ong:${ongId}`), ongId);
  assert.equal(extrairOngId(`  ${ongId}  `), ongId);
});

test('extrairOngId rejeita QR Code invalido', () => {
  assert.equal(extrairOngId(null), null);
  assert.equal(extrairOngId('doebem:doacao:123'), null);
  assert.equal(extrairOngId('texto qualquer'), null);
});

test('storage normaliza nome de arquivo e extensao por MIME type', () => {
  assert.equal(sanitizeFileName('Paes frescos 01.JPG'), 'paes-frescos-01.jpg');
  assert.equal(extensionFromMime('image/png'), 'png');
  assert.equal(extensionFromMime('image/webp'), 'webp');
  assert.equal(extensionFromMime('image/jpeg'), 'jpg');
  assert.equal(extensionFromMime('application/octet-stream'), 'jpg');
});

test('decodeBase64 decodifica base64 puro e data URI', () => {
  assert.equal(decodeBase64('T2xhIERvZUJlbQ==').toString('utf8'), 'Ola DoeBem');
  assert.equal(
    decodeBase64('data:image/jpeg;base64,TWFybWl0YXM=').toString('utf8'),
    'Marmitas'
  );
});

test('middleware autenticar recusa requisicao sem token', () => {
  const req = { headers: {} };
  const res = criarRespostaFake();
  let nextChamado = false;

  autenticar(req, res, () => {
    nextChamado = true;
  });

  assert.equal(nextChamado, false);
  assert.equal(res.statusCode, 401);
  assert.equal(typeof res.body.erro, 'string');
  assert.match(res.body.erro, /Token/);
});

test('middleware autenticar recusa token invalido', () => {
  process.env.JWT_SECRET = 'segredo-teste';

  const req = { headers: { authorization: 'Bearer token-invalido' } };
  const res = criarRespostaFake();
  let nextChamado = false;

  autenticar(req, res, () => {
    nextChamado = true;
  });

  assert.equal(nextChamado, false);
  assert.equal(res.statusCode, 403);
  assert.equal(typeof res.body.erro, 'string');
  assert.match(res.body.erro, /Token/);
});

test('middleware autenticar aceita token valido e popula req.usuario', () => {
  process.env.JWT_SECRET = 'segredo-teste';
  const payload = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'voluntario@doebem.test',
    tipo: 'voluntario',
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = criarRespostaFake();
  let nextChamado = false;

  autenticar(req, res, () => {
    nextChamado = true;
  });

  assert.equal(nextChamado, true);
  assert.equal(res.statusCode, 200);
  assert.equal(req.usuario.id, payload.id);
  assert.equal(req.usuario.email, payload.email);
  assert.equal(req.usuario.tipo, payload.tipo);
});
