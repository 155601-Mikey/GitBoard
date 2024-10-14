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

// Mock Search Functionality
searchButton.addEventListener('click', () => {
    const query = document.getElementById('searchInput').value.trim();
    if (query === '') return;
    resultsContainer.innerHTML = '';
    
    // Simulate search results
    const mockResults = [
        { name: 'Repo1', description: 'A cool GitHub repository', url: '#' },
        { name: 'Repo2', description: 'Another awesome project', url: '#' }
    ];

    mockResults.forEach(result => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.innerHTML = `
            <h3>${result.name}</h3>
            <p>${result.description}</p>
            <a href="${result.url}" target="_blank">View on GitHub</a>
        `;
        resultsContainer.appendChild(resultItem);
    });
});
