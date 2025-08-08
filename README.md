# GitHub Repository Visualizer

A modern, efficient way to visualize and explore your GitHub repositories through an intuitive card-based interface with powerful search capabilities.

## 🎯 Project Vision

This project aims to create a better alternative to GitHub's default repository view by providing:

- **Card-based Interface**: Small, informative cards displaying repository information in a visually appealing grid layout
- **Fast Search & Filter**: Instantly search through repositories without API delays
- **Offline-first Approach**: Cached data for immediate access and reduced API calls
- **Smart Updates**: Intelligent background synchronization respecting GitHub's rate limits

## ✨ Key Features

### 🎴 Repository Cards
- **Compact Design**: Each repository displayed as a small, information-rich card
- **Essential Information**: Repository name, description, language, stars, forks, and last updated
- **Visual Indicators**: Language colors, activity status, and repository type (public/private)
- **Quick Actions**: Direct links to repository, clone URLs, and key files
- **Theming**: Repository title links and highlights use `#4493f8` for visibility

### 🔍 Advanced Search & Filtering

- **Real-time Search**: Instant filtering as you type
- **Multi-criteria Filtering**:
  - Language
  - Repository type (public/private/fork/source/archived)
  - Activity level (last updated)
  - Star count ranges
  - Repository size (KB)
- **Smart Suggestions**: Auto-complete and search suggestions based on repository metadata
- **Saved Filters**: Store frequently used filter combinations

### 📊 Data Management

- **Initial Bulk Fetch**: One-time comprehensive fetch of all repositories
- **JSON Cache**: Local storage of repository data for instant access
- **Rate Limit Compliance**: Intelligent request throttling to respect GitHub's API limits
- **Incremental Updates**: Fetch only changed data during background updates

### 🔄 Background Synchronization

- **Async Updates**: Background process to keep data current
- **Smart Scheduling**: Rate-limit aware update intervals
- **Delta Synchronization**: Only fetch repositories that have changed
- **Error Handling**: Robust retry mechanisms and offline fallback

## 🏗️ Technical Architecture

### Frontend

- **Technology**: Modern web framework (React/Vue/Svelte)
- **Styling**: CSS Grid/Flexbox for responsive card layout
- **State Management**: Efficient local state for search and filtering
- **Performance**: Virtual scrolling for large repository lists

### Backend/API Layer

- **GitHub API Integration**: Official GitHub REST/GraphQL API
- **Data Storage**: JSON file system or lightweight database
- **Caching Strategy**: Multi-layer caching (memory + persistent)
- **Rate Limiting**: Built-in GitHub API rate limit management

### Data Flow

```text
1. Initial Setup
   └── Fetch all repositories → Save to JSON cache → Display cards

2. Regular Operation
   └── Load from cache → Display instantly → Background sync → Update cache

3. Background Updates
   └── Check rate limits → Fetch deltas → Update JSON → Refresh UI
```

## 📋 Implementation Roadmap

### Phase 1: Core Foundation

- [x] Set up project structure and development environment
- [x] Implement GitHub API fetching (with optional auth)
- [x] Create JSON storage system for repository data
- [x] Build basic card component and grid layout

### Phase 2: Search & Filtering

- [x] Implement real-time search functionality
- [x] Add multi-criteria filtering system (type, stars, size)
- [x] Create filter UI components (language, activity, sort)
- [x] Add search result highlighting

### Phase 3: Advanced Features

- [ ] Background synchronization service
- [ ] Rate limit monitoring and management
- [ ] Delta sync for efficient updates
- [ ] Error handling and offline support

### Phase 4: Polish & Optimization
- [ ] Performance optimization (virtual scrolling, lazy loading)
- [ ] UI/UX improvements and animations
- [ ] Accessibility features
- [ ] Documentation and testing

## 🔧 Technical Specifications

### GitHub API Integration
- **Authentication**: Personal Access Token or GitHub App
- **Endpoints**: 
  - `GET /users/{username}/repos` for user repositories
  - `/repos/{owner}/{repo}` for detailed information
  - Rate limit: 5,000 requests/hour for authenticated users

### Data Structure
```json
{
  "repositories": [
    {
      "id": 123456789,
      "name": "repo-name",
      "full_name": "username/repo-name",
      "description": "Repository description",
      "language": "JavaScript",
      "stargazers_count": 42,
      "forks_count": 7,
      "updated_at": "2025-08-08T10:30:00Z",
      "pushed_at": "2025-08-07T15:45:00Z",
      "size": 1024,
      "private": false,
      "fork": false,
      "html_url": "https://github.com/username/repo-name",
      "clone_url": "https://github.com/username/repo-name.git"
    }
  ],
  "last_updated": "2025-08-08T12:00:00Z",
  "total_count": 150
}
```

### Update Strategy
- **Full Sync**: Complete repository list refresh (weekly)
- **Incremental Sync**: Scheduled background updates (default every 2 hours)
- **Rate Limit Buffer**: Maintain 20% buffer for interactive requests
- **Fallback**: Graceful degradation when rate limits are exceeded (skip cycle)

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- GitHub Personal Access Token with `repo` scope
- Modern web browser

### Installation

```powershell
# Clone the repository
git clone https://github.com/AswinBarath/github-repo-visualizer.git
Set-Location github-repo-visualizer

# Install dependencies
npm install

# Set up environment variables
Copy-Item .env.example .env
# Add your GitHub token to .env (optional but recommended)

# Initial data fetch into data/repos.json
npm run fetch

# Start development server
npm run dev
```

### Configuration

```env
GITHUB_USERNAME=AswinBarath
GITHUB_TOKEN=your_personal_access_token_here
UPDATE_INTERVAL_MS=7200000  # default: 2 hours
RATE_LIMIT_BUFFER=0.2       # 20% buffer for rate limits
CACHE_TTL_MS=86400000       # 24 hours cache validity
PORT=3000
```

### Useful endpoints

- GET `/api/repos` — returns cached repository JSON
- GET `/api/status` — returns current rate limit and cache summary
- POST `/internal/update` — triggers a manual cache refresh (rate-limit aware)

## 📈 Performance Goals

- **Initial Load**: < 2 seconds from cache
- **Search Response**: < 100ms for any search query
- **Card Rendering**: Support 1000+ repositories without performance degradation
- **Memory Usage**: < 50MB for typical repository collections
- **API Efficiency**: < 10 API calls per day for regular usage

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on

- Code standards and conventions
- Testing requirements
- Pull request process
- Issue reporting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔮 Future Enhancements

- **Analytics Dashboard**: Repository activity trends and statistics
- **Team Collaboration**: Shared repository collections and team views
- **Integration**: Support for GitLab, Bitbucket, and other Git hosts
- **Mobile App**: Native mobile application for on-the-go repository management
- **Advanced Visualizations**: Dependency graphs, commit activity heatmaps
- **AI-Powered Insights**: Repository recommendations and automated categorization

---

**Built with ❤️ for developers who love organized, efficient repository management.**
