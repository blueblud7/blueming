async function fetchBluemingProjects() {
  const token = process.env.VERCEL_ACCESS_TOKEN;
  if (!token) return [];

  const teamId = process.env.VERCEL_TEAM_ID;
  const teamParam = teamId ? `&teamId=${teamId}` : '';
  const teamQuery = teamId ? `?teamId=${teamId}` : '';

  try {
    const apiRes = await fetch(
      `https://api.vercel.com/v9/projects?limit=100${teamParam}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!apiRes.ok) return [];
    const { projects } = await apiRes.json();

    const withDomains = await Promise.all(
      projects.map(async (p) => {
        try {
          const r = await fetch(
            `https://api.vercel.com/v9/projects/${p.id}/domains${teamQuery}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!r.ok) return null;
          const { domains } = await r.json();
          const d = (domains || []).find(
            (d) => d.name?.endsWith('.blueming.net') && d.name !== 'www.blueming.net'
          );
          return d ? { name: p.name, id: p.id, domain: d.name } : null;
        } catch {
          return null;
        }
      })
    );

    return withDomains.filter(Boolean);
  } catch {
    return [];
  }
}

module.exports = { fetchBluemingProjects };
