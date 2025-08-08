require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Reuse the server's fetch function by invoking the server with a one-off update call via curl
// but to keep it self-contained, we'll simply require the server module if it exposes a function.

const serverPath = path.join(__dirname, '..', 'server.js');

(async () => {
  // If server not running, just spawn it once to populate cache via internal function is complex.
  // Simpler: duplicate a minimal fetch routine here.
  const axios = require('axios');

  const DATA_DIR = path.join(__dirname, '..', '..', 'data');
  const DATA_FILE = path.join(DATA_DIR, 'repos.json');
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'AswinBarath';
  const token = process.env.GITHUB_TOKEN;
  const headers = token ? { Authorization: `Bearer ${token}`, 'User-Agent': 'repo-visualizer' } : { 'User-Agent': 'repo-visualizer' };

  const perPage = 100;
  let page = 1;
  let repos = [];
  while (true) {
    const url = `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=${perPage}&page=${page}&sort=updated`;
    const { data } = await axios.get(url, { headers });
    repos = repos.concat(data);
    if (data.length < perPage) break;
    page += 1;
  }

  const payload = {
    repositories: repos.map(r => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      description: r.description,
      language: r.language,
      stargazers_count: r.stargazers_count,
      forks_count: r.forks_count,
      updated_at: r.updated_at,
      pushed_at: r.pushed_at,
      size: r.size,
      private: r.private,
      fork: r.fork,
      html_url: r.html_url,
      clone_url: r.clone_url,
      topics: r.topics,
      archived: r.archived,
      disabled: r.disabled,
      visibility: r.visibility,
    })),
    last_updated: new Date().toISOString(),
    total_count: repos.length,
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`Fetched and cached ${repos.length} repositories to ${DATA_FILE}`);
})();
