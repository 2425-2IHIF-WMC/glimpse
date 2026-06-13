
let currentFilter = 'all';
let currentPage = 1;
let liveSearchTimer;
let savedTitles = [];
const TMDB_API_KEY = "0564bb57f02f1478ec594f8c965796b5";

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

async function toggleSave(btn, event) {
    event.stopPropagation();

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('Please login to save');
        window.location.href = '/login';
        return;
    }

    const text = btn.querySelector('.save-text');
    const itemId = btn.dataset.id;
    const apiSource = btn.dataset.apiSource;

    const already = findSaved(itemId, apiSource);

    if (already) {
        await fetch('/api/titles/' + already.id, { method: 'DELETE' });

        savedTitles = savedTitles.filter(t => t.id !== already.id);

        text.textContent = 'Save';
        btn.classList.remove('added');
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
                year: btn.dataset.year,
                apiSource: apiSource,
                status: 'Plan to Watch',
                rating: null,
                watchedEpisodes: 0,
                lastUpdated: Date.now()
            })
        });

        if (!res.ok && res.status !== 409) {
            alert('Could not save');
            return;
        }

        const saved = await res.json();
        savedTitles.push(saved);

        text.textContent = 'Saved';
        btn.classList.add('added');
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadSavedTitles();
    loadContent();

    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-type');
            loadContent();
        });
    });

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser) {
        window.location.href = '../../registration/login.html';
        return; 
    }

    const nameEl = document.querySelector('.user-name');
    if (nameEl) nameEl.textContent = currentUser.username;

    const avatarEl = document.querySelector(".user-profile .avatar");
    if (currentUser.avatarImage && avatarEl) {
        avatarEl.style.backgroundImage = `url(${currentUser.avatarImage})`;
        avatarEl.style.backgroundSize = "cover";
        avatarEl.style.backgroundPosition = "center";
        avatarEl.style.backgroundColor = "transparent";
    }

    const userProfile = document.querySelector('.user-profile');
    if (userProfile) {
        userProfile.style.cursor = 'pointer';
        userProfile.addEventListener('click', () => {
            window.location.href = '../../Profile/html/profile.html';
        });
    }
});

