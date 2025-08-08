# Developer Guide

This repository includes a minimal Node.js server that fetches and caches GitHub repositories for the configured user, serves a small SPA for viewing/searching, and runs an async background job to refresh the JSON cache while respecting API rate limits.

## Quickstart

1. Create .env

```powershell
copy .env.example .env
```

Edit `.env` and set `GITHUB_TOKEN` (recommended) and verify `GITHUB_USERNAME`.

1. Install dependencies

```powershell
npm install
```

1. Initial fetch (creates data/repos.json)

```powershell
npm run fetch
```

1. Start the server

```powershell
npm run dev
```

Open <http://localhost:3000> in your browser.

## Environment variables

- `GITHUB_USERNAME` (default: `AswinBarath`)
- `GITHUB_TOKEN` (optional but increases limits to 5k/hr)
- `UPDATE_INTERVAL_MS` (default: 7,200,000 = 2 hours)
- `RATE_LIMIT_BUFFER` (default: 0.2 = 20%)
- `CACHE_TTL_MS` (client hint; default: 86,400,000 = 1 day)
- `PORT` (default: 3000)

## Create a GitHub Personal Access Token

You can use either a Fine-grained PAT (preferred) or a Classic PAT.

### Option A: Fine-grained personal access token (recommended)

1. Go to <https://github.com/settings/tokens?type=beta>
2. Click "Generate new token" → "Generate new token" under Fine-grained tokens
3. Name the token (e.g., "Repo Visualizer") and set an expiration (e.g., 90 days)
4. Resource owner: select your user account
5. Repository access: "All repositories" (or choose specific repos if you prefer)
6. Permissions (minimum needed for read-only):
	- Repository permissions → Metadata: Read
	- Repository permissions → Contents: Read (optional, only if you plan to read files)
7. Click "Generate token" and copy the token value
8. Put it in your `.env` as `GITHUB_TOKEN=...`

### Option B: Classic personal access token

1. Go to <https://github.com/settings/tokens>
2. Click "Generate new token (classic)"
3. Name the token and set an expiration
4. Scopes (minimum needed):
	- `repo:status` and `public_repo` are sufficient for public repo listing
	- If you need private repos, select `repo` (Full control of private repositories)
5. Generate the token and copy it
6. Put it in your `.env` as `GITHUB_TOKEN=...`

Notes

- Tokens are secret—do not commit `.env` to version control. `.gitignore` already excludes it.
- Fine-grained tokens limit blast radius and are preferred where possible.
- Authenticated requests increase rate limits to 5,000/hr; unauthenticated is ~60/hr.

## Implementation notes

- Uses the public GitHub REST API, paginated at 100 per page.
- Caches only necessary repo fields to keep JSON small.
- Background scheduler checks the rate limit before fetching.
- If remaining/limit < buffer, the update is skipped to preserve room for interactive API needs.
- Client fetches `/api/repos` and performs in-memory filtering/sorting for instant UX.

## Future improvements

- Persist ETag/If-None-Match and only fetch changed pages.
- Add GitHub GraphQL for richer fields with fewer requests.
- Virtualize the grid for very large repo counts.
- Add PWA and offline support.
- Add tests and CI.
