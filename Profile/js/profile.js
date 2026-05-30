let titles = [];

async function loadData() {
    const res = await fetch("/api/titles");
    titles = await res.json();

    renderStats();
    renderProgress();
    renderGenres();
    renderUpdates();
    renderFavorites();
    renderList();
}

function showSection(section) {
    document.getElementById("statsSection").classList.toggle("hidden", section !== "stats");
    document.getElementById("listSection").classList.toggle("hidden", section !== "list");
}

function renderStats() {
    const total = titles.length;

    const watching = titles.filter(title => title.status === "Watching").length;
    const completed = titles.filter(title => title.status === "Completed").length;

    const rated = titles.filter(title => title.rating);
    const average = rated.length
        ? (rated.reduce((sum, title) => sum + Number(title.rating), 0) / rated.length).toFixed(1)
        : "0";

    document.getElementById("total").textContent = total;
    document.getElementById("watching").textContent = watching;
    document.getElementById("completed").textContent = completed;
    document.getElementById("average").textContent = average;
}

function renderProgress() {
    const statuses = [
        "Watching",
        "Completed",
        "On Hold",
        "Dropped",
        "Plan to Watch"
    ];

    let html = "";

    for (const status of statuses) {
        const count = titles.filter(title => title.status === status).length;
        const width = titles.length === 0 ? 0 : (count / titles.length) * 100;

        html += `
            <div class="progress-row">
                <p>
                    <span>${status}</span>
                    <span>${count}</span>
                </p>

                <div class="progress-bar">
                    <div class="progress-fill" style="width:${width}%"></div>
                </div>
            </div>
        `;
    }

    document.getElementById("progressOverview").innerHTML = html;
}

function renderGenres() {
    const genreCounts = {};

    for (const title of titles) {
        for (const genre of title.genres || []) {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        }
    }

    const genres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

    const max = genres[0] ? genres[0][1] : 1;

    let html = "";

    for (const genre of genres) {
        const name = genre[0];
        const count = genre[1];

        html += `
            <div class="genre-row">
                <p>
                    <span>${name}</span>
                    <span>${count}</span>
                </p>

                <div class="genre-bar">
                    <div class="genre-fill" style="width:${(count / max) * 100}%"></div>
                </div>
            </div>
        `;
    }

    document.getElementById("genres").innerHTML = html;
}