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
let totalPages = 1;

// Load Theme
document.body.classList.toggle('dark-mode', localStorage.getItem('darkMode') === 'true');

// Toggle Theme
lightIcon.addEventListener('click', () => toggleDarkMode(true));
darkIcon.addEventListener('click', () => toggleDarkMode(false));

function toggleDarkMode(dark) {
    document.body.classList.toggle('dark-mode', dark);
    localStorage.setItem('darkMode', dark);
}

// Search Button and Enter Key Event
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
            totalPages = Math.ceil(data.items.length / 30);
            updatePagination();
        })
        .catch(err => console.error('GitHub API error:', err));
}

// Display repos or users with pagination
function displayResults(results) {
    resultsContainer.innerHTML = '';
    if (!results || results.length === 0) {
        resultsContainer.innerHTML = '<p>No results found.</p>';
        return;
    }

    results.slice((currentPage - 1) * 30, currentPage * 30).forEach(result => {
        const item = document.createElement('div');
        item.className = 'result-item';
        
        if (currentSearchType === 'repo') {
            item.innerHTML = `
                <h3>${result.name}</h3>
                <p>${result.description || 'No description available'}</p>
                <p><strong>Owner:</strong> ${result.owner.login}</p>
                <p><strong>Stars:</strong> ${result.stargazers_count}, <strong>Forks:</strong> ${result.forks_count}, <strong>Watchers:</strong> ${result.watchers_count}</p>
                <a href="${result.html_url}" target="_blank" class="button">View Repo on GitHub</a>
            `;
        } else {
            item.innerHTML = `
                <h3>${result.login}</h3>
                <a href="${result.html_url}" target="_blank" class="button">View Profile on GitHub</a>
                <button class="expand-repos">Show Repos</button>
                <div class="user-repos hidden"></div>
            `;
            
            // Add repo expansion for users
            item.querySelector('.expand-repos').addEventListener('click', () => {
                fetch(`https://api.github.com/users/${result.login}/repos`)
                    .then(res => res.json())
                    .then(repos => {
                        const repoContainer = item.querySelector('.user-repos');
                        repoContainer.innerHTML = '';
                        repoContainer.classList.toggle('hidden');
                        repos.forEach(repo => {
                            repoContainer.innerHTML += `
                                <p><strong>${repo.name}</strong>: ${repo.description || 'No description available'}</p>
                            `;
                        });
                    });
            });
        }
        
        resultsContainer.appendChild(item);
    });
}

// Pagination functions
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
