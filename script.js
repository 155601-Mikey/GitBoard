// DOM Elements
const themeIcon = document.getElementById('theme-icon');
const searchButton = document.getElementById('searchButton');
const searchInput = document.getElementById('searchInput');
const expandSearchIcon = document.getElementById('expand-search-icon');
const resultsContainer = document.getElementById('results');
const featuredContainer = document.getElementById('featured');
const customFeaturedRepos = document.getElementById('customFeaturedRepos');
const searchType = document.getElementById('searchType');
const languageFilter = document.getElementById('languageFilter');
const sortFilter = document.getElementById('sortFilter');
const starsFilter = document.getElementById('starsFilter');
const forksFilter = document.getElementById('forksFilter');
const issuesFilter = document.getElementById('issuesFilter');
const pushedFilter = document.getElementById('pushedFilter');
const topicFilter = document.getElementById('topicFilter');
const gitboardTitle = document.getElementById('gitboard-title');
const toggleFiltersButton = document.getElementById('toggleFiltersButton');
const filtersContainer = document.getElementById('filters');
const filterIcon = document.getElementById('filterIcon');
const skeletonLoaders = document.getElementById('skeletonLoaders');
const loadingBar = document.getElementById('loadingBar');
const loadingBarContainer = document.getElementById('loadingBarContainer');
let debounceTimer;

// Load Theme
document.body.classList.toggle('dark-mode', localStorage.getItem('darkMode') === 'true');
updateThemeIcon();

// Theme Switcher (Change pointer style on hover)
themeIcon.addEventListener('mouseover', () => {
    document.body.style.cursor = 'pointer';
});
themeIcon.addEventListener('mouseleave', () => {
    document.body.style.cursor = 'default';
});
themeIcon.addEventListener('click', () => {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    updateThemeIcon();
});

function updateThemeIcon() {
    themeIcon.textContent = document.body.classList.contains('dark-mode') ? 'dark_mode' : 'light_mode';
}

// Toggle Filters Button with Icon
toggleFiltersButton.addEventListener('click', () => {
    filtersContainer.classList.toggle('hidden');
    filterIcon.textContent = filtersContainer.classList.contains('hidden') ? 'expand_more' : 'expand_less';
});

// GitBoard Title Click (Reset search and filters)
gitboardTitle.addEventListener('click', () => {
    searchInput.value = '';
    languageFilter.value = 'none';
    sortFilter.value = 'none';
    starsFilter.value = '';
    forksFilter.value = '';
    issuesFilter.value = '';
    pushedFilter.value = '';
    topicFilter.value = '';
    resultsContainer.innerHTML = '';
    loadFeaturedRepos();
});

// Search Icon Behavior (move cursor to search bar)
expandSearchIcon.addEventListener('click', () => {
    searchInput.focus();
});

// Search Event Listeners with Debouncing
searchButton.addEventListener('click', () => executeSearch());
searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(executeSearch, 1000);  // Debouncing with a 1-second delay
    showSkeletonLoaders();  // Show skeleton loaders when typing
});
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') executeSearch();
});

function executeSearch() {
    const query = searchInput.value.trim();
    const type = searchType.value;
    
    if (!query) return;
    
    if (type === 'repo') {
        filtersContainer.classList.remove('hidden');  // Show filters for repo search
        searchRepos(query);
    } else if (type === 'gist') {
        filtersContainer.classList.add('hidden');  // Hide filters for gists search
        searchGists(query);
    } else {
        filtersContainer.classList.add('hidden');  // Hide filters for user search
        searchUsers(query);
    }
}

