// DOM Elements
const themeIcon = document.getElementById('theme-icon');
const searchButton = document.getElementById('searchButton');
const searchInput = document.getElementById('searchInput');
const expandSearchIcon = document.getElementById('expand-search-icon');
const resultsContainer = document.getElementById('results');
const featuredContainer = document.getElementById('featured');
const searchType = document.getElementById('searchType');
const languageFilter = document.getElementById('languageFilter');
const sortFilter = document.getElementById('sortFilter');
const gitboardTitle = document.getElementById('gitboard-title');
const toggleFiltersButton = document.getElementById('toggleFiltersButton');
const filtersContainer = document.getElementById('filters');
const filterIcon = document.getElementById('filterIcon');
const loadingBarContainer = document.getElementById('loadingBarContainer');
const loadingBar = document.getElementById('loadingBar');
let debounceTimer;
let bookmarks = JSON.parse(localStorage.getItem('gitboardBookmarks')) || []; // Initialize bookmarks

// Load Theme with Dark Mode Sync
document.body.classList.toggle('dark-mode', localStorage.getItem('darkMode') === 'true');
updateThemeIcon();
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark-mode');
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    const isDarkMode = event.matches;
    document.body.classList.toggle('dark-mode', isDarkMode);
    updateThemeIcon();
});

// Theme Switcher
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
    resultsContainer.innerHTML = '';
    loadFeaturedRepos();
});

// Search Icon Behavior (move cursor to search bar)
expandSearchIcon.addEventListener('click', () => {
    searchInput.focus();
});

// Search Event Listeners with Debouncing and Loading Bar
searchButton.addEventListener('click', () => executeSearch());
searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(executeSearch, 1000);  // Debouncing with a 1-second delay
    showLoadingBar();  // Show loading bar when typing
});
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') executeSearch();
});

// Search Functionality
function executeSearch() {
    const query = searchInput.value.trim();
    const type = searchType.value;
    
    if (!query) return;
    
    if (type === 'repo') {
        filtersContainer.classList.remove('hidden');
        searchRepos(query);
    } else if (type === 'gist') {
        filtersContainer.classList.add('hidden');
        searchGists(query);
    } else {
        filtersContainer.classList.add('hidden');
        searchUsers(query);
    }
}

// Repo Search Functionality
function searchRepos(query) {
    const language = languageFilter.value !== 'none' ? languageFilter.value : '';
    const sort = sortFilter.value !== 'none' ? sortFilter.value : '';

    let url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}`;
    if (language) url += `+language:${encodeURIComponent(language)}`;
    if (sort) url += `&sort=${sort}`;

    showLoadingBar();
    fetch(url)
        .then(res => res.json())
        .then(data => {
            hideLoadingBar();
            displayRepoResults(data.items);
        })
        .catch(err => {
            console.error('GitHub API error:', err);
            hideLoadingBar();
        });
}

// Gist Search Functionality
function searchGists(query) {
    showLoadingBar();
    fetch(`https://api.github.com/gists?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
            hideLoadingBar();
            displayGistResults(data);
        })
        .catch(err => {
            console.error('GitHub API error:', err);
            hideLoadingBar();
        });
}

// Display Repo Results with Bookmarking
function displayRepoResults(results) {
    resultsContainer.innerHTML = '';
    if (!results || results.length === 0) {
        resultsContainer.innerHTML = '<p>No results found.</p>';
        return;
    }

    results.forEach(result => {
        const item = document.createElement('div');
        item.className = 'result-item';

        // Bookmarking logic
        const isBookmarked = bookmarks.some(b => b.id === result.id);
        const bookmarkIcon = isBookmarked ? 'star' : 'star_outline';

        // Repo HTML
        item.innerHTML = `
            <h3>${result.name}</h3>
            <p>${result.description || 'No description available'}</p>
            <button class="bookmark-button">
                <span class="material-icons">${bookmarkIcon}</span>
            </button>
            <a href="${result.html_url}" target="_blank" class="button">View Repo on GitHub</a>
        `;

        // Bookmarking functionality
        const bookmarkButton = item.querySelector('.bookmark-button');
        bookmarkButton.addEventListener('click', () => {
            toggleBookmark(result);
            bookmarkButton.querySelector('.material-icons').textContent = isBookmarked ? 'star_outline' : 'star';
        });

        resultsContainer.appendChild(item);
    });
}

