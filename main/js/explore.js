let currentFilter = "";
let liveSearchTimer;
let savedTitles = [];

document.addEventListener("DOMContentLoaded", async () => {
    currentFilter = "all";

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    const nameEl = document.querySelector(".user-name");
    const userProfile = document.querySelector(".user-profile");

    if (currentUser) {
        if (nameEl) {
            nameEl.textContent = currentUser.username;
        }

        if (userProfile) {
            userProfile.style.cursor = "pointer";
            userProfile.addEventListener("click", () => {
                window.location.href = "/profile";
            });
        }

        await loadSavedTitles(currentUser.id);
    } else {
        if (nameEl) {
            nameEl.textContent = "Login";
        }

        if (userProfile) {
            userProfile.style.cursor = "pointer";
            userProfile.addEventListener("click", () => {
                window.location.href = "/login";
            });
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

    document.getElementById("searchInput").addEventListener("input", liveSearchAnime);
    document.getElementById("searchBtn").addEventListener("click", searchAnime);
});

async function loadSavedTitles(userId) {
    const res = await fetch("/api/titles?userId=" + userId);
    savedTitles = await res.json();
}

async function liveSearchAnime() {
    clearTimeout(liveSearchTimer);

    liveSearchTimer = setTimeout(async () => {
        const query = document.getElementById("searchInput").value.trim();
        const liveResults = document.getElementById("liveResults");

        if (query.length < 2) {
            liveResults.style.display = "none";
            liveResults.innerHTML = "";
            return;
        }

        const res = await fetch(
            `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=8`
        );

        const data = await res.json();

        liveResults.innerHTML = "";

        data.data.forEach(anime => {
            const item = document.createElement("div");
            item.className = "live-item";

            item.innerHTML = `
                <img src="${anime.images.jpg.image_url}">
                <div>
                    <div class="live-item-title">${anime.title}</div>
                    <div class="live-item-meta">
                        ${anime.type || "Anime"}, ${anime.year || "Unknown year"}
                    </div>
                </div>
            `;

            item.addEventListener("click", () => {
                localStorage.setItem("selectedItemId", anime.mal_id);
                localStorage.setItem("apiSource", "Jikan");
                localStorage.setItem("mediaType", "Anime");
                localStorage.setItem("mediaType", "Series");
                localStorage.setItem("mediaType", "Movie");

                window.location.href = "/main/html/content_card.html";
            });

            liveResults.appendChild(item);
        });

        const viewAll = document.createElement("div");
        viewAll.className = "view-all";
        viewAll.innerHTML = `View all results for <strong>${query}</strong>`;
        viewAll.addEventListener("click", searchAnime);

        liveResults.appendChild(viewAll);
        liveResults.style.display = "block";
    }, 400);
}

function searchAnime() {
    const query = document.getElementById("searchInput").value.trim();
    const liveResults = document.getElementById("liveResults");

    if (liveResults) {
        liveResults.style.display = "none";
    }

    if (query === "") {
        alert("Search something first.");
        return;
    }

    window.location.href =
        "/main/html/viewAll.html?q=" + encodeURIComponent(query);
}

function showSingleResult(anime) {
    const results = document.querySelector(".results-grid-all");

    results.innerHTML = "";
    results.appendChild(createAnimeCard(anime));
}

function createAnimeCard(anime) {
    const card = document.createElement("div");
    card.className = "anime-card";

    const isDuplicate = savedTitles.some(title =>
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
                <button
                    class="save-btn ${isDuplicate ? "added" : ""}"
                    ${isDuplicate ? "disabled" : ""}
                    onclick="addToList(${anime.mal_id}, this)"
                >
                    <span class="save-text">
                        ${isDuplicate ? "Saved" : "Save"}
                    </span>
                </button>
            </div>
        </div>
    `;

    return card;
}

async function addToList(malId, button) {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser) {
        alert("Please login first.");
        window.location.href = "/login";
        return;
    }

    const alreadyExists = savedTitles.some(title =>
        Number(title.mal_id) === Number(malId)
    );

    if (alreadyExists) {
        alert("This title is already in your list.");
        return;
    }

    const res = await fetch(`https://api.jikan.moe/v4/anime/${malId}`);
    const anime = (await res.json()).data;

    const saveRes = await fetch("/api/titles", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            userId: currentUser.id,
            name: anime.title,
            image: anime.images.jpg.image_url,
            description: anime.synopsis || "",
            mal_id: anime.mal_id,
            score: anime.score || null,
            episodes: anime.episodes || null,
            watchedEpisodes: 0,
            rating: null,
            status: "Plan to Watch",
            type: "anime",
            genres: anime.genres.map(g => g.name)
        })
    });

    if (saveRes.status === 409) {
        alert("This title is already in your list.");

        button.textContent = "Saved";
        button.disabled = true;
        button.classList.add("added");

        return;
    }

    const saved = await saveRes.json();
    savedTitles.push(saved);

    button.textContent = "Saved";
    button.disabled = true;
    button.classList.add("added");

    alert("Added to your list.");
}

function loadAllFilter() {

}