const fs = require('fs');
const path = require('path');

async function readMeta() {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { list } = require('@vercel/blob');
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      const { blobs } = await list({ prefix: 'projects-meta', token });
      if (blobs.length > 0) {
        const newest = blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
        const r = await fetch(newest.url);
        return await r.json();
      }
    } catch (e) {
      console.error('Blob read error:', e.message);
    }
  }
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'projects.meta.json'), 'utf8'));
  } catch {
    return {};
  }
}

async function writeMeta(meta) {
  const { put, list, del } = require('@vercel/blob');
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  const { blobs: existing } = await list({ prefix: 'projects-meta', token });

  await put('projects-meta.json', JSON.stringify(meta, null, 2), {
    access: 'public',
    token,
    contentType: 'application/json',
  });

  for (const blob of existing) {
    await del(blob.url, { token });
  }
}

module.exports = { readMeta, writeMeta };
