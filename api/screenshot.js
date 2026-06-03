const { put } = require('@vercel/blob');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const pw = req.headers['x-admin-password'];
  if (!process.env.ADMIN_PASSWORD || pw !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({ error: 'BLOB_READ_WRITE_TOKEN not configured' });
  }

  const { target, key } = req.query;
  if (!target) return res.status(400).json({ error: 'Missing target URL' });

  try {
    // thum.io: free, no API key needed, returns JPEG directly
    const screenshotSrc = `https://image.thum.io/get/width/800/crop/600/noanimate/${target}`;
    const imgRes = await fetch(screenshotSrc, { redirect: 'follow' });
    if (!imgRes.ok) throw new Error(`Screenshot service returned ${imgRes.status}`);

    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    const safeName = (key || 'project').replace(/[^a-z0-9-]/g, '-');

    const blob = await put(`screenshots/${safeName}-${Date.now()}.jpg`, imgBuffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: 'image/jpeg',
    });

    return res.status(200).json({ url: blob.url });
  } catch (err) {
    console.error('screenshot error:', err);
    return res.status(500).json({ error: err.message || 'Screenshot failed' });
  }
};
