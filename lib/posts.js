const fs = require('fs');
const path = require('path');

const LOCAL_FILE = path.join(process.cwd(), 'blog.posts.json');

async function readPosts() {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { list } = require('@vercel/blob');
      const { blobs } = await list({ prefix: 'blog-posts', token: process.env.BLOB_READ_WRITE_TOKEN });
      if (blobs.length) {
        const newest = blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
        return await (await fetch(newest.url)).json();
      }
    } catch (error) {
      console.error('Post read error:', error.message);
    }
  }
  try { return JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8')); } catch { return []; }
}

async function writePosts(posts) {
  const { put, list, del } = require('@vercel/blob');
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const { blobs } = await list({ prefix: 'blog-posts', token });
  await put('blog-posts.json', JSON.stringify(posts, null, 2), { access: 'public', token, contentType: 'application/json' });
  await Promise.all(blobs.map(blob => del(blob.url, { token })));
}

module.exports = { readPosts, writePosts };
