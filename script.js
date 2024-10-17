// DOM Elements
const themeIcon = document.getElementById('theme-icon');
const searchButton = document.getElementById('searchButton');
const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('results');
const savedContainer = document.getElementById('bookmarksList');
const searchType = document.getElementById('searchType');
const languageFilter = document.getElementById('languageFilter');
const tagFilter = document.getElementById('tagFilter');
const sortFilter = document.getElementById('sortFilter');
let debounceTimer;
let bookmarks = JSON.parse(localStorage.getItem('gitboardBookmarks')) || [];

// Load Theme with Dark Mode Sync
document.body.classList.toggle('dark-mode', localStorage.getItem('darkMode') === 'true');
updateThemeIcon();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    const isDarkMode = event.matches;
    document.body.classList.toggle('dark-mode', isDarkMode);
    updateThemeIcon();
});

function updateThemeIcon() {
    themeIcon.textContent = document.body.classList.contains('dark-mode') ? 'dark_mode' : 'light_mode';
}

// Toggle Bookmark (Add/Remove from Saved List)
function toggleBookmark(item) {
    const existingBookmark = bookmarks.find(b => b.id === item.id);
    if (existingBookmark) {
        bookmarks = bookmarks.filter(b => b.id !== item.id);
    } else {
        bookmarks.push(item);
    }
    localStorage.setItem('gitboardBookmarks', JSON.stringify(bookmarks));
    updateSavedList();
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

// Display Saved List
function updateSavedList() {
    savedContainer.innerHTML = '';
    if (bookmarks.length === 0) {
        savedContainer.innerHTML = '<p>No bookmarks yet.</p>';
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
            removeButton.addEventListener('click', () => {
                toggleBookmark(bookmark);
            });
            savedContainer.appendChild(bookmarkItem);
        });
    }
}

// Search Event Listeners with Debouncing and Loading Bar
searchButton.addEventListener('click', () => executeSearch());
searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(executeSearch, 1000);  // Debouncing with a 1-second delay
    showLoadingBar();
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
        searchRepos(query);
    } else if (type === 'gist') {
        searchGists(query);
    } else {
        searchUsers(query);
    }
}

// Repo Search Functionality
function searchRepos(query) {
    let url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}`;
    const language = languageFilter.value !== 'none' ? languageFilter.value : '';
    const tag = tagFilter.value.trim();
    const sort = sortFilter.value !== 'none' ? sortFilter.value : '';

    if (language) url += `+language:${encodeURIComponent(language)}`;
    if (tag) url += `+topic:${encodeURIComponent(tag)}`;
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

// Load Saved List on Page Load
updateSavedList();