async function loadContent() {
    const sectionTop = document.querySelector('.top-movies');
    const sectionAll = document.querySelector('.all');
    const sectionAnime = document.querySelector('.anime-movies');
    const sectionSeries = document.querySelector('.series-movies');
    const sectionFilms = document.querySelector('.films-movies');
    const sectionDoc = document.querySelector('.documentary-movies');

    const resultsContainer = document.querySelector('.results-grid-top');
    const resultsContainerAll = document.querySelector('.results-grid-all');
    const resultsFilms = document.querySelector('.results-grid-films');
    const resultsSeries = document.querySelector('.results-grid-series');
    const resultsDocumentary = document.querySelector('.results-grid-documentary');
    const resultsAnime = document.querySelector('.results-grid-anime');

    const resultsAnimeTV = document.querySelector('.results-grid-anime-tv');
    const resultsAnimeMovie = document.querySelector('.results-grid-anime-movie');
    const resultsAnimeOVA = document.querySelector('.results-grid-anime-ova');

    const resultsSeriesNetflix = document.querySelector('.results-grid-series-netflix');
    const resultsSeriesHBO = document.querySelector('.results-grid-series-hbo');

    const resultsFilmsNow = document.querySelector('.results-grid-films-now');
    const resultsFilmsUpcoming = document.querySelector('.results-grid-films-upcoming');
    const resultsFilmsTop = document.querySelector('.results-grid-films-top');
    const resultsFilmsAction = document.querySelector('.results-grid-films-action');
    const resultsFilmsHorror = document.querySelector('.results-grid-films-horror');
    const resultsFilmsSciFi = document.querySelector('.results-grid-films-scifi');

    const resultsDocMovies = document.querySelector('.results-grid-doc-movies');
    const resultsDocSeries = document.querySelector('.results-grid-doc-series');
    const resultsDocHistory = document.querySelector('.results-grid-doc-history');

    const animeSubsections = document.querySelector('.anime-subsections');
    const seriesSubsections = document.querySelector('.series-subsections');
    const moviesSubsections = document.querySelector('.films-subsections');
    const docSubsections = document.querySelector('.documentary-subsections');

    const resultsDocWrapper = document.querySelector('.results-grid-documentary');

    try {
        if (currentFilter === 'all') {
            if(sectionTop) sectionTop.style.display = 'block';
            if(sectionAll) sectionAll.style.display = 'block';
            if(sectionAnime) sectionAnime.style.display = 'block';
            if(sectionSeries) sectionSeries.style.display = 'block';
            if(sectionFilms) sectionFilms.style.display = 'block';
            if(sectionDoc) sectionDoc.style.display = 'block';

            if(animeSubsections) animeSubsections.style.display = 'none';
            if(seriesSubsections) seriesSubsections.style.display = 'none';
            if(moviesSubsections) moviesSubsections.style.display = 'none';
            if(docSubsections) docSubsections.style.display = 'none';

            const trendingUrl = `https://api.themoviedb.org/3/trending/all/week?api_key=${TMDB_API_KEY}`;
            const filmsUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc`;
            const seriesUrl = `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&sort_by=popularity.desc`;
            const docUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=99`;

            const [trendingItems, filmsItems, seriesItems, docItems, animeItems] = await Promise.all([
                fetchCategory(trendingUrl),
                fetchCategory(filmsUrl, 'Cinema'),
                fetchCategory(seriesUrl, 'Series'),
                fetchCategory(docUrl, 'Documentary'),
                fetchJikanAnime()
            ]);

            let mixedTop = [...trendingItems, ...animeItems];
            let mixedAll = [...filmsItems, ...seriesItems, ...docItems, ...animeItems];

            mixedTop.sort((a, b) => b.score - a.score);
            mixedAll.sort((a, b) => b.score - a.score);

            if(resultsContainer) resultsContainer.innerHTML = "";
            if(resultsContainerAll) resultsContainerAll.innerHTML = "";
            if(resultsFilms) resultsFilms.innerHTML = "";
            if(resultsSeries) resultsSeries.innerHTML = "";
            if(resultsDocumentary) resultsDocumentary.innerHTML = "";
            if(resultsAnime) resultsAnime.innerHTML = "";

            mixedTop.forEach(item => resultsContainer.appendChild(createCard(item)));
            mixedAll.forEach(item => resultsContainerAll.appendChild(createCard(item)));
            filmsItems.forEach(item => resultsFilms.appendChild(createCard(item)));
            seriesItems.forEach(item => resultsSeries.appendChild(createCard(item)));
            docItems.forEach(item => resultsDocumentary.appendChild(createCard(item)));
            animeItems.forEach(item => resultsAnime.appendChild(createCard(item)));
        }
        else if (currentFilter === 'anime') {
            if(sectionTop) sectionTop.style.display = 'none';
            if(sectionAll) sectionAll.style.display = 'none';
            if(sectionSeries) sectionSeries.style.display = 'none';
            if(sectionFilms) sectionFilms.style.display = 'none';
            if(sectionDoc) sectionDoc.style.display = 'none';

            if(sectionAnime) sectionAnime.style.display = 'block';
            if(animeSubsections) animeSubsections.style.display = 'block';

            if(resultsAnimeTV) resultsAnimeTV.innerHTML = "";
            if(resultsAnimeMovie) resultsAnimeMovie.innerHTML = "";
            if(resultsAnimeOVA) resultsAnimeOVA.innerHTML = "";

            const [tvItems, movieItems, ovaItems] = await Promise.all([
                fetchJikanAnime('tv'),
                fetchJikanAnime('movie'),
                fetchJikanAnime('ova')
            ]);
            if(resultsAnimeTV) tvItems.forEach(item => resultsAnimeTV.appendChild(createCard(item)));
            if(resultsAnimeMovie) movieItems.forEach(item => resultsAnimeMovie.appendChild(createCard(item)));
            if(resultsAnimeOVA) ovaItems.forEach(item => resultsAnimeOVA.appendChild(createCard(item)));
        }
        else if (currentFilter === 'movie') {
            if(sectionTop) sectionTop.style.display = 'none';
            if(sectionAll) sectionAll.style.display = 'none';
            if(sectionAnime) sectionAnime.style.display = 'none';
            if(sectionSeries) sectionSeries.style.display = 'none';
            if(sectionDoc) sectionDoc.style.display = 'none';

            if(sectionFilms) sectionFilms.style.display = 'block';
            if(moviesSubsections) moviesSubsections.style.display = 'block';

            if(resultsFilmsAction) resultsFilmsAction.innerHTML = "";
            if(resultsFilmsHorror) resultsFilmsHorror.innerHTML = "";
            if(resultsFilmsNow) resultsFilmsNow.innerHTML = "";
            if(resultsFilmsUpcoming) resultsFilmsUpcoming.innerHTML = "";
            if(resultsFilmsTop) resultsFilmsTop.innerHTML = "";
            if(resultsFilmsSciFi) resultsFilmsSciFi.innerHTML = "";
            if(resultsFilms) resultsFilms.innerHTML = "";

            const moviesNowPlayingUrl = `https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}`;
            const moviesUpcomingUrl = `https://api.themoviedb.org/3/movie/upcoming?api_key=${TMDB_API_KEY}`;
            const moviesTopRatedUrl = `https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_API_KEY}`;
            const moviesActionUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&with_genres=28`;
            const moviesHorrorUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&with_genres=27`;
            const moviesSciFiUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&with_genres=878`;

            const [nowPlayingItems, actionItems, topRatedItems, upcomingItems, horrorItems, scifiItems] = await Promise.all([
                fetchCategory(moviesNowPlayingUrl, 'Cinema'),
                fetchCategory(moviesUpcomingUrl, 'Cinema'),
                fetchCategory(moviesHorrorUrl, 'Cinema'),
                fetchCategory(moviesSciFiUrl, 'Cinema'),
                fetchCategory(moviesActionUrl, 'Cinema'),
                fetchCategory(moviesTopRatedUrl, 'Cinema')
            ]);

            if(resultsFilmsAction) actionItems.forEach(item => resultsFilmsAction.appendChild(createCard(item)));
            if(resultsFilmsHorror) horrorItems.forEach(item => resultsFilmsHorror.appendChild(createCard(item)));
            if(resultsFilmsNow) nowPlayingItems.forEach(item => resultsFilmsNow.appendChild(createCard(item)));
            if(resultsFilmsUpcoming) upcomingItems.forEach(item => resultsFilmsUpcoming.appendChild(createCard(item)));
            if(resultsFilmsTop) topRatedItems.forEach(item => resultsFilmsTop.appendChild(createCard(item)));
            if(resultsFilmsSciFi) scifiItems.forEach(item => resultsFilmsSciFi.appendChild(createCard(item)));
        }
        else if (currentFilter === 'series') {
            if(sectionTop) sectionTop.style.display = 'none';
            if(sectionAll) sectionAll.style.display = 'none';
            if(sectionAnime) sectionAnime.style.display = 'none';
            if(sectionSeries) sectionFilms.style.display = 'none';
            if(sectionDoc) sectionDoc.style.display = 'none';

            if(sectionSeries) sectionSeries.style.display = 'block';
            if(seriesSubsections) seriesSubsections.style.display = 'block';

            if(resultsSeriesNetflix) resultsSeriesNetflix.innerHTML = "";
            if(resultsSeriesHBO) resultsSeriesHBO.innerHTML = "";

            const tvNetflixUrl = `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&with_networks=213`;
            const tvHboUrl = `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&with_networks=49`;
            const [netflixSeries, hboSeries] = await Promise.all([
                fetchCategory(tvNetflixUrl, 'Series'),
                fetchCategory(tvHboUrl, 'Series')
            ]);

            if(resultsSeriesNetflix) netflixSeries.forEach(item => resultsSeriesNetflix.appendChild(createCard(item)));
            if(resultsSeriesHBO) hboSeries.forEach(item => resultsSeriesHBO.appendChild(createCard(item)));
        }
        else if(currentFilter === 'documentary') {
            if(sectionTop) sectionTop.style.display = 'none';
            if(sectionAll) sectionAll.style.display = 'none';
            if(sectionAnime) sectionAnime.style.display = 'none';
            if(sectionSeries) sectionSeries.style.display = 'none';
            if(sectionFilms) sectionFilms.style.display = 'none';

            if(sectionDoc) sectionDoc.style.display = 'block';
            if(docSubsections) docSubsections.style.display = 'block';

            if(resultsDocWrapper) {
                resultsDocWrapper.style.display = 'none';
                document.getElementById('documentary-h1').style.display = 'none';
            }

            if(resultsDocMovies) resultsDocMovies.innerHTML = "";
            if(resultsDocSeries) resultsDocSeries.innerHTML = "";
            if(resultsDocHistory) resultsDocHistory.innerHTML = "";

            const docMoviesUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&with_genres=99`;
            const docSeriesUrl = `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&with_genres=99`;
            const docHistoryUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&with_genres=99,36`;

            const [docMoviesItems, docSeriesItems, docHistoryItems] = await Promise.all([
                fetchCategory(docMoviesUrl, 'Documentary'),
                fetchCategory(docSeriesUrl, 'Series'),
                fetchCategory(docHistoryUrl, 'Documentary')
            ]);

            if(resultsDocMovies) docMoviesItems.forEach(item => resultsDocMovies.appendChild(createCard(item)));
            if(resultsDocSeries) docSeriesItems.forEach(item => resultsDocSeries.appendChild(createCard(item)));
            if(resultsDocHistory) docHistoryItems.forEach(item => resultsDocHistory.appendChild(createCard(item)));
        }
    } catch (error) {
        console.error(error);
    }
}

async function fetchCategory(url, defaultType = null) {
    const response = await fetch(url);
    const data = await response.json();

    return data.results.map(item => ({
        id: item.id,
        title: item.title || item.name,
        image: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/225x335',
        score: item.vote_average,
        type: defaultType || (item.media_type === 'tv' ? 'Series' : 'Cinema'),
        year: (item.release_date || item.first_air_date || "N/A").substring(0, 4),
        genres: item.genre_ids,
        apiSource: 'TMDB'
    }));
}

async function fetchJikanAnime(animeType = ''){
    const jikanUrl = animeType
        ? `https://api.jikan.moe/v4/top/anime?type=${animeType}`
        : `https://api.jikan.moe/v4/top/anime`;
    try{
        const response = await fetch(jikanUrl);
        const data = await response.json();

        return data.data.map((item) => {
            const genreList = item.genres ? item.genres.map(g => g.name) : [];
            return {
                id: item.mal_id,
                title: item.title_english || item.title,
                image: item.images.jpg.large_image_url,
                score: item.score,
                type: item.type || 'Anime',
                year: item.year || "N/A",
                genres: genreList,
                apiSource: 'Jikan'
            };
        });
    } catch(error) {
        return [];
    }
}

function createCard(item) {
    const card = document.createElement("div");
    card.className = "anime-card";

    const already = findSaved(item.id, item.apiSource);
    const isSaved = already !== null;

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
                    data-year="${item.year}"
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

