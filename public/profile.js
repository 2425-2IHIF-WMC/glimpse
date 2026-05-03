let titles = [];

async function loadData() {
    const res = await fetch("/api/titles");
    titles = await res.json();

    renderStats();
    renderList();
}

function showSection(section) {
    document.getElementById("statsSection").style.display =
        section === "stats" ? "block" : "none";

    document.getElementById("listSection").style.display =
        section === "list" ? "block" : "none";

    document.getElementById("statsBtn").classList.toggle("active", section === "stats");
    document.getElementById("listBtn").classList.toggle("active", section === "list");
}

function renderStats() {
    document.getElementById("total").textContent = titles.length;

    document.getElementById("watching").textContent =
        titles.filter(t => t.status === "Watching").length;

    document.getElementById("completed").textContent =
        titles.filter(t => t.status === "Completed").length;

    const rated = titles.filter(t => t.rating);
    const average = rated.length
        ? (rated.reduce((sum, t) => sum + Number(t.rating), 0) / rated.length).toFixed(1)
        : "0";

    document.getElementById("average").textContent = average;

    renderGenres();
}

function renderGenres() {
    const genreCounts = {};

    titles.forEach(title => {
        (title.genres || []).forEach(genre => {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
    });

    const topGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

    const max = topGenres[0] ? topGenres[0][1] : 1;

    document.getElementById("genres").innerHTML = topGenres
        .map(([genre, count]) => `
      <div class="genre-row">
        <p>${genre} — ${count}</p>
        <div class="genre-bar">
          <div class="genre-fill" style="width:${(count / max) * 100}%"></div>
        </div>
      </div>
    `)
        .join("");
}

function renderList() {
    const list = document.getElementById("myList");

    if (titles.length === 0) {
        list.innerHTML = "<p>Your list is empty.</p>";
        return;
    }

    list.innerHTML = titles.map(title => `
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
            ${[1,2,3,4,5,6,7,8,9,10].map(num => `
              <option value="${num}" ${Number(title.rating) === num ? "selected" : ""}>
                ${num}
              </option>
            `).join("")}
          </select>

          <button onclick="saveTitle('${title.id}')">Save</button>
          <button class="delete" onclick="deleteTitle('${title.id}')">Delete</button>
        </div>
      </div>
    </div>
  `).join("");
}

async function saveTitle(id) {
    // find current title
    const title = titles.find(t => t.id === id);

    // get inputs
    const statusInput = document.getElementById(`status-${id}`);
    const episodesInput = document.getElementById(`episodes-${id}`);
    const ratingInput = document.getElementById(`rating-${id}`);

    let status = statusInput.value;
    let watchedEpisodes = Number(episodesInput.value);
    let rating = ratingInput.value;

    const totalEpisodes = Number(title.episodes);

    // --- AUTO LOGIC (like MAL) ---

    // If user finished all episodes → mark as completed
    if (totalEpisodes && watchedEpisodes >= totalEpisodes) {
        watchedEpisodes = totalEpisodes;
        status = "Completed";
    }

    // If user manually selects completed → set episodes to max
    if (status === "Completed" && totalEpisodes) {
        watchedEpisodes = totalEpisodes;
    }

    // Prevent negative values
    if (watchedEpisodes < 0) watchedEpisodes = 0;

    // --- SAVE TO SERVER ---
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

    // reload UI
    await loadData();
}

async function deleteTitle(id) {
    await fetch(`/api/titles/${id}`, {
        method: "DELETE"
    });

    await loadData();
}

loadData();