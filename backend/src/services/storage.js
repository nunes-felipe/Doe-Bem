const fs = require('fs/promises');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

function sanitizeFileName(fileName = 'foto.jpg') {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function extensionFromMime(mimeType) {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

function decodeBase64(base64) {
  const clean = base64.includes(',') ? base64.split(',').pop() : base64;
  return Buffer.from(clean, 'base64');
}

async function uploadToSupabase(buffer, mimeType, filePath) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'doebem';
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { error } = await supabase.storage.from(bucket).upload(filePath, buffer, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

async function uploadBase64Image({ base64, mimeType = 'image/jpeg', fileName, folder = 'doacoes', baseUrl }) {
  const buffer = decodeBase64(base64);
  const ext = extensionFromMime(mimeType);
  const safeName = sanitizeFileName(fileName || `foto.${ext}`);
  const finalName = `${Date.now()}-${uuidv4()}-${safeName.endsWith(`.${ext}`) ? safeName : `${safeName}.${ext}`}`;
  const remotePath = `${folder}/${finalName}`;

  const supabaseUrl = await uploadToSupabase(buffer, mimeType, remotePath);
  if (supabaseUrl) {
    return { url: supabaseUrl, storage: 'supabase' };
  }

  const uploadsRoot = path.join(__dirname, '..', '..', 'uploads', folder);
  await fs.mkdir(uploadsRoot, { recursive: true });
  await fs.writeFile(path.join(uploadsRoot, finalName), buffer);

  return {
    url: `${baseUrl}/uploads/${folder}/${finalName}`,
    storage: 'local',
  };
}

module.exports = {
  uploadBase64Image,
  sanitizeFileName,
  extensionFromMime,
  decodeBase64,
};
