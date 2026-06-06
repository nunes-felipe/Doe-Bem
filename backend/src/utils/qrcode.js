function extrairOngId(qrCodigo) {
  if (!qrCodigo) return null;

  const valor = String(qrCodigo).trim();
  const match = valor.match(/^doebem:ong:([0-9a-f-]{36})$/i);

  if (match) return match[1];
  if (/^[0-9a-f-]{36}$/i.test(valor)) return valor;

  return null;
}

module.exports = { extrairOngId };
