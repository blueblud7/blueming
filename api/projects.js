const { readMeta } = require('../lib/meta');
const { fetchBluemingProjects } = require('../lib/vercel');

const UI = {
  ko: {
    works_label: '작업물',
    eyebrow: 'AI로 짓고, 피우는 것들',
    lead: '데이터와 글, 도구가 한자리에서 자라는 곳. 한국 증권 리포트부터 글쓰기 도구까지 — <b>하나씩 피워 올립니다.</b>',
    copy: '© 2026 blueming · made with care',
    soon: '다음 프로젝트<br>진행 중',
    badge_soon: '준비 중',
  },
  en: {
    works_label: 'WORKS',
    eyebrow: 'Built with AI, grown with care',
    lead: 'Where data, writing, and tools grow in one place. From Korean stock reports to writing tools — <b>blooming one at a time.</b>',
    copy: '© 2026 blueming · made with care',
    soon: 'More projects<br>in the works',
    badge_soon: 'Coming soon',
  },
};

function toCard(subdomain, m, href) {
  return {
    _subdomain: subdomain,
    icon: m.icon || '🔗',
    title: m.title || subdomain,
    en: m.en || '',
    desc: m.desc || { ko: '', en: '' },
    href,
    tag: m.tag || 'Project',
    accent: m.accent || '#5B7FE3',
    ready: m.ready === true,
    status: m.status || null,
  };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');

  const [meta, vercelProjects] = await Promise.all([readMeta(), fetchBluemingProjects()]);

  const vercelMapped = vercelProjects
    .map((p) => {
      const subdomain = p.domain.replace('.blueming.net', '');
      const m = meta[subdomain] || {};
      if (m.hidden) return null;
      return toCard(subdomain, m, `https://${p.domain}`);
    })
    .filter(Boolean);

  const manualMapped = Object.entries(meta)
    .filter(([, m]) => m.manual === true && !m.hidden)
    .map(([key, m]) => toCard(key, m, m.href || '#'));

  const all = [...vercelMapped, ...manualMapped];

  const order = Object.keys(meta);
  all.sort((a, b) => {
    const ai = order.indexOf(a._subdomain);
    const bi = order.indexOf(b._subdomain);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const projects = all.map(({ _subdomain, ...rest }) => rest);
  res.status(200).json({ ui: UI, projects });
};
