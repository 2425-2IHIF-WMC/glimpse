let currentFilter = "";
let liveSearchTimer;
let savedTitles = [];
const TMDB_API_KEY = "0564bb57f02f1478ec594f8c965796b5";

document.addEventListener("DOMContentLoaded", async () => {
    currentFilter = "all";

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const avatarEl = document.querySelector(".user-profile .avatar");

    if (currentUser && currentUser.avatarImage && avatarEl) {
        avatarEl.style.backgroundImage = `url(${currentUser.avatarImage})`;
        avatarEl.style.backgroundSize = "cover";
        avatarEl.style.backgroundPosition = "center";
        avatarEl.style.backgroundColor = "transparent";
    }

    const nameEl = document.querySelector(".user-name");
    const userProfile = document.querySelector(".user-profile");

    if (currentUser) {
        if (nameEl) nameEl.textContent = currentUser.username;
        if (userProfile) {
            userProfile.style.cursor = "pointer";
            userProfile.addEventListener("click", () => window.location.href = "/profile");
        }
        await loadSavedTitles(currentUser.id);
    } else {
        if (nameEl) nameEl.textContent = "Login";
        if (userProfile) {
            userProfile.style.cursor = "pointer";
            userProfile.addEventListener("click", () => window.location.href = "/login");
        }
    }

    const filterBtns = document.querySelectorAll(".filter-btn");
    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.getAttribute("data-type");
        });
    });

    document.getElementById("searchInput").addEventListener("input", liveSearch);
    document.getElementById("searchBtn").addEventListener("click", searchAnime);

    loadTopThisWeek();
    loadAllExplore();

    if (window.location.hash === '#list') {
        showSection('list');
    }
});

document.addEventListener('click', function(event) {
    const searchContainer = document.querySelector('.search-container');
    const liveResults = document.getElementById('liveResults');

    if (searchContainer && liveResults && !searchContainer.contains(event.target)) {
        liveResults.style.display = 'none';
    }
});

async function loadSavedTitles(userId) {
    try {
        const res = await fetch("/api/titles?userId=" + userId);
        savedTitles = await res.json();
    } catch (e) {
        console.log("Оффлайн режим (без базы)");
    }
}


