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
const watchersFilter = document.getElementById('watchersFilter');
const issuesFilter = document.getElementById('issuesFilter');
const gitboardTitle = document.getElementById('gitboard-title');
const toggleFiltersButton = document.getElementById('toggleFiltersButton');
const filtersContainer = document.getElementById('filters');
const filterIcon = document.getElementById('filterIcon');
const loadingBarContainer = document.getElementById('loadingBarContainer');
const loadingBar = document.getElementById('loadingBar');
const bookmarksList = document.getElementById('bookmarksList');
const searchHistoryContainer = document.getElementById('searchHistoryContainer');

let debounceTimer;
let currentPage = 1;
let bookmarks = JSON.parse(localStorage.getItem('gitboardBookmarks')) || [];
let searchHistory = JSON.parse(localStorage.getItem('gitboardSearchHistory')) || [];

// Initialize Theme
const storedTheme = localStorage.getItem('darkMode');
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
document.body.classList.toggle('dark-mode', storedTheme === 'true' || (!storedTheme && prefersDarkScheme.matches));
updateThemeIcon();

prefersDarkScheme.addEventListener('change', event => {
    document.body.classList.toggle('dark-mode', event.matches);
    updateThemeIcon();
});

// Helper Functions
function getBookmarkId(item) {
    return `${item.id}-${item.type || 'repo'}`;
}

function fetchFromGitHub(url) {
    showLoadingBar();
    return fetch(url)
        .then(res => res.json())
        .catch(err => {
            console.error('GitHub API error:', err);
            resultsContainer.innerHTML = '<p>Failed to load data. Please try again later.</p>';
        })
        .finally(hideLoadingBar);
}

function updateThemeIcon() {
    themeIcon.textContent = document.body.classList.contains('dark-mode') ? 'dark_mode' : 'light_mode';
}

// Toggle Bookmark (Add/Remove from Saved List)
function toggleBookmark(item) {
    const bookmarkId = getBookmarkId(item);
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

// Toggle Filters Button with Icon
toggleFiltersButton.addEventListener('click', () => {
    filtersContainer.classList.toggle('hidden');
    filterIcon.textContent = filtersContainer.classList.contains('hidden') ? 'expand_more' : 'expand_less';
});

// GitBoard Title Click (Reset search and filters)
gitboardTitle.addEventListener('click', () => {
    resetSearch();
    resultsContainer.innerHTML = '';
});

// Reset Search and Filters
function resetSearch() {
    searchInput.value = '';
    languageFilter.value = 'none';
    tagFilter.value = '';
    sortFilter.value = 'none';
    starsFilter.value = '';
    forksFilter.value = '';
    watchersFilter.value = '';
    issuesFilter.value = '';
}

// Save Search History
function saveSearchHistory(query) {
    if (!searchHistory.includes(query)) {
        searchHistory.push(query);
        if (searchHistory.length > 5) searchHistory.shift();
        localStorage.setItem('gitboardSearchHistory', JSON.stringify(searchHistory));
    }
    updateSearchHistory();
}

// Update Search History Display
function updateSearchHistory() {
    searchHistoryContainer.innerHTML = '';
    searchHistory.forEach(term => {
        const historyItem = document.createElement('div');
        historyItem.className = 'search-history-item';
        historyItem.textContent = term;
        historyItem.addEventListener('click', () => {
            searchInput.value = term;
            executeSearch();
        });
        searchHistoryContainer.appendChild(historyItem);
    });
}

// Unified Search Input Handler with Debounce
function handleSearchInput(e) {
    if (e.type === 'click' || e.key === 'Enter' || e.type === 'input') {
        showLoadingBar();
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(executeSearch, 1000);
    }
}
searchButton.addEventListener('click', handleSearchInput);
searchInput.addEventListener('input', handleSearchInput);
searchInput.addEventListener('keypress', handleSearchInput);

// Infinite Scroll Handler
window.addEventListener('scroll', () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
        loadMoreResults();
    }
});

