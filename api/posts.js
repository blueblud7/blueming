const { readPosts, writePosts } = require('../lib/posts');

function authorized(req) {
  return Boolean(process.env.ADMIN_PASSWORD && req.headers['x-admin-password'] === process.env.ADMIN_PASSWORD);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const posts = await readPosts();
    return res.status(200).json({ posts: authorized(req) ? posts : posts.filter(post => post.status === 'published') });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!authorized(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ error: 'BLOB_READ_WRITE_TOKEN not configured' });

  const { posts } = req.body || {};
  if (!Array.isArray(posts) || posts.some(post => !post || typeof post.title !== 'string' || typeof post.body !== 'string')) {
    return res.status(400).json({ error: 'Invalid posts' });
  }
  try {
    await writePosts(posts.map(post => ({
      id: String(post.id || Date.now()), title: post.title.slice(0, 200), excerpt: String(post.excerpt || '').slice(0, 500),
      category: String(post.category || 'NOTE').slice(0, 40), date: String(post.date || '').slice(0, 10),
      status: post.status === 'published' ? 'published' : 'draft', body: post.body.slice(0, 100000), updatedAt: new Date().toISOString(),
    })));
    return res.status(200).json({ ok: true });
  } catch (error) { return res.status(500).json({ error: error.message || 'Failed to save posts' }); }
};
