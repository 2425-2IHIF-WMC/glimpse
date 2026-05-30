let titles = [];

async function loadData() {
    const res = await fetch("/api/titles");
    titles = await res.json();

    renderStats();
    renderGenres();
    renderUpdates();
    renderFavorites();
    renderList();
}

function showSection(section) {
    document.getElementById("statsSection").classList.toggle("hidden", section !== "stats");
    document.getElementById("listSection").classList.toggle("hidden", section !== "list");

    document.getElementById("statsBtn").classList.toggle("active", section === "stats");
    document.getElementById("listBtn")?.classList.toggle("active", section === "list");
}

function renderStats() {
    const total = titles.length;
    const watching = titles.filter(t => t.status === "Watching").length;
    const completed = titles.filter(t => t.status === "Completed").length;
    const onHold = titles.filter(t => t.status === "On Hold").length;
    const dropped = titles.filter(t => t.status === "Dropped").length;
    const plan = titles.filter(t => t.status === "Plan to Watch").length;

    const episodes = titles.reduce((sum, t) => sum + Number(t.watchedEpisodes || 0), 0);

    const rated = titles.filter(t => t.rating);
    const average = rated.length
        ? (rated.reduce((sum, t) => sum + Number(t.rating), 0) / rated.length).toFixed(2)
        : "0";

    document.getElementById("total").textContent = total;
    document.getElementById("watching").textContent = watching;
    document.getElementById("completed").textContent = completed;
    document.getElementById("onHold").textContent = onHold;
    document.getElementById("dropped").textContent = dropped;
    document.getElementById("plan").textContent = plan;
    document.getElementById("episodes").textContent = episodes;
    document.getElementById("average").textContent = average;
    document.getElementById("animeDays").textContent = (episodes / 24).toFixed(1);

    setBar("watchingBar", watching, total);
    setBar("completedBar", completed, total);
    setBar("holdBar", onHold, total);
    setBar("droppedBar", dropped, total);
    setBar("planBar", plan, total);
}

function setBar(id, value, total) {
    const width = total === 0 ? 0 : (value / total) * 100;
    document.getElementById(id).style.width = width + "%";
}

function renderGenres() {
    const genreCounts = {};

    for (const title of titles) {
        for (const genre of title.genres || []) {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        }
    }

    const topGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

    const max = topGenres[0] ? topGenres[0][1] : 1;

    let html = "";

    for (const [genre, count] of topGenres) {
        html += `
            <div class="genre-row">
                <p>${genre} — ${count}</p>
                <div class="genre-bar">
                    <div class="genre-fill" style="width:${(count / max) * 100}%"></div>
                </div>
            </div>
        `;
    }

    document.getElementById("genres").innerHTML = html;
}

function renderUpdates() {
    const latest = [...titles].slice(-3).reverse();

    let html = "";

    for (const title of latest) {
        const watched = Number(title.watchedEpisodes || 0);
        const total = Number(title.episodes || 0);
        const width = total ? (watched / total) * 100 : 0;

        html += `
            <div class="update-card">
                <img src="${title.image}">
                <div>
                    <h4>${title.name}</h4>
                    <div class="small-progress">
                        <div style="width:${width}%"></div>
                    </div>
                    <p>${title.status} ${watched}/${title.episodes || "?"} · Scored ${title.rating || "-"}</p>
                </div>
            </div>
        `;
    }

    document.getElementById("lastUpdates").innerHTML = html;
}

function renderFavorites() {
    const favorites = titles.slice(0, 4);

    let html = "";

    for (const title of favorites) {
        html += `<img class="favorite-img" src="${title.image}" title="${title.name}">`;
    }

    document.getElementById("favorites").innerHTML = html;
}

function renderList() {
    const list = document.getElementById("myList");

    if (titles.length === 0) {
        list.innerHTML = "<p>Your list is empty.</p>";
        return;
    }

    let html = "";

    for (const title of titles) {
        html += `
            <div class="list-card">
                <img src="${title.image}">
                <div>
                    <h2>${title.name}</h2>
                    <p>${title.watchedEpisodes || 0} / ${title.episodes || "?"} episodes</p>

                    <div class="controls">
                        <select id="status-${title.id}">
                            <option ${title.status === "Plan to Watch" ? "selected" : ""}>Plan to Watch</option>
                            <option ${title.status === "Watching" ? "selected" : ""}>Watching</option>
                            <option ${title.status === "Completed" ? "selected" : ""}>Completed</option>
                            <option ${title.status === "On Hold" ? "selected" : ""}>On Hold</option>
                            <option ${title.status === "Dropped" ? "selected" : ""}>Dropped</option>
                        </select>

                        <input
                            id="episodes-${title.id}"
                            type="number"
                            min="0"
                            max="${title.episodes || 9999}"
                            value="${title.watchedEpisodes || 0}"
                        >

                        <select id="rating-${title.id}">
                            <option value="">Rating</option>
                            ${createRatingOptions(title.rating)}
                        </select>

                        <button onclick="saveTitle('${title.id}')">Save</button>
                        <button class="delete" onclick="deleteTitle('${title.id}')">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }

    list.innerHTML = html;
}

function createRatingOptions(rating) {
    let html = "";

    for (let i = 1; i <= 10; i++) {
        html += `
            <option value="${i}" ${Number(rating) === i ? "selected" : ""}>
                ${i}
            </option>
        `;
    }

    return html;
}

async function saveTitle(id) {
    const title = titles.find(t => t.id === id);

    const statusInput = document.getElementById(`status-${id}`);
    const episodesInput = document.getElementById(`episodes-${id}`);
    const ratingInput = document.getElementById(`rating-${id}`);

    let status = statusInput.value;
    let watchedEpisodes = Number(episodesInput.value);
    let rating = ratingInput.value;

    const totalEpisodes = Number(title.episodes);

    if (totalEpisodes && watchedEpisodes >= totalEpisodes) {
        watchedEpisodes = totalEpisodes;
        status = "Completed";
    }

    if (status === "Completed" && totalEpisodes) {
        watchedEpisodes = totalEpisodes;
    }

    if (watchedEpisodes < 0) {
        watchedEpisodes = 0;
    }

    await fetch(`/api/titles/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            status: status,
            watchedEpisodes: watchedEpisodes,
            rating: rating
        })
    });

    await loadData();
}

async function deleteTitle(id) {
    await fetch(`/api/titles/${id}`, {
        method: "DELETE"
    });

    await loadData();
}

document.getElementById("menuBtn").addEventListener("click", () => {
    document.getElementById("dropdownMenu").classList.toggle("hidden");
});

loadData();