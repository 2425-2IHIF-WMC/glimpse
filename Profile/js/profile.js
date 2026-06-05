let titles = [];
let folders = [];
let creatingFolder = false;

let currentTypeFilter = "all";
let currentStatusFilter = "all";
let currentSearchText = "";
let currentSort = "recent";

const currentUser = JSON.parse(
    localStorage.getItem("currentUser")
);

if (!currentUser) {
    window.location.href = "/login";
}

// ===== LOAD DATA =====

async function loadData() {
    const res = await fetch("/api/titles");

    if (!res.ok) {
        console.log("Could not load titles");
        return;
    }

    titles = await res.json();

    renderStats();
    renderProgress();
    renderGenres();
    renderUpdates();
    renderFavorites();
    renderList();
}

async function loadFolders() {
    const res = await fetch("/api/folders");

    if (!res.ok) {
        console.log("Could not load folders");
        return;
    }

    folders = await res.json();
    renderFoldersList();
}

async function saveFolderToServer(folder) {
    if (!folder || !folder.id) {
        console.log("Folder has no id:", folder);
        return;
    }

    await fetch("/api/folders/" + folder.id, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: folder.name,
            titleIds: folder.titleIds
        })
    });
}

// ===== FILTERS =====

function setTypeFilter(type) {
    currentTypeFilter = type;
    updateTypeButtons();
    renderList();
}

function setStatusFilter(status) {
    currentStatusFilter = status;
    updateStatusButtons();
    renderList();
}

function updateTypeButtons() {
    const buttons = document.querySelectorAll("#typeFilters button");

    buttons.forEach(button => {
        button.classList.remove("active");

        if (
            button.dataset.type === currentTypeFilter
        ) {
            button.classList.add("active");
        }
    });
}

function updateStatusButtons() {
    const buttons = document.querySelectorAll("#statusFilters button");

    buttons.forEach(button => {
        button.classList.remove("active");

        if (
            button.dataset.status === currentStatusFilter
        ) {
            button.classList.add("active");
        }
    });
}

// ===== SECTIONS =====

function showSection(section) {
    document.getElementById("statsSection").classList.toggle("hidden", section !== "stats");
    document.getElementById("listSection").classList.toggle("hidden", section !== "list");
}

// ===== STATS =====

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

function renderUpdates() {
    const latest = [...titles].slice(-3).reverse();

    let html = "";

    for (const title of latest) {
        html += `
            <div class="update-card">
                <img src="${title.image}" alt="${title.name}">

                <div>
                    <h3>${title.name}</h3>
                    <p>${title.status}</p>
                    <p>${title.watchedEpisodes || 0} / ${title.episodes || "?"} episodes</p>
                    <p>Rating: ${title.rating || "-"}</p>
                </div>
            </div>
        `;
    }

    document.getElementById("lastUpdates").innerHTML = html;
}

function renderFavorites() {
    const favorites = titles.slice(0, 5);

    let html = "";

    for (const title of favorites) {
        html += `
            <img
                class="favorite-img"
                src="${title.image}"
                alt="${title.name}"
                title="${title.name}"
            >
        `;
    }

    document.getElementById("favorites").innerHTML = html;
}

// ===== LIST =====

