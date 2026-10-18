// Runs inside the existing deployment job; credentials never enter website files.
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export async function setupGrowth({ accountId, projectName, token, fetcher = fetch }) {
  if (!/^[a-zA-Z0-9_-]+$/.test(accountId || '') || !/^[a-zA-Z0-9_-]+$/.test(projectName || '') || !token) throw new Error('Cloudflare deployment credentials are missing or invalid.');
  const root = `https://api.cloudflare.com/client/v4/accounts/${accountId}`;
  async function api(path, method = 'GET', body) {
    const response = await fetcher(`${root}${path}`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(`Growth setup failed (Cloudflare HTTP ${response.status}). The existing API token needs Pages Edit and D1 Edit permissions for this account. No website deployment was attempted.`);
    return data;
  }
  const projectPath = `/pages/projects/${projectName}`;
  const project = (await api(projectPath)).result;
  const existing = project.deployment_configs?.production?.d1_databases || {};
  const name = `${projectName}-growth`;
  let database;
  if (existing.GROWTH_DB?.id) {
    database = (await api(`/d1/database/${existing.GROWTH_DB.id}`)).result;
    if (database.name !== name) throw new Error('GROWTH_DB already belongs to another database; refusing to replace it.');
  } else {
    for (let page = 1; page <= 100; page++) {
      const list = await api(`/d1/database?per_page=100&page=${page}`);
      database = list.result.find(item => item.name === name);
      if (database || list.result.length < 100) break;
      if (page === 100) throw new Error('Database listing was incomplete; no database was created.');
    }
    if (!database) database = (await api('/d1/database', 'POST', { name })).result;
  }
  const schema = await readFile(new URL('./growth-schema.sql', import.meta.url), 'utf8');
  const query = await api(`/d1/database/${database.uuid}/query`, 'POST', { sql: schema });
  if (!query.result?.every(item => item.success)) throw new Error('Growth schema initialization failed; no website deployment was attempted.');
  if (existing.GROWTH_DB?.id !== database.uuid) {
    await api(projectPath, 'PATCH', { deployment_configs: { production: { d1_databases: { ...existing, GROWTH_DB: { id: database.uuid } } } } });
    const verified = (await api(projectPath)).result;
    if (verified.deployment_configs?.production?.d1_databases?.GROWTH_DB?.id !== database.uuid) throw new Error('Growth database binding could not be verified.');
  }
  console.log('Aggregate growth database and production binding are ready.');
  console.log('For the private report, set the Pages production secret GROWTH_REPORT_KEY to a random 24–256 character value before deploying. Keep the key out of GitHub and URLs.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  setupGrowth({ accountId: process.env.CLOUDFLARE_ACCOUNT_ID, projectName: process.env.CLOUDFLARE_PAGES_PROJECT_NAME, token: process.env.CLOUDFLARE_API_TOKEN }).catch(error => { console.error(error.message); process.exitCode = 1; });
}
