let currentPage = 1;
let currentQuery = "";
let savedTitles = [];

const currentUser = JSON.parse(localStorage.getItem("currentUser"));

document.addEventListener("DOMContentLoaded", async () => {
    setupUserProfile();
    await loadSavedTitles();

    const params = new URLSearchParams(window.location.search);
    currentQuery = params.get("q") || "anime";

    document.getElementById("page-title").textContent =
        "Results for " + currentQuery;

    document.getElementById("load-more-btn").addEventListener("click", () => {
        currentPage++;
        loadResults();
    });

    loadResults();
});

function setupUserProfile() {
    const nameEl = document.querySelector(".user-name");
    const userProfile = document.querySelector(".user-profile");

    if (currentUser) {
        nameEl.textContent = currentUser.username;
        userProfile.addEventListener("click", () => {
            window.location.href = "/profile";
        });
    } else {
        nameEl.textContent = "Login";
        userProfile.addEventListener("click", () => {
            window.location.href = "/login";
        });
    }

    userProfile.style.cursor = "pointer";
}

async function loadSavedTitles() {
    if (!currentUser) {
        savedTitles = [];
        return;
    }

    const response = await fetch("/api/titles?userId=" + currentUser.id);
    savedTitles = await response.json();
}

async function loadResults() {
    const grid = document.getElementById("view-all-grid");

    if (currentPage === 1) {
        grid.innerHTML = "Loading...";
    }

    try {
        const response = await fetch(
            `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(currentQuery)}&page=${currentPage}&limit=24`
        );

        if (!response.ok) {
            grid.innerHTML = "Could not load results.";
            console.log("Jikan error:", response.status);
            return;
        }

        const data = await response.json();

        if (currentPage === 1) {
            grid.innerHTML = "";
        }

        if (!data.data || data.data.length === 0) {
            grid.innerHTML = "No results found.";
            return;
        }

        data.data.forEach(anime => {
            grid.appendChild(createCard(anime));
        });
    } catch (error) {
        grid.innerHTML = "Something went wrong.";
        console.log(error);
    }
}

function createCard(anime) {
    const card = document.createElement("div");
    card.className = "anime-card";

    const externalId = "anime-" + anime.mal_id;

    const isSaved = savedTitles.some(title =>
        String(title.externalId) === String(externalId) ||
        Number(title.mal_id) === Number(anime.mal_id)
    );

    card.innerHTML = `
        <div class="card-poster">
            <img src="${anime.images.jpg.image_url}" alt="${anime.title}">
        </div>

        <div class="card-info">
            <h3 class="card-title">${anime.title}</h3>

            <div class="card-meta">
                <span class="type">${anime.type || "Anime"}</span>
                <span class="dot">•</span>
                <span class="author">${anime.year || "Unknown year"}</span>
            </div>

            <div class="card-extra">
                <button class="save-btn ${isSaved ? "added" : ""}">
                    ${isSaved ? "Saved" : "Save"}
                </button>
            </div>
        </div>
    `;

    card.querySelector(".card-poster").addEventListener("click", () => {
        openContentCard(anime);
    });

    card.querySelector(".card-title").addEventListener("click", () => {
        openContentCard(anime);
    });

    card.querySelector(".save-btn").addEventListener("click", async event => {
        event.stopPropagation();
        await saveAnime(anime, event.target);
    });

    return card;
}

function openContentCard(anime) {
    localStorage.setItem("selectedItemId", anime.mal_id);
    localStorage.setItem("apiSource", "Jikan");
    localStorage.setItem("mediaType", "Anime");

    window.location.href = "/main/html/content_card.html";
}

async function saveAnime(anime, button) {
    if (!currentUser) {
        alert("Please login first.");
        window.location.href = "/login";
        return;
    }

    const externalId = "anime-" + anime.mal_id;

    const alreadySaved = savedTitles.some(title =>
        String(title.externalId) === String(externalId) ||
        Number(title.mal_id) === Number(anime.mal_id)
    );

    if (alreadySaved) {
        alert("This title is already in your list.");
        button.textContent = "Saved";
        button.disabled = true;
        button.classList.add("added");
        return;
    }

    const response = await fetch("/api/titles", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            userId: currentUser.id,
            externalId: externalId,
            mal_id: anime.mal_id,
            name: anime.title,
            image: anime.images.jpg.image_url,
            description: anime.synopsis || "",
            score: anime.score || null,
            episodes: anime.episodes || null,
            watchedEpisodes: 0,
            rating: null,
            status: "Plan to Watch",
            type: "anime",
            apiSource: "Jikan",
            genres: anime.genres ? anime.genres.map(g => g.name) : []
        })
    });

    if (response.status === 409) {
        alert("This title is already in your list.");
        button.textContent = "Saved";
        button.disabled = true;
        button.classList.add("added");
        return;
    }

    const saved = await response.json();
    savedTitles.push(saved);

    button.textContent = "Saved";
    button.disabled = true;
    button.classList.add("added");

    alert("Added to your list.");
}