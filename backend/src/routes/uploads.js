const express = require('express');
const router = express.Router();
const autenticar = require('../middleware/autenticar');
const { uploadBase64Image } = require('../services/storage');

router.post('/foto', autenticar, async (req, res) => {
  const { base64, mime_type, nome_arquivo, pasta } = req.body;

  if (!base64) {
    return res.status(400).json({ erro: 'Imagem em base64 e obrigatoria' });
  }

  try {
    const baseUrl = process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`;
    const arquivo = await uploadBase64Image({
      base64,
      mimeType: mime_type || 'image/jpeg',
      fileName: nome_arquivo,
      folder: pasta || 'doacoes',
      baseUrl,
    });

    res.status(201).json(arquivo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao enviar foto' });
  }
});

module.exports = router;
