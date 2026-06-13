const TMDB_API_KEY = "0564bb57f02f1478ec594f8c965796b5";
const mediaType = localStorage.getItem('mediaType');

let loadedTitle = null;
let loadedSource = null;

document.addEventListener('DOMContentLoaded', () => {
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
            window.location.href = '/profile';
        });
    }
    
    const itemId = localStorage.getItem('selectedItemId');
    const apiSource = localStorage.getItem('apiSource');

    if (itemId) {
        if (apiSource === 'Jikan') {
            loadAnimeDetails(itemId);
        } else if (apiSource === 'TMDB') {
            loadCinemaDetails(itemId);
        }

        loadReviews(itemId, apiSource);
    }
    
    const saveBtn = document.getElementById("saveTitleBtn");
    const saveText = saveBtn ? saveBtn.querySelector(".save-text-") : null;

    let savedTitleId = null; 

    async function checkIfSaved() {
        if (!currentUser) return;

        const res = await fetch("/api/titles?userId=" + currentUser.id);
        const titles = await res.json();

        const itemId = localStorage.getItem("selectedItemId");
        const apiSource = localStorage.getItem("apiSource");

        for (let i = 0; i < titles.length; i++) {
            let t = titles[i];

            if (apiSource === "Jikan") {
                if (String(t.mal_id) === String(itemId) || String(t.externalId) === String(itemId)) {
                    savedTitleId = t.id;
                    break;
                }
            }

            if (apiSource === "TMDB") {
                if (String(t.externalId) === String(itemId)) {
                    savedTitleId = t.id;
                    break;
                }
            }
        }

        if (savedTitleId && saveText) {
            saveText.textContent = "Saved";
            saveBtn.classList.add("added");
        }
    }

    checkIfSaved();

    if (saveBtn) {
        saveBtn.addEventListener("click", async () => {
            if (!currentUser) {
                alert("Please login first.");
                window.location.href = "/login";
                return;
            }

            if (!loadedTitle) {
                alert("Title is still loading.");
                return;
            }

            if (savedTitleId) {
                await fetch("/api/titles/" + savedTitleId, { method: "DELETE" });
                savedTitleId = null;
                if (saveText) saveText.textContent = "Save";
                saveBtn.classList.remove("added");
                return;
            }

            const response = await fetch("/api/titles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: currentUser.id,
                    ...loadedTitle
                })
            });

            if (response.status === 409) {
                if (saveText) saveText.textContent = "Saved";
                saveBtn.classList.add("added");
                return;
            }

            if (!response.ok) {
                alert("Could not save title.");
                return;
            }

            const saved = await response.json();
            savedTitleId = saved.id;
            if (saveText) saveText.textContent = "Saved";
            saveBtn.classList.add("added");
        });
    }
});



function getContentType() {
    const type = String(mediaType).toLowerCase();

    if (type === "series" || type === "tv") {
        return "series";
    }

    if (
        type === "documentary" ||
        type === "cinema" ||
        type === "movie" ||
        type === "movies"
    ) {
        return "movie";
    }

    return "movie";
}

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

        loadedSource = "TMDB";

        loadedTitle = {
            externalId: String(id),
            apiSource: "TMDB",
            name: data.title || data.name,
            image: data.poster_path
                ? "https://image.tmdb.org/t/p/w500" + data.poster_path
                : "",
            description: data.overview || "",
            score: data.vote_average || null,
            episodes: data.number_of_episodes || 1,
            watchedEpisodes: 0,
            rating: null,
            status: "Plan to Watch",
            type: getContentType(),
            genres: data.genres ? data.genres.map(g => g.name) : []
        };

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

        loadedSource = "Jikan";

        loadedTitle = {
            externalId: String(anime.mal_id),
            mal_id: anime.mal_id,
            apiSource: "Jikan",
            name: anime.title_english || anime.title,
            image: anime.images.jpg.image_url,
            description: anime.synopsis || "",
            score: anime.score || null,
            episodes: anime.episodes || null,
            watchedEpisodes: 0,
            rating: null,
            status: "Plan to Watch",
            type: "anime",
            genres: anime.genres.map(g => g.name)
        };

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

async function loadReviews(id, apiSource) {
    const container = document.querySelector('.reviews-container');
    if (!container) return;

    container.innerHTML = "<p style='color: #8C8C8C; font-family: Inter; padding: 20px;'>Loading reviews...</p>";

    try {
        let formattedReviews = [];

        if (apiSource === 'TMDB') {
            let tmdbType = "movie";
            let typeStr = String(mediaType).toLowerCase();
            if (typeStr === "series" || typeStr === "tv") {
                tmdbType = "tv";
            }

            const res = await fetch(`https://api.themoviedb.org/3/${tmdbType}/${id}/reviews?api_key=${TMDB_API_KEY}`);
            const data = await res.json();

            let limit = data.results.length;
            if (limit > 10) {
                limit = 10;
            }

            for (let i = 0; i < limit; i++) {
                let r = data.results[i];

                let avatar = 'https://via.placeholder.com/40';
                if (r.author_details && r.author_details.avatar_path) {
                    if (r.author_details.avatar_path.startsWith('/')) {
                        avatar = `https://image.tmdb.org/t/p/w200${r.author_details.avatar_path}`;
                    } else {
                        avatar = r.author_details.avatar_path.substring(1);
                    }
                }

                formattedReviews.push({
                    author: r.author,
                    avatar: avatar,
                    text: r.content,
                    rating: r.author_details ? r.author_details.rating : null
                });
            }
        }

        else if (apiSource === 'Jikan') {
            const res = await fetch(`https://api.jikan.moe/v4/anime/${id}/reviews`);
            const data = await res.json();

            let limit = data.data.length;
            if (limit > 10) {
                limit = 10;
            }

            for (let i = 0; i < limit; i++) {
                let r = data.data[i];
                formattedReviews.push({
                    author: r.user.username,
                    avatar: r.user.images.jpg.image_url,
                    text: r.review,
                    rating: r.score
                });
            }
        }

        container.innerHTML = "";

        if (formattedReviews.length === 0) {
            container.innerHTML = "<p style='color: #8C8C8C; font-family: Inter; padding: 20px;'>No reviews yet. Be the first to share your thoughts!</p>";
            return;
        }

        for (let i = 0; i < formattedReviews.length; i++) {
            let r = formattedReviews[i];
            let card = document.createElement('div');
            card.className = "review-card";

            let firstLetter = r.author.charAt(0).toUpperCase();

            card.innerHTML = `
                <div class="review-header">
                    <img src="${r.avatar}" alt="avatar" class="review-avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="review-avatar fallback-avatar" style="display:none; background: #B6A0FF; color: #340090; justify-content: center; align-items: center; font-weight: bold;">
                        ${firstLetter}
                    </div>
                    <div class="review-info">
                        <span class="review-author">${r.author}</span>
                        
                    </div>
                </div>
                <p class="review-text">${r.text}</p>
            `;
            container.appendChild(card);
        }

    } catch (error) {
        console.error(error);
        container.innerHTML = "<p style='color: #FF4A4A; font-family: Inter; padding: 20px;'>Could not load reviews.</p>";
    }
}
