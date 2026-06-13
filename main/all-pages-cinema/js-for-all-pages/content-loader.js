const TMDB_API_KEY = "0564bb57f02f1478ec594f8c965796b5";

async function fetchTMDB(url, defaultType) {
    try {
        const res = await fetch(url);
        const data = await res.json();

        return data.results.map(item => ({
            id: item.id,
            title: item.title || item.name,
            image: item.poster_path
                ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                : 'https://via.placeholder.com/225x335',
            score: item.vote_average,
            type: item.media_type === 'tv' ? 'Series'
                : item.media_type === 'movie' ? 'Cinema'
                    : defaultType,
            year: (item.release_date || item.first_air_date || 'N/A').substring(0, 4),
            apiSource: 'TMDB',
            mediaType: url.includes('/tv') ? 'tv' : 'movie'
        }));
    } catch (err) {
        return [];
    }
}

async function fetchJikan(type) {
    try {
        const res = await fetch(`https://api.jikan.moe/v4/top/anime?type=${type}&limit=25`);
        const data = await res.json();

        return data.data.map(item => ({
            id: item.mal_id,
            title: item.title_english || item.title,
            image: item.images.jpg.large_image_url,
            score: item.score,
            type: item.type || 'Anime',
            year: item.year || 'N/A',
            apiSource: 'Jikan'
        }));
    } catch (err) {
        return [];
    }
}

let savedTitles = [];

async function loadSavedTitles() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    const res = await fetch('/api/titles?userId=' + currentUser.id);
    savedTitles = await res.json();
}

function findSaved(itemId, apiSource) {
    for (let i = 0; i < savedTitles.length; i++) {
        let t = savedTitles[i];
        if (apiSource === 'Jikan') {
            if (String(t.mal_id) === String(itemId)) return t;
            if (String(t.externalId) === String(itemId)) return t;
        }
        if (apiSource === 'TMDB') {
            if (String(t.externalId) === String(itemId)) return t;
        }
    }
    return null;
}

function renderItems(items) {
    const grid = document.getElementById('top-week-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const unique = Array.from(
        new Map(items.map(i => [i.id, i])).values()
    );

    unique.sort((a, b) => b.score - a.score);

    unique.forEach(item => {
        grid.appendChild(createCard(item));
    });
}

function createCard(item) {
    const card = document.createElement('div');
    card.className = 'anime-card';

    const isSaved = findSaved(item.id, item.apiSource) !== null;

    card.innerHTML = `
        <div class="card-poster">
            <img src="${item.image}" alt="${item.title}">
        </div>
        <div class="card-info">
            <h3 class="card-title" title="${item.title}">${item.title}</h3>
            <div class="card-meta">
                <span class="type">${item.type}</span>
                <span class="dot">•</span>
                <span class="author">${item.year}</span>
            </div>
            <div class="card-extra">
                <button class="save-btn ${isSaved ? 'added' : ''}"
                    data-id="${item.id}"
                    data-title="${item.title}"
                    data-image="${item.image}"
                    data-type="${item.type}"
                    data-api-source="${item.apiSource}"
                    onclick="toggleSave(this, event)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="14" viewBox="0 0 9 11" fill="none">
                        <path d="M7.35714 0.5C7.66025 0.5 7.95094 0.617065 8.16527 0.825443C8.37959 1.03382 8.5 1.31644 8.5 1.61113V9.94461C8.49997 10.0419 8.47366 10.1375 8.4237 10.2218C8.37375 10.3061 8.3019 10.3761 8.21535 10.425C8.12879 10.4738 8.03057 10.4997 7.9305 10.5C7.83044 10.5003 7.73203 10.4751 7.64514 10.4268L5.06686 8.9946C4.89421 8.89872 4.69883 8.84829 4.5 8.84829C4.30117 8.84829 4.10579 8.89872 3.93314 8.9946L1.35486 10.4268C1.26797 10.4751 1.16956 10.5003 1.0695 10.5C0.969431 10.4997 0.871207 10.4738 0.784653 10.425C0.6981 10.3761 0.626251 10.3061 0.576297 10.2218C0.526342 10.1375 0.500032 10.0419 0.5 9.94461V1.61113C0.5 1.31644 0.620408 1.03382 0.834735 0.825443C1.04906 0.617065 1.33975 0.5 1.64286 0.5H7.35714Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="save-text">${isSaved ? 'Saved' : 'Save'}</span>
                </button>
            </div>
        </div>
    `;

    card.onclick = () => {
        localStorage.setItem('selectedItemId', item.id);
        localStorage.setItem('apiSource', item.apiSource);
        localStorage.setItem('mediaType', item.type);
        window.location.href = '/main/html/content_card.html';
    };

    return card;
}

async function toggleSave(btn, event) {
    event.stopPropagation();

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('Please login to save');
        window.location.href = '/login';
        return;
    }

    const itemId = btn.dataset.id;
    const apiSource = btn.dataset.apiSource;
    const text = btn.querySelector('.save-text');
    const already = findSaved(itemId, apiSource);

    if (already) {
        await fetch('/api/titles/' + already.id, { method: 'DELETE' });
        savedTitles = savedTitles.filter(t => t.id !== already.id);
        btn.classList.remove('added');
        if (text) text.textContent = 'Save';
    } else {
        const res = await fetch('/api/titles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                externalId: itemId,
                mal_id: apiSource === 'Jikan' ? itemId : undefined,
                name: btn.dataset.title,
                image: btn.dataset.image,
                type: btn.dataset.type,
                apiSource: apiSource,
                status: 'Plan to Watch',
                rating: null,
                watchedEpisodes: 0
            })
        });

        if (!res.ok && res.status !== 409) {
            alert('Could not save');
            return;
        }

        const saved = await res.json();
        savedTitles.push(saved);
        btn.classList.add('added');
        if (text) text.textContent = 'Saved';
    }
}