// Display Gist Results with Bookmarking
function displayGistResults(gists) {
    resultsContainer.innerHTML = '';
    if (!gists || gists.length === 0) {
        resultsContainer.innerHTML = '<p>No gists found.</p>';
        return;
    }

    gists.forEach(gist => {
        const item = document.createElement('div');
        item.className = 'result-item';

        // Bookmarking logic
        const isBookmarked = bookmarks.some(b => b.id === gist.id);
        const bookmarkIcon = isBookmarked ? 'star' : 'star_outline';

        // Gist HTML
        item.innerHTML = `
            <h3>${gist.description || 'No description available'}</h3>
            <button class="bookmark-button">
                <span class="material-icons">${bookmarkIcon}</span>
            </button>
            <a href="${gist.html_url}" target="_blank" class="button">View Gist on GitHub</a>
        `;

        // Bookmarking functionality
        const bookmarkButton = item.querySelector('.bookmark-button');
        bookmarkButton.addEventListener('click', () => {
            toggleBookmark(gist);
            bookmarkButton.querySelector('.material-icons').textContent = isBookmarked ? 'star_outline' : 'star';
        });

        resultsContainer.appendChild(item);
    });
}

// Toggle Bookmark Functionality
function toggleBookmark(item) {
    const existingBookmark = bookmarks.find(b => b.id === item.id);
    if (existingBookmark) {
        bookmarks = bookmarks.filter(b => b.id !== item.id);
    } else {
        bookmarks.push(item);
    }
    localStorage.setItem('gitboardBookmarks', JSON.stringify(bookmarks));
}

// User Search Functionality
function searchUsers(query) {
    showLoadingBar();
    fetch(`https://api.github.com/search/users?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
            hideLoadingBar();
            displayUserResults(data.items);
        })
        .catch(err => {
            console.error('GitHub API error:', err);
            hideLoadingBar();
        });
}

// Display User Results with Contributions
function displayUserResults(users) {
    resultsContainer.innerHTML = '';
    if (!users || users.length === 0) {
        resultsContainer.innerHTML = '<p>No users found.</p>';
        return;
    }

    users.forEach(user => {
        const item = document.createElement('div');
        item.className = 'result-item';

        const profilePic = `<img src="${user.avatar_url}" alt="${user.login} Profile Picture" class="profile-picture">`;

        item.innerHTML = `
            ${profilePic}
            <h3>${user.login}</h3>
            <p>Contributions: <span id="contributions-${user.login}">Loading...</span></p>
            <a href="${user.html_url}" target="_blank" class="button">View Profile on GitHub</a>
            <button class="expand-repos button">
                <span class="material-icons">folder_open</span> Show Repos
            </button>
            <div class="user-repos hidden"></div>
        `;

        const toggleReposButton = item.querySelector('.expand-repos');
        const repoContainer = item.querySelector('.user-repos');
        let isReposVisible = false;

        // Fetch Contributions and Repos
        fetch(`https://api.github.com/users/${user.login}/repos`)
            .then(res => res.json())
            .then(repos => {
                const contributions = repos.reduce((total, repo) => total + repo.contributors_count, 0);
                document.getElementById(`contributions-${user.login}`).textContent = contributions;

                toggleReposButton.addEventListener('click', () => {
                    if (isReposVisible) {
                        repoContainer.classList.add('hidden');
                        toggleReposButton.innerHTML = `<span class="material-icons">folder_open</span> Show Repos`;
                    } else {
                        repoContainer.innerHTML = '';
                        repoContainer.classList.remove('hidden');
                        repos.forEach(repo => {
                            repoContainer.innerHTML += `<p><a href="${repo.html_url}" target="_blank"><span class="material-icons">code</span> ${repo.name}</a></p>`;
                        });
                        toggleReposButton.innerHTML = `<span class="material-icons">folder_open</span> Hide Repos (${repos.length})`;
                    }
                    isReposVisible = !isReposVisible;
                });
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

// Load Featured Repos
function loadFeaturedRepos() {
    fetch('https://api.github.com/repositories')
        .then(res => res.json())
        .then(data => {
            featuredContainer.innerHTML = ''; // Clear previous featured repos
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
        })
        .catch(err => console.error('Error fetching featured repos:', err));
}

// Load featured repos on page load
loadFeaturedRepos();
