const lightIcon = document.getElementById('light-icon');
const darkIcon = document.getElementById('dark-icon');
const searchButton = document.getElementById('searchButton');
const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('results');
const featuredContainer = document.getElementById('featured');
const searchType = document.getElementById('searchType');
const languageFilter = document.getElementById('languageFilter');
const starsFilter = document.getElementById('starsFilter');
const forksFilter = document.getElementById('forksFilter');
const prevPageButton = document.getElementById('prevPage');
const nextPageButton = document.getElementById('nextPage');
let currentPage = 1;
let currentSearchType = 'repo';

// Load Theme
document.body.classList.toggle('dark-mode', localStorage.getItem('darkMode') === 'true');

// Toggle Theme
lightIcon.addEventListener('click', () => toggleDarkMode(true));
darkIcon.addEventListener('click', () => toggleDarkMode(false));

function toggleDarkMode(dark) {
    document.body.classList.toggle('dark-mode', dark);
    localStorage.setItem('darkMode', dark);
}

// Handle search button and enter key
searchButton.addEventListener('click', () => executeSearch());
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') executeSearch();
});

function executeSearch() {
    const query = searchInput.value.trim();
    if (!query) return;
    const type = searchType.value;
    const url = type === 'repo' ? `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}` : `https://api.github.com/search/users?q=${encodeURIComponent(query)}`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            currentSearchType = type;
            displayResults(data.items);
        })
        .catch(err => console.error('GitHub API error:', err));
}

// Display repo or user results
function displayResults(results) {
    resultsContainer.innerHTML = '';
    if (!results || results.length === 0) {
        resultsContainer.innerHTML = '<p>No results found.</p>';
        return;
    }

    results.slice(0, 30).forEach(result => {
        const item = document.createElement('div');
        item.className = 'result-item';
        
        if (currentSearchType === 'repo') {
            item.innerHTML = `
                <h3>${result.name}</h3>
                <p>${result.description || 'No description available'}</p>
                <p><strong>Owner:</strong> ${result.owner.login}</p>
                <a href="${result.html_url}" target="_blank" class="button">View Repo on GitHub</a>
            `;
        } else {
            item.innerHTML = `
                <h3>${result.login}</h3>
                <a href="${result.html_url}" target="_blank" class="button">View Profile on GitHub</a>
            `;
        }
        
        resultsContainer.appendChild(item);
    });
}

// Add pagination (if more than 30 items)
function handlePagination() {
    // Add logic here to manage multi-pages with results
}

// Featured Repos
function loadFeaturedRepos() {
    fetch('https://api.github.com/repositories')
        .then(res => res.json())
        .then(data => {
            featuredContainer.innerHTML = '';
            data.slice(0, 3).forEach(repo => {
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
