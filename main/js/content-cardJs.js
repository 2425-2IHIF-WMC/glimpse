const TMDB_API_KEY = "0564bb57f02f1478ec594f8c965796b5";
const mediaType = localStorage.getItem('mediaType');

document.addEventListener('DOMContentLoaded', () => {
    const itemId = localStorage.getItem('selectedItemId');
    const apiSource = localStorage.getItem('apiSource');

    if (!itemId) return;

    if (apiSource === 'Jikan') {
        loadAnimeDetails(itemId);
    } else if (apiSource === 'TMDB') {
        loadCinemaDetails(itemId);
    } else {
        
    }
});


async function loadCinemaDetails(id) {
    try {
        let url = '';

        if (mediaType === 'Series') {
            url = `https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_API_KEY}`;
        } else {
            url = `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        const nameEl = document.querySelector('.name-item');
        if (nameEl) nameEl.textContent = data.title || data.name;

        const aboutEl = document.getElementById('about-text');
        if (aboutEl) aboutEl.textContent = data.overview;

        const ratingScoreEl = document.querySelector('.rating-score');
        const imdbScoreEl = document.querySelector('.imdb-score');
        const rating = data.vote_average ? data.vote_average.toFixed(1) : "0.0";
        if (ratingScoreEl) ratingScoreEl.textContent = `${rating}/10`;
        if (imdbScoreEl) imdbScoreEl.textContent = rating;

        if (data.backdrop_path) {
            const bgUrl = `https://image.tmdb.org/t/p/original${data.backdrop_path}`;
            const header = document.querySelector('.section-header');
            const trailerCont = document.getElementById('trailer-container');
            if (header) header.style.backgroundImage = `url('${bgUrl}')`;
            if (trailerCont) trailerCont.style.backgroundImage = `url('${bgUrl}')`;
        }

    } catch (error) {
        console.error(error);
    }
}

async function loadAnimeDetails(id) {
    try {
        const response = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
        const result = await response.json();
        const anime = result.data;

        const nameEl = document.querySelector('.name-item');
        if (nameEl) nameEl.textContent = anime.title_english || anime.title;

        const aboutEl = document.getElementById('about-text');
        if (aboutEl) {
            let synopsis = anime.synopsis || "No description";
            synopsis = synopsis.replace("[Written by MAL Rewrite]", "").trim();
            aboutEl.textContent = synopsis;
        }

        const ratingScoreEl = document.querySelector('.rating-score');
        const imdbScoreEl = document.querySelector('.imdb-score');
        const imdbTitleEl = document.querySelector('.imdb-title');

        if (ratingScoreEl) ratingScoreEl.textContent = `${anime.score || 0}/10`;
        if (imdbScoreEl) imdbScoreEl.textContent = anime.score || "N/A";
        if (imdbTitleEl) imdbTitleEl.textContent = "MAL";

        const header = document.querySelector('.section-header');
        const trailerCont = document.getElementById('trailer-container');

        let bgUrl = "";
        let isVerticalPoster = false;

        const searchQuery = anime.title_english || anime.title;
        const tmdbBg = await getTmdbBackdrop(searchQuery);

        if (tmdbBg) {
            bgUrl = tmdbBg; 
        } else {
            if (anime.trailer && anime.trailer.images) {
                bgUrl = anime.trailer.images.maximum_image_url || anime.trailer.images.large_image_url;
            }

            if (!bgUrl) {
                bgUrl = anime.images.jpg.large_image_url;
                isVerticalPoster = true;
            }
        }

        if (header) {
            header.style.backgroundImage = isVerticalPoster
                ? `linear-gradient(rgba(11, 11, 18, 0.85), rgba(11, 11, 18, 0.95)), url('${bgUrl}')`
                : `url('${bgUrl}')`;
        }
        if (trailerCont) {
            trailerCont.style.backgroundImage = isVerticalPoster
                ? `linear-gradient(rgba(11, 11, 18, 0.8), rgba(11, 11, 18, 0.9)), url('${bgUrl}')`
                : `url('${bgUrl}')`;
        }

    } catch (error) {
        console.error(error);
    }
}

async function getTmdbBackdrop(title) {
    try{
        const response = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const resultWithBg = data.results.find(item => item.backdrop_path);
            if (resultWithBg) {
                return `https://image.tmdb.org/t/p/original${resultWithBg.backdrop_path}`;
            }
        }
    } catch (e) {
        console.error(e);
    }
    return null;
}

document.addEventListener('DOMContentLoaded', () => {
    // show the user name
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        const nameEl = document.querySelector('.user-name');
        if (nameEl) nameEl.textContent = currentUser.username;
    } else {
        window.location.href = '../../registration/login.html';
    }
    //ge tto the user profile page
    const userProfile = document.querySelector('.user-profile');
    if (userProfile) {
        userProfile.style.cursor = 'pointer';
        userProfile.addEventListener('click', () => {
            window.location.href = '../../Profile/html/profile.html';
        });
    }
});
