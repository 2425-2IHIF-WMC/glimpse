let liveSearchTimer;
let savedTitles = [];

const currentUser = JSON.parse(localStorage.getItem("currentUser"));

loadSavedTitles();

async function loadSavedTitles() {
    if (!currentUser) {
        return;
    }

    const response = await fetch("/api/titles?userId=" + currentUser.id);
    savedTitles = await response.json();
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
            `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=10`
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

            item.onclick = () => {
                document.getElementById("searchInput").value = anime.title;
                liveResults.style.display = "none";
                showSingleResult(anime);
            };

            liveResults.appendChild(item);
        });

        const viewAll = document.createElement("div");
        viewAll.className = "view-all";
        viewAll.innerHTML = `View all results for <strong>${query}</strong>`;
        viewAll.onclick = searchAnime;

        liveResults.appendChild(viewAll);
        liveResults.style.display = "block";
    }, 400);
}

async function searchAnime() {
    const query = document.getElementById("searchInput").value.trim();
    const results = document.getElementById("results");
    const liveResults = document.getElementById("liveResults");

    liveResults.style.display = "none";

    if (!query) {
        alert("Search something first.");
        return;
    }

    results.innerHTML = "Loading...";

    const res = await fetch(
        `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=12`
    );

    const data = await res.json();

    results.innerHTML = "";

    data.data.forEach(anime => {
        results.appendChild(createAnimeCard(anime));
    });
}

function showSingleResult(anime) {
    const results = document.getElementById("results");
    results.innerHTML = "";
    results.appendChild(createAnimeCard(anime));
}

function createAnimeCard(anime) {
    const card = document.createElement("div");
    card.className = "card";

    const isDuplicate = savedTitles.some(title =>
        Number(title.mal_id) === Number(anime.mal_id)
    );

    card.innerHTML = `
        <img src="${anime.images.jpg.image_url}">
        <h3>${anime.title}</h3>
        <p>⭐ ${anime.score || "N/A"}</p>
        <p>${anime.type || "Anime"} • ${anime.episodes || "?"} eps</p>

        <button
            class="${isDuplicate ? "added" : ""}"
            ${isDuplicate ? "disabled" : ""}
            onclick="addToList(${anime.mal_id}, this)"
        >
            ${isDuplicate ? "Already Added" : "Add to My List"}
        </button>
    `;

    return card;
}

async function addToList(malId, button) {
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
        return;
    }

    const saved = await saveRes.json();
    savedTitles.push(saved);

    button.textContent = "Already Added";
    button.disabled = true;
    button.classList.add("added");

    alert("Added. Go to Profile → My List to edit it.");
}