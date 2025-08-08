require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'repos.json');
const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'AswinBarath';
const UPDATE_INTERVAL_MS = Number(process.env.UPDATE_INTERVAL_MS || 2 * 60 * 60 * 1000);
const RATE_LIMIT_BUFFER = Number(process.env.RATE_LIMIT_BUFFER || 0.2);

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Serve static client
app.use('/', express.static(path.join(__dirname, '..', 'public')));

// API: get repos from cache
app.get('/api/repos', (req, res) => {
  if (!fs.existsSync(DATA_FILE)) return res.status(404).json({ error: 'Cache not found. Run initial fetch.' });
  try {
    const json = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    res.json(json);
  } catch (e) {
    res.status(500).json({ error: 'Failed reading cache', details: String(e) });
  }
});

// API: status (rate limit + cache info)
app.get('/api/status', async (req, res) => {
  try {
    const token = process.env.GITHUB_TOKEN;
    const headers = token ? { Authorization: `Bearer ${token}`, 'User-Agent': 'repo-visualizer' } : { 'User-Agent': 'repo-visualizer' };
    const rate = await getRateLimit(headers);
    const cache = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) : null;
    res.json({ rate, cacheInfo: cache ? { last_updated: cache.last_updated, total_count: cache.total_count } : null });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get status', details: String(e) });
  }
});

// Internal: update cache now
app.post('/internal/update', async (req, res) => {
  try {
    const result = await fetchAndCacheRepos();
    res.json({ status: 'ok', ...result });
  } catch (e) {
    res.status(500).json({ error: 'Update failed', details: String(e) });
  }
});

async function fetchAndCacheRepos() {
  const token = process.env.GITHUB_TOKEN;
  const headers = token ? { Authorization: `Bearer ${token}`, 'User-Agent': 'repo-visualizer' } : { 'User-Agent': 'repo-visualizer' };

  // Respect rate limit before fetching
  const rate = await getRateLimit(headers);
  if (rate && rate.remaining / rate.limit < RATE_LIMIT_BUFFER) {
    return { skipped: true, reason: 'Rate limit buffer reached', rate };
  }

  // Read existing cache for delta sync (optional)
  let existing = null;
  let lastKnownUpdate = null;
  if (fs.existsSync(DATA_FILE)) {
    try {
      existing = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      if (existing && Array.isArray(existing.repositories)) {
        lastKnownUpdate = existing.repositories.reduce((acc, r) => {
          const t = Date.parse(r.updated_at || r.pushed_at || 0);
          return isNaN(t) ? acc : Math.max(acc, t);
        }, 0);
      }
    } catch {}
  }

  const perPage = 100;
  let page = 1;
  let fetched = [];
  let done = false;

  while (!done) {
    const url = `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=${perPage}&page=${page}&sort=updated`;
    const { data } = await axios.get(url, { headers });
    fetched = fetched.concat(data);

    // If we have a last known update timestamp, stop early when this page is older than it
    if (lastKnownUpdate && data.length > 0) {
      const lastOnPage = data[data.length - 1];
      const lastOnPageTs = Date.parse(lastOnPage.updated_at || lastOnPage.pushed_at || 0);
      if (!isNaN(lastOnPageTs) && lastOnPageTs < lastKnownUpdate) {
        done = true;
      }
    }

    if (data.length < perPage) done = true;
    page += 1;
  }

  // Normalize fields
  const normalize = (r) => ({
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
  });

  let finalRepos = [];
  if (existing && Array.isArray(existing.repositories) && existing.repositories.length && fetched.length && lastKnownUpdate) {
    // Delta merge: update/insert fetched into existing; keep others
    const map = new Map(existing.repositories.map(r => [r.id, r]));
    for (const r of fetched) {
      map.set(r.id, normalize(r));
    }
    finalRepos = Array.from(map.values());
  } else {
    finalRepos = fetched.map(normalize);
  }

  const payload = {
    repositories: finalRepos,
    last_updated: new Date().toISOString(),
    total_count: finalRepos.length,
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf8');
  return { skipped: false, count: fetched.length, merged_count: finalRepos.length };
}

async function getRateLimit(headers) {
  try {
    const { data } = await axios.get('https://api.github.com/rate_limit', { headers });
    const core = data.resources.core;
    return { limit: core.limit, remaining: core.remaining, reset: core.reset };
  } catch {
    return null;
  }
}

// Background scheduler
let timer = null;
function scheduleUpdates() {
  if (timer) clearInterval(timer);
  timer = setInterval(async () => {
    try {
      await fetchAndCacheRepos();
    } catch (e) {
      console.error('Scheduled update failed:', e);
    }
  }, UPDATE_INTERVAL_MS);
}

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  // Ensure cache exists at startup
  if (!fs.existsSync(DATA_FILE)) {
    try { await fetchAndCacheRepos(); } catch (e) { console.warn('Initial fetch failed', e.message); }
  }
  scheduleUpdates();
});
