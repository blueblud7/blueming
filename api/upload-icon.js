const { put } = require('@vercel/blob');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password, x-filename');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const pw = req.headers['x-admin-password'];
  if (!process.env.ADMIN_PASSWORD || pw !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({ error: 'BLOB_READ_WRITE_TOKEN not configured' });
  }

  const contentType = req.headers['content-type'] || 'image/png';
  if (!contentType.startsWith('image/')) {
    return res.status(400).json({ error: 'Only image files are allowed' });
  }

  const rawFilename = req.headers['x-filename'] || `icon-${Date.now()}.png`;
  const filename = rawFilename.replace(/[^a-zA-Z0-9._-]/g, '_');

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    if (buffer.length === 0) return res.status(400).json({ error: 'Empty file' });
    if (buffer.length > 2 * 1024 * 1024) return res.status(413).json({ error: 'File too large (max 2MB)' });

    const blob = await put(`icons/${filename}`, buffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType,
    });

    return res.status(200).json({ url: blob.url });
  } catch (err) {
    console.error('upload-icon error:', err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
};
