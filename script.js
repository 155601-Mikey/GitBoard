// DOM Elements
const themeIcon = document.getElementById('theme-icon');
const searchButton = document.getElementById('searchButton');
const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('results');
const featuredContainer = document.getElementById('featured');
const searchType = document.getElementById('searchType');
const languageFilter = document.getElementById('languageFilter');
const popularityFilter = document.getElementById('popularityFilter');
const prevPageButton = document.getElementById('prevPage');
const nextPageButton = document.getElementById('nextPage');
const gitboardTitle = document.getElementById('gitboard-title');
let currentPage = 1;
let currentSearchType = 'repo';
let totalPages = 1;

// Load Theme
document.body.classList.toggle('dark-mode', localStorage.getItem('darkMode') === 'true');
updateThemeIcon();

// Theme Switcher
themeIcon.addEventListener('click', () => {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    updateThemeIcon();
});

function updateThemeIcon() {
    themeIcon.textContent = document.body.classList.contains('dark-mode') ? 'dark_mode' : 'light_mode';
}

// GitBoard Title Click (Reset search and filters)
gitboardTitle.addEventListener('click', () => {
    searchInput.value = '';
    languageFilter.value = '';
    popularityFilter.value = 'stars';
    resultsContainer.innerHTML = '';
    loadFeaturedRepos();
});

// Search Event Listeners
searchButton.addEventListener('click', () => executeSearch());
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') executeSearch();
});

function executeSearch() {
    const query = searchInput.value.trim();
    const language = languageFilter.value;
    const popularity = popularityFilter.value;
    
    if (!query) return;
    
    let url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}`;
    
    if (language) url += `+language:${encodeURIComponent(language)}`;
    url += `&sort=${popularity}&order=desc`;
    
    fetch(url)
        .then(res => res.json())
        .then(data => {
            displayResults(data.items);
            totalPages = Math.ceil(data.items.length / 30);
            updatePagination();
        })
        .catch(err => console.error('GitHub API error:', err));
}

// Display Repositories with Pagination
function displayResults(results) {
    resultsContainer.innerHTML = '';
    if (!results || results.length === 0) {
        resultsContainer.innerHTML = '<p>No results found.</p>';
        return;
    }

    results.slice((currentPage - 1) * 30, currentPage * 30).forEach(result => {
        const item = document.createElement('div');
        item.className = 'result-item';
        item.innerHTML = `
            <h3>${result.name}</h3>
            <p>${result.description || 'No description available'}</p>
            <p><strong>Owner:</strong> ${result.owner.login}</p>
            <p><strong>Stars:</strong> ${result.stargazers_count}, <strong>Forks:</strong> ${result.forks_count}, <strong>Watchers:</strong> ${result.watchers_count}</p>
            <a href="${result.html_url}" target="_blank" class="button">View Repo on GitHub</a>
        `;
        resultsContainer.appendChild(item);
    });
}

// Pagination Update and Event Handlers
function updatePagination() {
    prevPageButton.classList.toggle('hidden', currentPage === 1);
    nextPageButton.classList.toggle('hidden', currentPage >= totalPages);
}

prevPageButton.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        executeSearch();
    }
});

nextPageButton.addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        executeSearch();
    }
});

// Featured Repos - Most Visited and Recently Created
function loadFeaturedRepos() {
    fetch('https://api.github.com/repositories')
        .then(res => res.json())
        .then(data => {
            featuredContainer.innerHTML = '';
            const mostVisited = data.slice(0, 3);  // Mock for "most visited"
            const recentlyCreated = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3);
            
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
