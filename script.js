// DOM Elements
const lightIcon = document.getElementById('light-icon');
const darkIcon = document.getElementById('dark-icon');
const searchButton = document.getElementById('searchButton');
const resultsContainer = document.getElementById('results');

// Initial Theme Load
const isDarkMode = localStorage.getItem('darkMode') === 'true';
document.body.classList.toggle('dark-mode', isDarkMode);
updateThemeIcons(isDarkMode);

// Theme Switcher
lightIcon.addEventListener('click', () => {
    document.body.classList.add('dark-mode');
    localStorage.setItem('darkMode', 'true');
    updateThemeIcons(true);
});

darkIcon.addEventListener('click', () => {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('darkMode', 'false');
    updateThemeIcons(false);
});

function updateThemeIcons(isDark) {
    if (isDark) {
        lightIcon.style.display = 'none';
        darkIcon.style.display = 'inline';
    } else {
        lightIcon.style.display = 'inline';
        darkIcon.style.display = 'none';
    }
}

// GitHub API Search
searchButton.addEventListener('click', () => {
    const query = document.getElementById('searchInput').value.trim();
    if (query === '') return;
    searchGitHub(query);
});

function searchGitHub(query) {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            displayResults(data.items);
        })
        .catch(error => {
            console.error('Error fetching GitHub data:', error);
        });
}

function displayResults(results) {
    resultsContainer.innerHTML = '';

    if (results.length === 0) {
        resultsContainer.innerHTML = '<p>No results found</p>';
        return;
    }

    results.forEach(result => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.innerHTML = `
            <h3>${result.name}</h3>
            <p>${result.description || 'No description available'}</p>
            <a href="${result.html_url}" target="_blank">View on GitHub</a>
        `;
        resultsContainer.appendChild(resultItem);
    });
}