function renderList() {
    const list = document.getElementById("myList");

    let filteredTitles = [...titles];

    if (currentTypeFilter !== "all") {
        filteredTitles = filteredTitles.filter(title =>
            title.type === currentTypeFilter
        );
    }

    if (currentStatusFilter !== "all") {
        filteredTitles = filteredTitles.filter(title =>
            title.status === currentStatusFilter
        );
    }

    if (currentSearchText !== "") {
        filteredTitles = filteredTitles.filter(title =>
            title.name.toLowerCase().includes(currentSearchText)
        );
    }

    if (currentSort === "recent") {
        filteredTitles.sort((a, b) =>
            Number(b.lastUpdated || b.id) - Number(a.lastUpdated || a.id)
        );
    }

    if (currentSort === "nameAZ") {
        filteredTitles.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (currentSort === "nameZA") {
        filteredTitles.sort((a, b) => b.name.localeCompare(a.name));
    }

    if (currentSort === "ratingHigh") {
        filteredTitles.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }

    if (currentSort === "ratingLow") {
        filteredTitles.sort((a, b) => Number(a.rating || 0) - Number(b.rating || 0));
    }

    if (currentSort === "episodesHigh") {
        filteredTitles.sort((a, b) => Number(b.episodes || 0) - Number(a.episodes || 0));
    }

    if (currentSort === "episodesLow") {
        filteredTitles.sort((a, b) => Number(a.episodes || 0) - Number(b.episodes || 0));
    }

    if (filteredTitles.length === 0) {
        list.innerHTML = "<p>No titles found.</p>";
        return;
    }

    let html = "";

    for (const title of filteredTitles) {
        html += `
            <div class="list-card">
                <img src="${title.image}" alt="${title.name}">

                <div>
                    <h2>${title.name}</h2>

                    <p>
                        ${title.watchedEpisodes || 0}
                        /
                        ${title.episodes || "?"}
                        episodes
                    </p>

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

                        <button onclick="saveTitle('${title.id}')">
                            Save
                        </button>

                        <button class="delete" onclick="deleteTitle('${title.id}')">
                            Delete
                        </button>
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
    const title = titles.find(title => String(title.id) === String(id));

    if (!title) {
        console.log("Title not found");
        return;
    }

    const statusInput = document.getElementById(`status-${id}`);
    const episodesInput = document.getElementById(`episodes-${id}`);
    const ratingInput = document.getElementById(`rating-${id}`);

    let status = statusInput.value;
    let watchedEpisodes = Number(episodesInput.value);
    const rating = ratingInput.value;

    const totalEpisodes = Number(title.episodes);

    if (watchedEpisodes < 0) {
        watchedEpisodes = 0;
    }

    if (totalEpisodes && watchedEpisodes >= totalEpisodes) {
        watchedEpisodes = totalEpisodes;
        status = "Completed";
    }

    if (status === "Completed" && totalEpisodes) {
        watchedEpisodes = totalEpisodes;
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

// ===== MENU =====

document.getElementById("menuBtn").addEventListener("click", () => {
    document.getElementById("dropdownMenu").classList.toggle("hidden");
});

// ===== FOLDERS =====

function renderFoldersList() {
    const container = document.getElementById("foldersList");

    container.innerHTML = "";

    if (folders.length === 0) {
        return;
    }

    for (const folder of folders) {
        const item = document.createElement("div");
        item.className = "folder-item";
        item.textContent = folder.name;

        item.addEventListener("click", () => openFolderModal(folder.id));

        container.appendChild(item);
    }
}

document.getElementById("addFolderBtn").addEventListener("click", () => {
    if (creatingFolder) {
        return;
    }

    creatingFolder = true;

    const container = document.getElementById("foldersList");

    const wrapper = document.createElement("div");
    wrapper.style.cssText = "display:flex;gap:6px;margin-top:8px;";

    const input = document.createElement("input");
    input.placeholder = "Folder name";
    input.style.cssText = "flex:1;padding:7px 10px;border-radius:10px;border:1px solid #33334a;background:#10101a;color:white;font-size:13px;";

    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "✓";
    confirmBtn.style.cssText = "padding:7px 11px;border-radius:10px;background:#8e75ff;color:white;border:none;cursor:pointer;";

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "✕";
    cancelBtn.style.cssText = "padding:7px 11px;border-radius:10px;background:#2a2a3a;color:white;border:none;cursor:pointer;";

    async function confirm() {
        const name = input.value.trim();

        if (!name) {
            input.focus();
            return;
        }

        await fetch("/api/folders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name
            })
        });

        creatingFolder = false;
        await loadFolders();
    }

    function cancel() {
        creatingFolder = false;
        renderFoldersList();
    }

    confirmBtn.addEventListener("click", confirm);
    cancelBtn.addEventListener("click", cancel);

    input.addEventListener("keydown", async e => {
        if (e.key === "Enter") {
            await confirm();
        }

        if (e.key === "Escape") {
            cancel();
        }
    });

    wrapper.appendChild(input);
    wrapper.appendChild(confirmBtn);
    wrapper.appendChild(cancelBtn);

    container.appendChild(wrapper);
    input.focus();
});

// ===== FOLDER MODAL =====

function openFolderModal(folderId) {
    const folder = folders.find(f => String(f.id) === String(folderId));

    if (!folder) {
        return;
    }

    const existing = document.getElementById("folderModal");

    if (existing) {
        existing.remove();
    }

    const overlay = document.createElement("div");
    overlay.id = "folderModal";
    overlay.style.cssText = `
        position:fixed;
        inset:0;
        background:rgba(0,0,0,0.7);
        display:flex;
        align-items:center;
        justify-content:center;
        z-index:1000;
    `;

    const modal = document.createElement("div");
    modal.style.cssText = `
        background:#12121e;
        border:1px solid rgba(255,255,255,0.1);
        border-radius:20px;
        padding:28px;
        width:480px;
        max-width:95vw;
        max-height:80vh;
        display:flex;
        flex-direction:column;
        gap:16px;
        box-shadow:0 24px 60px rgba(0,0,0,0.5);
    `;

    const header = document.createElement("div");
    header.style.cssText = "display:flex;align-items:center;gap:10px;";

    const titleEl = document.createElement("h2");
    titleEl.textContent = folder.name;
    titleEl.style.cssText = "margin:0;flex:1;font-size:20px;";

    const renameInput = document.createElement("input");
    renameInput.value = folder.name;
    renameInput.style.cssText = "flex:1;padding:7px 10px;border-radius:10px;border:1px solid #33334a;background:#10101a;color:white;display:none;";

    const renameBtn = document.createElement("button");
    renameBtn.textContent = "Rename";
    renameBtn.style.cssText = "padding:7px 12px;border-radius:10px;background:#2a2a3a;color:white;border:none;cursor:pointer;font-size:12px;";

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.style.cssText = "padding:7px 12px;border-radius:10px;background:#8b2f42;color:white;border:none;cursor:pointer;font-size:12px;";

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "✕";
    closeBtn.style.cssText = "padding:7px 11px;border-radius:10px;background:#1a1a28;color:white;border:none;cursor:pointer;";

    let renaming = false;

    renameBtn.addEventListener("click", async () => {
        if (!renaming) {
            renaming = true;

            titleEl.style.display = "none";
            renameInput.style.display = "block";
            renameInput.focus();

            renameBtn.textContent = "Save";
        } else {
            const newName = renameInput.value.trim();

            if (!newName) {
                return;
            }

            folder.name = newName;

            await saveFolderToServer(folder);
            await loadFolders();

            titleEl.textContent = newName;
            titleEl.style.display = "block";
            renameInput.style.display = "none";

            renameBtn.textContent = "Rename";
            renaming = false;
        }
    });

    deleteBtn.addEventListener("click", async () => {
        await fetch("/api/folders/" + folderId, {
            method: "DELETE"
        });

        await loadFolders();
        overlay.remove();
    });

    closeBtn.addEventListener("click", () => overlay.remove());

    overlay.addEventListener("click", e => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });

    header.appendChild(titleEl);
    header.appendChild(renameInput);
    header.appendChild(renameBtn);
    header.appendChild(deleteBtn);
    header.appendChild(closeBtn);

    const searchWrap = document.createElement("div");
    searchWrap.style.cssText = "position:relative;";

    const searchInput = document.createElement("input");
    searchInput.placeholder = "Search your titles to add...";
    searchInput.style.cssText = "width:100%;padding:10px 14px;border-radius:12px;border:1px solid #33334a;background:#10101a;color:white;font-size:14px;box-sizing:border-box;";

    const searchDropdown = document.createElement("div");
    searchDropdown.style.cssText = `
        position:absolute;
        top:calc(100% + 6px);
        left:0;
        right:0;
        background:#191927;
        border:1px solid #33334a;
        border-radius:12px;
        max-height:220px;
        overflow-y:auto;
        z-index:10;
        display:none;
    `;

    searchWrap.appendChild(searchInput);
    searchWrap.appendChild(searchDropdown);

    searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim().toLowerCase();

        searchDropdown.innerHTML = "";

        if (query.length < 1) {
            searchDropdown.style.display = "none";
            return;
        }

        if (!folder.titleIds) {
            folder.titleIds = [];
        }

        const matches = titles.filter(t =>
            t.name.toLowerCase().includes(query) &&
            !folder.titleIds.includes(String(t.id))
        );

        if (matches.length === 0) {
            searchDropdown.style.display = "none";
            return;
        }

        for (const t of matches) {
            const row = document.createElement("div");

            row.style.cssText = "display:flex;align-items:center;gap:12px;padding:8px 12px;cursor:pointer;border-radius:8px;";

            row.innerHTML = `
                <img src="${t.image}" style="width:36px;height:52px;object-fit:cover;border-radius:6px;flex-shrink:0;">

                <div>
                    <div style="font-size:14px;color:#f3f3f7;">${t.name}</div>
                    <div style="font-size:12px;color:#aaa9bd;">
                        ${t.status} · ${t.watchedEpisodes || 0}/${t.episodes || "?"} eps
                    </div>
                </div>
            `;

            row.addEventListener("mouseenter", () => {
                row.style.background = "#252539";
            });

            row.addEventListener("mouseleave", () => {
                row.style.background = "";
            });

            row.addEventListener("click", async () => {
                folder.titleIds.push(String(t.id));

                await saveFolderToServer(folder);
                await loadFolders();

                searchInput.value = "";
                searchDropdown.style.display = "none";

                renderFolderTitles();
            });

            searchDropdown.appendChild(row);
        }

        searchDropdown.style.display = "block";
    });

    const titlesContainer = document.createElement("div");
    titlesContainer.style.cssText = "overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:10px;";

    function renderFolderTitles() {
        titlesContainer.innerHTML = "";

        if (!folder.titleIds) {
            folder.titleIds = [];
        }

        const folderTitles = folder.titleIds
            .map(id => titles.find(t => String(t.id) === String(id)))
            .filter(t => t);

        if (folderTitles.length === 0) {
            titlesContainer.innerHTML = `
                <p style="color:#aaa9bd;margin:0;">
                    No titles yet. Search above to add some.
                </p>
            `;
            return;
        }

        for (const t of folderTitles) {
            const card = document.createElement("div");

            card.style.cssText = "display:flex;align-items:center;gap:14px;background:#171727;border-radius:12px;padding:10px 14px;";

            card.innerHTML = `
                <img src="${t.image}" style="width:44px;height:63px;object-fit:cover;border-radius:8px;flex-shrink:0;">

                <div style="flex:1;">
                    <div style="font-size:14px;font-weight:bold;">${t.name}</div>

                    <div style="font-size:12px;color:#aaa9bd;margin-top:3px;">
                        ${t.status} · ${t.watchedEpisodes || 0}/${t.episodes || "?"} eps · Rating: ${t.rating || "—"}
                    </div>
                </div>

                <button data-remove="${t.id}" style="padding:6px 10px;border-radius:8px;background:#8b2f42;color:white;border:none;cursor:pointer;font-size:12px;flex-shrink:0;">
                    Remove
                </button>
            `;

            card.querySelector("[data-remove]").addEventListener("click", async () => {
                folder.titleIds = folder.titleIds.filter(id => String(id) !== String(t.id));

                await saveFolderToServer(folder);
                await loadFolders();

                renderFolderTitles();
            });

            titlesContainer.appendChild(card);
        }
    }

    renderFolderTitles();

    modal.appendChild(header);
    modal.appendChild(searchWrap);
    modal.appendChild(titlesContainer);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

// ===== SEARCH + SORT EVENTS =====

document.getElementById("listSearchInput").addEventListener("input", e => {
    currentSearchText = e.target.value.trim().toLowerCase();
    renderList();
});

document.getElementById("sortSelect").addEventListener("change", e => {
    currentSort = e.target.value;
    renderList();
});

// ===== INIT =====

loadData();
loadFolders();
updateTypeButtons();
updateStatusButtons();