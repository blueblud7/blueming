const { readMeta, writeMeta } = require('../lib/meta');
const { fetchBluemingProjects } = require('../lib/vercel');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const pw = req.headers['x-admin-password'];
  if (!process.env.ADMIN_PASSWORD || pw !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const [meta, vercelProjects] = await Promise.all([readMeta(), fetchBluemingProjects()]);
    return res.status(200).json({ meta, vercelProjects });
  }

  if (req.method === 'POST') {
    const { meta } = req.body || {};
    if (!meta || typeof meta !== 'object') {
      return res.status(400).json({ error: 'Invalid meta' });
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(503).json({ error: 'BLOB_READ_WRITE_TOKEN not configured' });
    }
    try {
      await writeMeta(meta);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('writeMeta error:', err);
      return res.status(500).json({ error: err.message || 'Failed to save' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
};