function loadMoreResults() {
    currentPage++;
    executeSearch(true);
}

// Search Functionality
function executeSearch(appendResults = false) {
    const query = searchInput.value.trim();
    if (!query) {
        resultsContainer.innerHTML = '<p>Please enter a search term.</p>';
        return;
    }
    saveSearchHistory(query);

    const type = searchType.value;
    if (type === 'repo') {
        filtersContainer.classList.remove('hidden');
        searchRepos(query, appendResults);
    } else if (type === 'gist') {
        filtersContainer.classList.add('hidden');
        searchGists(query, appendResults);
    } else {
        filtersContainer.classList.add('hidden');
        searchUsers(query, appendResults);
    }
}

// Repo Search with Filters
function searchRepos(query, appendResults = false) {
    const language = languageFilter.value !== 'none' ? languageFilter.value : '';
    const tag = tagFilter.value.trim();
    const stars = starsFilter.value;
    const forks = forksFilter.value;
    const watchers = watchersFilter.value;
    const sort = sortFilter.value !== 'none' ? sortFilter.value : '';

    let url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}`;
    if (language) url += `+language:${encodeURIComponent(language)}`;
    if (tag) url += `+topic:${encodeURIComponent(tag)}`;
    if (stars) url += `+stars:>${stars}`;
    if (forks) url += `+forks:>${forks}`;
    if (watchers) url += `+watchers:>${watchers}`;
    if (sort) url += `&sort=${sort}`;
    url += `&page=${currentPage}&per_page=10`;

    fetchFromGitHub(url).then(data => {
        if (data && data.items) {
            displayRepoResults(data.items, appendResults);
        } else if (!appendResults) {
            resultsContainer.innerHTML = '<p>No repositories found.</p>';
        }
    });
}

// Display Repo Results
function displayRepoResults(results, appendResults = false) {
    if (!appendResults) resultsContainer.innerHTML = '';
    if (!results || results.length === 0) {
        resultsContainer.innerHTML = '<p>No results found.</p>';
        return;
    }

    results.forEach(result => {
        const item = document.createElement('div');
        item.className = 'result-item';

        const isBookmarked = bookmarks.some(b => b.id === getBookmarkId(result));
        const bookmarkIcon = isBookmarked ? 'star' : 'star_outline';

        const websiteLink = result.homepage ? `<a href="${result.homepage}" target="_blank" class="button">Website</a>` : '';
        item.innerHTML = `
            <h3>${result.name}</h3>
            <p>${result.description || 'No description available'}</p>
            <button class="bookmark-button">
                <span class="material-icons">${bookmarkIcon}</span>
            </button>
            ${websiteLink}
            <a href="${result.html_url}" target="_blank" class="button">View Repo on GitHub</a>
            <p class="repo-stats" style="color: blue;">Stars: ${result.stargazers_count} • Forks: ${result.forks_count} • Watchers: ${result.watchers_count} • Created by <a href="${result.owner.html_url}" target="_blank" style="color: blue;">${result.owner.login}</a></p>
        `;

        const bookmarkButton = item.querySelector('.bookmark-button');
        bookmarkButton.addEventListener('click', () => {
            toggleBookmark({ ...result, type: 'repo' });
            const newStatus = bookmarks.some(b => b.id === getBookmarkId(result)) ? 'star' : 'star_outline';
            bookmarkButton.querySelector('.material-icons').textContent = newStatus;
        });

        resultsContainer.appendChild(item);
    });

    updateBookmarkManager();
}

// Loading Bar Control
function showLoadingBar() {
    loadingBarContainer.classList.remove('hidden');
    loadingBar.style.width = '0%';
    setTimeout(() => loadingBar.style.width = '50%', 200);
    setTimeout(() => loadingBar.style.width = '100%', 400);
}

function hideLoadingBar() {
    loadingBarContainer.classList.add('hidden');
    loadingBar.style.width = '0%';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateBookmarkManager();
    updateSearchHistory();
});
