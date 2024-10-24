// DOM Elements
const themeIcon = document.getElementById('theme-icon');
const searchButton = document.getElementById('searchButton');
const searchInput = document.getElementById('searchInput');
const expandSearchIcon = document.getElementById('expand-search-icon');
const resultsContainer = document.getElementById('results');
const searchType = document.getElementById('searchType');
const languageFilter = document.getElementById('languageFilter');
const tagFilter = document.getElementById('tagFilter');
const sortFilter = document.getElementById('sortFilter');
const starsFilter = document.getElementById('starsFilter');
const forksFilter = document.getElementById('forksFilter');
const issuesFilter = document.getElementById('issuesFilter');
const gitboardTitle = document.getElementById('gitboard-title');
const toggleFiltersButton = document.getElementById('toggleFiltersButton');
const filtersContainer = document.getElementById('filters');
const filterIcon = document.getElementById('filterIcon');
const loadingBarContainer = document.getElementById('loadingBarContainer');
const loadingBar = document.getElementById('loadingBar');
const bookmarksList = document.getElementById('bookmarksList');
let debounceTimer;
let bookmarks = JSON.parse(localStorage.getItem('gitboardBookmarks')) || [];

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

// Toggle Bookmark (Add/Remove from Saved List)
function toggleBookmark(item) {
    const bookmarkId = `${item.id}-${item.type || 'repo'}`; // Create a unique identifier
    const existingBookmark = bookmarks.find(b => b.id === bookmarkId);
    if (existingBookmark) {
        bookmarks = bookmarks.filter(b => b.id !== bookmarkId);
    } else {
        bookmarks.push({ ...item, id: bookmarkId });
    }
    localStorage.setItem('gitboardBookmarks', JSON.stringify(bookmarks));
    updateBookmarkManager();
}

// Update Bookmark Manager
function updateBookmarkManager() {
    bookmarksList.innerHTML = '';
    if (bookmarks.length === 0) {
        bookmarksList.innerHTML = '<p>No bookmarks yet.</p>';
    } else {
        bookmarks.forEach(bookmark => {
            const bookmarkItem = document.createElement('div');
            bookmarkItem.className = 'saved-item';
            bookmarkItem.innerHTML = `
                <h4>${bookmark.name || bookmark.description}</h4>
                <a href="${bookmark.html_url}" target="_blank" class="button">View on GitHub</a>
                <button class="bookmark-button remove-btn">
                    <span class="material-icons">delete</span> Remove
                </button>
            `;
            const removeButton = bookmarkItem.querySelector('.remove-btn');
            removeButton.addEventListener('click', () => toggleBookmark(bookmark));
            bookmarksList.appendChild(bookmarkItem);
        });
    }
}

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
    tagFilter.value = '';
    sortFilter.value = 'none';
    starsFilter.value = '';
    forksFilter.value = '';
    issuesFilter.value = '';
    resultsContainer.innerHTML = '';
});

// Search Icon Behavior (move cursor to search bar)
expandSearchIcon.addEventListener('click', () => {
    searchInput.focus();
});

// Search Event Listeners with Debouncing and Loading Bar
searchButton.addEventListener('click', () => executeSearch());
searchInput.addEventListener('input', () => {
    showLoadingBar();  // Show loading bar as soon as user starts typing
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(executeSearch, 1000);  // Debouncing with a 1-second delay
});
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') executeSearch();
});

// Search Functionality
function executeSearch() {
    const query = searchInput.value.trim();
    const type = searchType.value;

    if (!query) {
        resultsContainer.innerHTML = '<p>Please enter a search term.</p>';
        return;
    }

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

// Repo Search Functionality with Tag Support
function searchRepos(query) {
    const language = languageFilter.value !== 'none' ? languageFilter.value : '';
    const tag = tagFilter.value.trim();
    const stars = starsFilter.value;
    const forks = forksFilter.value;
    const issues = issuesFilter.value;
    const sort = sortFilter.value !== 'none' ? sortFilter.value : '';

    let url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}`;
    if (language) url += `+language:${encodeURIComponent(language)}`;
    if (tag) url += `+topic:${encodeURIComponent(tag)}`;
    if (stars) url += `+stars:>${stars}`;
    if (forks) url += `+forks:>${forks}`;
    if (issues) url += `+open_issues:>${issues}`;
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
            resultsContainer.innerHTML = '<p>Failed to load results. Please try again later.</p>';
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
            resultsContainer.innerHTML = '<p>Failed to load results. Please try again later.</p>';
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
        const isBookmarked = bookmarks.some(b => b.id === `${result.id}-repo`);
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
            toggleBookmark({ ...result, type: 'repo' });
            const newStatus = bookmarks.some(b => b.id === `${result.id}-repo`) ? 'star' : 'star_outline';
            bookmarkButton.querySelector('.material-icons').textContent = newStatus;
        });

        resultsContainer.appendChild(item);
    });

    updateBookmarkManager();
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
        const isBookmarked = bookmarks.some(b => b.id === `${gist.id}-gist`);
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
            toggleBookmark({ ...gist, type: 'gist' });
            const newStatus = bookmarks.some(b => b.id === `${gist.id}-gist`) ? 'star' : 'star_outline';
            bookmarkButton.querySelector('.material-icons').textContent = newStatus;
        });

        resultsContainer.appendChild(item);
    });

    updateBookmarkManager();
}

// Display User Results
function displayUserResults(users) {
    resultsContainer.innerHTML = '';
    if (!users || users.length === 0) {
        resultsContainer.innerHTML = '<p>No users found.</p>';
        return;
    }

    users.forEach(user => {
        const item = document.createElement('div');
        item.className = 'result-item';

        const profilePic = `<img src="${user.avatar_url}" alt="${user.login}'s profile picture" class="profile-picture">`;

        item.innerHTML = `
            ${profilePic}
            <h3>${user.login}</h3>
            <a href="${user.html_url}" target="_blank" class="button">View Profile on GitHub</a>
        `;

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
    loadingBarContainer.classList.add('hidden');
    loadingBar.style.width = '0%';
}