// Repo Search Functionality
function searchRepos(query) {
    const language = languageFilter.value !== 'none' ? languageFilter.value : '';
    const stars = starsFilter.value;
    const forks = forksFilter.value;
    const issues = issuesFilter.value;
    const pushed = pushedFilter.value;
    const topic = topicFilter.value;
    const sort = sortFilter.value !== 'none' ? sortFilter.value : '';

    let url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}`;
    if (language) url += `+language:${encodeURIComponent(language)}`;
    if (stars) url += `+stars:>${stars}`;
    if (forks) url += `+forks:>${forks}`;
    if (issues) url += `+open_issues:>${issues}`;
    if (pushed) url += `+pushed:>${pushed}`;
    if (topic) url += `+topic:${encodeURIComponent(topic)}`;
    if (sort) url += `&sort=${sort}`;

    showLoadingBar();
    fetch(url)
        .then(res => res.json())
        .then(data => {
            hideLoadingBar();
            hideSkeletonLoaders();
            displayRepoResults(data.items);
        })
        .catch(err => {
            console.error('GitHub API error:', err);
            hideLoadingBar();
            hideSkeletonLoaders();
        });
}

// Gist Search Functionality
function searchGists(query) {
    showLoadingBar();
    fetch(`https://api.github.com/search/gists?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
            hideLoadingBar();
            hideSkeletonLoaders();
            displayGistResults(data.items);
        })
        .catch(err => {
            console.error('GitHub API error:', err);
            hideLoadingBar();
            hideSkeletonLoaders();
        });
}

// Display Repo Results
function displayRepoResults(results) {
    resultsContainer.innerHTML = '';
    if (!results || results.length === 0) {
        resultsContainer.innerHTML = '<p>No results found.</p>';
        return;
    }

    results.forEach(result => {
        const item = document.createElement('div');
        item.className = 'result-item';
        
        // GitHub Pages Link (if available)
        let pagesLink = '';
        if (result.has_pages && result.homepage) {
            pagesLink = `<a href="${result.homepage}" target="_blank" class="button">View GitHub Pages</a>`;
        }

        // Include owner profile picture above the repo name
        const ownerProfilePic = `<img src="${result.owner.avatar_url}" alt="${result.owner.login} Profile Picture" class="profile-picture">`;

        item.innerHTML = `
            ${ownerProfilePic}
            <h3>${result.name}</h3>
            <p>${result.description.length > 200 ? result.description.substring(0, 200) + '...' : result.description || 'No description available'}</p>
            <div class="stats">
                <span>${result.stargazers_count} Stars</span> •
                <span>${result.forks_count} Forks</span> •
                <span>${result.watchers_count} Watchers</span>
            </div>
            <p>Creator: <img src="${result.owner.avatar_url}" class="profile-picture small-pic"> ${result.owner.login}</p>
            <a href="${result.html_url}" target="_blank" class="button">View Repo on GitHub</a>
            ${pagesLink}
        `;
        resultsContainer.appendChild(item);
    });
}

// Display Gist Results
function displayGistResults(gists) {
    resultsContainer.innerHTML = '';
    if (!gists || gists.length === 0) {
        resultsContainer.innerHTML = '<p>No gists found.</p>';
        return;
    }

    gists.forEach(gist => {
        const item = document.createElement('div');
        item.className = 'result-item';

        const ownerProfilePic = `<img src="${gist.owner.avatar_url}" alt="${gist.owner.login} Profile Picture" class="profile-picture">`;

        item.innerHTML = `
            ${ownerProfilePic}
            <h3>${gist.description || 'No description available'}</h3>
            <p><strong>Files:</strong> ${Object.keys(gist.files).join(', ')}</p>
            <p><strong>Created:</strong> ${new Date(gist.created_at).toLocaleDateString()}</p>
            <p><strong>Updated:</strong> ${new Date(gist.updated_at).toLocaleDateString()}</p>
            <a href="${gist.html_url}" target="_blank" class="button">View Gist on GitHub</a>
        `;
        resultsContainer.appendChild(item);
    });
}