async function liveSearch() {
    clearTimeout(liveSearchTimer);

    liveSearchTimer = setTimeout(async () => {
        const query = document.getElementById("searchInput").value.trim();
        const liveResults = document.getElementById("liveResults");

        if (query.length < 2) {
            liveResults.style.display = "none";
            liveResults.innerHTML = "";
            return;
        }

        let combinedResults = [];

        try {
            const tmdbRes = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
            const tmdbData = await tmdbRes.json();

            for (let i = 0; i < tmdbData.results.length; i++) {
                let item = tmdbData.results[i];
                if (item.media_type !== 'person') {
                    let finalTitle = item.title || item.name;
                    let finalImage = item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : 'https://via.placeholder.com/100x150';
                    let finalYear = "N/A";

                    if (item.release_date) finalYear = item.release_date.substring(0, 4);
                    else if (item.first_air_date) finalYear = item.first_air_date.substring(0, 4);

                    combinedResults.push({
                        id: item.id,
                        title: finalTitle,
                        image: finalImage,
                        year: finalYear,
                        type: item.media_type === 'tv' ? "Series" : "Cinema",
                        apiSource: 'TMDB'
                    });
                }
            }
        } catch(error) { console.log("Error TMDB"); }

        try {
            const jikanRes = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=5`);
            const jikanData = await jikanRes.json();

            for (let i = 0; i < jikanData.data.length; i++) {
                let item = jikanData.data[i];
                combinedResults.push({
                    id: item.mal_id,
                    title: item.title_english || item.title,
                    image: item.images.jpg.image_url,
                    year: item.year || "N/A",
                    type: 'Anime',
                    apiSource: 'Jikan'
                });
            }
        } catch(error) { console.log("Error Jikan"); }

        liveResults.innerHTML = "";

        if (combinedResults.length === 0) {
            liveResults.innerHTML = `<div style="padding: 15px; color: #8C8C8C;">No results found for "${query}"</div>`;
            liveResults.style.display = "block";
            return;
        }

        let limit = combinedResults.length > 30 ? 30 : combinedResults.length;

        for (let i = 0; i < limit; i++) {
            let item = combinedResults[i];
            const div = document.createElement("div");
            div.className = "live-item";
            div.innerHTML = `
                <img src="${item.image}" alt="poster">
                <div>
                    <div class="live-item-title">${item.title}</div>
                    <div class="live-item-meta">${item.type} • ${item.year}</div>
                </div>
            `;

            div.addEventListener("click", () => {
                localStorage.setItem("selectedItemId", item.id);
                localStorage.setItem("apiSource", item.apiSource);
                localStorage.setItem("mediaType", item.type);
                window.location.href = "content_card.html";
            });

            liveResults.appendChild(div);
        }
        liveResults.style.display = "block";
    }, 500);
}

function searchAnime(event) {
    if (event) event.preventDefault();
}

function goToMyList(event) {
    event.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser || !currentUser.id) {
        window.location.href = "/login";
        return;
    }
    window.location.href = "/profile#list";
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

window.toggleSave = async function (button, event) {
    event.stopPropagation();
    event.preventDefault();

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser || !currentUser.id) {
        alert("Please login first.");
        window.location.href = "/login";
        return;
    }

    const itemId = button.dataset.id;
    const apiSource = button.dataset.apiSource;
    const text = button.querySelector(".save-text");
    const already = findSaved(itemId, apiSource);

    if (already) {
        await fetch("/api/titles/" + already.id, { method: "DELETE" });
        savedTitles = savedTitles.filter(t => t.id !== already.id);
        button.classList.remove("added");
        if (text) text.textContent = "Save";
    } else {
        const res = await fetch("/api/titles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: currentUser.id,
                externalId: itemId,
                mal_id: apiSource === 'Jikan' ? itemId : undefined,
                name: button.dataset.title,
                image: button.dataset.image,
                type: button.dataset.type,
                apiSource: apiSource,
                status: "Plan to Watch",
                rating: null,
                watchedEpisodes: 0
            })
        });

        if (!res.ok && res.status !== 409) {
            alert("Could not save title.");
            return;
        }

        const saved = await res.json();
        savedTitles.push(saved);
        button.classList.add("added");
        if (text) text.textContent = "Saved";
    }
};



async function loadTopThisWeek() {
    const grid = document.querySelector('.results-grid-top');
    if (!grid) return;
    grid.innerHTML = "";

    try {
        const results = await fetchCategory(`https://api.themoviedb.org/3/trending/all/week?api_key=${TMDB_API_KEY}`, 'Cinema');
        for (let i = 0; i < 20; i++) {
            if (results[i]) grid.appendChild(createUniversalCard(results[i]));
        }
    } catch (error) { console.error("Top This Week:", error); }
}

async function loadAllExplore() {
    const grid = document.querySelector('.results-grid-all');
    if (!grid) return;
    grid.innerHTML = "";

    try {
        let allItems = [];
        const movies = await fetchCategory(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&page=1`, 'Cinema');
        const series = await fetchCategory(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&page=1`, 'Series');

        let animeData = [];
        try {
            const res = await fetch(`https://api.jikan.moe/v4/top/anime?limit=10`);
            const json = await res.json();
            for (let i = 0; i < json.data.length; i++) {
                let item = json.data[i];
                animeData.push({
                    id: item.mal_id,
                    title: item.title_english || item.title,
                    image: item.images.jpg.large_image_url,
                    score: item.score,
                    type: 'Anime',
                    year: item.year || "N/A",
                    apiSource: 'Jikan'
                });
            }
        } catch(e) {}

        allItems = allItems.concat(movies, series, animeData);
        allItems.sort(() => Math.random() - 0.5);

        for (let i = 0; i < allItems.length; i++) {
            grid.appendChild(createUniversalCard(allItems[i]));
        }
    } catch (error) { console.error(error); }
}

async function fetchCategory(url, defaultType) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        let formattedResults = [];

        for (let i = 0; i < data.results.length; i++) {
            let item = data.results[i];
            let finalTitle = item.title || item.name;
            let finalImage = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/225x335';

            let finalYear = "N/A";
            if (item.release_date) finalYear = item.release_date.substring(0, 4);
            else if (item.first_air_date) finalYear = item.first_air_date.substring(0, 4);

            formattedResults.push({
                id: item.id,
                title: finalTitle,
                image: finalImage,
                score: item.vote_average,
                type: item.media_type === 'tv' ? 'Series' : (item.media_type === 'movie' ? 'Cinema' : defaultType),
                year: finalYear,
                apiSource: 'TMDB'
            });
        }
        return formattedResults;
    } catch (error) { return []; }
}

function createUniversalCard(item) {
    const card = document.createElement("div");
    card.className = "anime-card";

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
                    onclick="window.toggleSave(this, event)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="14" viewBox="0 0 9 11" fill="none">
                        <path d="M7.35714 0.5C7.66025 0.5 7.95094 0.617065 8.16527 0.825443C8.37959 1.03382 8.5 1.31644 8.5 1.61113V9.94461C8.49997 10.0419 8.47366 10.1375 8.4237 10.2218C8.37375 10.3061 8.3019 10.3761 8.21535 10.425C8.12879 10.4738 8.03057 10.4997 7.9305 10.5C7.83044 10.5003 7.73203 10.4751 7.64514 10.4268L5.06686 8.9946C4.89421 8.89872 4.69883 8.84829 4.5 8.84829C4.30117 8.84829 4.10579 8.89872 3.93314 8.9946L1.35486 10.4268C1.26797 10.4751 1.16956 10.5003 1.0695 10.5C0.969431 10.4997 0.871207 10.4738 0.784653 10.425C0.6981 10.3761 0.626251 10.3061 0.576297 10.2218C0.526342 10.1375 0.500032 10.0419 0.5 9.94461V1.61113C0.5 1.31644 0.620408 1.03382 0.834735 0.825443C1.04906 0.617065 1.33975 0.5 1.64286 0.5H7.35714Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="save-text">${isSaved ? 'Saved' : 'Save'}</span>
                </button>
            </div>
        </div>
    `;

    card.addEventListener("click", () => {
        localStorage.setItem('selectedItemId', item.id);
        localStorage.setItem('apiSource', item.apiSource);
        localStorage.setItem('mediaType', item.type);

        window.location.href = 'content_card.html';
    });

    return card;
}