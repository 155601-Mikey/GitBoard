// DOM Elements
const themeIcon = document.getElementById('theme-icon');
const searchButton = document.getElementById('searchButton');
const searchInput = document.getElementById('searchInput');
const expandSearchIcon = document.getElementById('expand-search-icon');
const resultsContainer = document.getElementById('results');
const featuredContainer = document.getElementById('featured');
const searchType = document.getElementById('searchType');
const languageFilter = document.getElementById('languageFilter');
const popularityFilter = document.getElementById('popularityFilter');
const licenseFilter = document.getElementById('licenseFilter');
const dateFilter = document.getElementById('dateFilter');
const gitboardTitle = document.getElementById('gitboard-title');
const loadingBar = document.getElementById('loadingBar');
const loadingBarContainer = document.getElementById('loadingBarContainer');

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
    languageFilter.value = 'none';
    popularityFilter.value = 'none';
    licenseFilter.value = 'none';
    dateFilter.value = '';
    resultsContainer.innerHTML = '';
    loadFeaturedRepos();
});

// Search Icon Behavior (move cursor to search bar)
expandSearchIcon.addEventListener('click', () => {
    searchInput.focus();
});

// Search Event Listeners
searchButton.addEventListener('click', () => executeSearch());
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') executeSearch();
});

function executeSearch() {
    const query = searchInput.value.trim();
    const type = searchType.value;
    
    if (!query) return;
    
    if (type === 'repo') {
        searchRepos(query);
    } else {
        searchUsers(query);
    }
}

// Repo Search Functionality
function searchRepos(query) {
    const language = languageFilter.value !== 'none' ? languageFilter.value : '';
    const popularity = popularityFilter.value !== 'none' ? popularityFilter.value : '';
    const license = licenseFilter.value !== 'none' ? licenseFilter.value : '';
    const date = dateFilter.value;
    
    let url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}`;
    if (language) url += `+language:${encodeURIComponent(language)}`;
    if (license) url += `+license:${encodeURIComponent(license)}`;
    if (date) url += `+created:>${date}`;
    if (popularity) url += `&sort=${popularity}&order=desc`;

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
        
        item.innerHTML = `
            <h3>${result.name}</h3>
            <p>${result.description || 'No description available'}</p>
            <div class="stats">
                <span>${result.stargazers_count} Stars</span> •
                <span>${result.forks_count} Forks</span> •
                <span>${result.watchers_count} Watchers</span>
            </div>
            <a href="${result.html_url}" target="_blank" class="button">View Repo on GitHub</a>
            ${pagesLink}
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
            displayUserResults(data.items);
        })
        .catch(err => {
            console.error('GitHub API error:', err);
            hideLoadingBar();
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
        
        item.innerHTML = `
            <h3>${user.login}</h3>
            <a href="${user.html_url}" target="_blank" class="button">View Profile on GitHub</a>
            <button class="expand-repos">Show Repos</button>
            <div class="user-repos hidden"></div>
        `;
        
        // Add functionality to load user repos
        item.querySelector('.expand-repos').addEventListener('click', () => {
            fetch(`https://api.github.com/users/${user.login}/repos`)
                .then(res => res.json())
                .then(repos => {
                    const repoContainer = item.querySelector('.user-repos');
                    repoContainer.innerHTML = '';
                    repoContainer.classList.toggle('hidden');
                    repos.forEach(repo => {
                        repoContainer.innerHTML += `<p><a href="${repo.html_url}" target="_blank"><span class="material-icons">code</span> ${repo.name}</a></p>`;
                    });
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