// User Search Functionality
function searchUsers(query) {
    showLoadingBar();
    fetch(`https://api.github.com/search/users?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
            hideLoadingBar();
            hideSkeletonLoaders();
            displayUserResults(data.items);
        })
        .catch(err => {
            console.error('GitHub API error:', err);
            hideLoadingBar();
            hideSkeletonLoaders();
        });
}

// Display User Results with Repo Links
function displayUserResults(users) {
    resultsContainer.innerHTML = '';
    if (!users || users.length === 0) {
        resultsContainer.innerHTML = '<p>No users found.</p>';
        return;
    }

    users.forEach(user => {
        const item = document.createElement('div');
        item.className = 'result-item';

        // Include profile picture
        const profilePic = `<img src="${user.avatar_url}" alt="${user.login} Profile Picture" class="profile-picture">`;
        
        item.innerHTML = `
            ${profilePic}
            <h3>${user.login}</h3>
            <a href="${user.html_url}" target="_blank" class="button">View Profile on GitHub</a>
            <button class="expand-repos button">
                <span class="material-icons">folder_open</span> Show Repos
            </button>
            <div class="user-repos hidden"></div>
        `;
        
        // Add functionality to load user repos
        const toggleReposButton = item.querySelector('.expand-repos');
        const repoContainer = item.querySelector('.user-repos');
        let isReposVisible = false;

        toggleReposButton.addEventListener('click', () => {
            if (isReposVisible) {
                repoContainer.classList.add('hidden');
                toggleReposButton.innerHTML = `<span class="material-icons">folder_open</span> Show Repos`;
            } else {
                fetch(`https://api.github.com/users/${user.login}/repos`)
                    .then(res => res.json())
                    .then(repos => {
                        repoContainer.innerHTML = '';
                        repoContainer.classList.remove('hidden');
                        repos.forEach(repo => {
                            repoContainer.innerHTML += `<p><a href="${repo.html_url}" target="_blank"><span class="material-icons">code</span> ${repo.name}</a></p>`;
                        });
                        toggleReposButton.innerHTML = `<span class="material-icons">folder_open</span> Hide Repos (${repos.length})`;
                    });
            }
            isReposVisible = !isReposVisible;
        });

        resultsContainer.appendChild(item);
    });
}

// Show and Hide Loading Bar
function showLoadingBar() {
    loadingBarContainer.classList.remove('hidden');
    loadingBar.style.width = '0%';
    setTimeout(() => loadingBar.style.width = '100%', 100);
}

function hideLoadingBar() {
    setTimeout(() => {
        loadingBarContainer.classList.add('hidden');
        loadingBar.style.width = '0%';
    }, 500);
}

// Show and Hide Skeleton Loaders
function showSkeletonLoaders() {
    skeletonLoaders.classList.remove('hidden');
}

function hideSkeletonLoaders() {
    skeletonLoaders.classList.add('hidden');
}

// Load Featured Repos (with customization support)
function loadFeaturedRepos() {
    fetch('https://api.github.com/repositories')
        .then(res => res.json())
        .then(data => {
            featuredContainer.innerHTML = ''; // Clear previous featured repos
            customFeaturedRepos.innerHTML = ''; // Clear customizable featured repos
            const mostVisited = data.slice(0, 3);  // Mock for "most visited"
            const recentlyCreated = data
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .filter(repo => !mostVisited.some(r => r.id === repo.id))
                .slice(0, 3);
            
            // Add default featured repos
            [...mostVisited, ...recentlyCreated].forEach(repo => {
                const item = document.createElement('div');
                item.className = 'featured-item';
                item.innerHTML = `
                    <h3>${repo.name}</h3>
                    <p>${repo.description || 'No description available'}</p>
                    <a href="${repo.html_url}" target="_blank" class="button">View Repo on GitHub</a>
                `;
                featuredContainer.appendChild(item);
            });

            // Add customization option for featured repos
            const customRepos = prompt('Enter the names of featured repos, separated by commas (e.g., react, vue, angular):');
            if (customRepos) {
                customRepos.split(',').forEach(repoName => {
                    const customRepoItem = document.createElement('div');
                    customRepoItem.className = 'featured-item';
                    customRepoItem.innerHTML = `<h3>${repoName.trim()}</h3>`;
                    customFeaturedRepos.appendChild(customRepoItem);
                });
            }
        })
        .catch(err => console.error('Error fetching featured repos:', err));
}

// Load featured repos on page load
loadFeaturedRepos();
