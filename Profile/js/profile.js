let titles = [];
let folders = [];
let creatingFolder = false;

let currentTypeFilter = "all";
let currentStatusFilter = "all";
let currentSearchText = "";
let currentSort = "recent";

let currentUser = JSON.parse(localStorage.getItem("currentUser"));

if (!currentUser || !currentUser.id) {
    window.location.href = "/";
}

document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "/";
});


// ===== LOAD DATA =====
async function loadData() {
    const res = await fetch(
        "/api/titles?userId=" + currentUser.id
    );

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
    const res = await fetch("/api/folders?userId=" + currentUser.id);

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

    if (currentStatusFilter === "Watching" || currentStatusFilter === "Reading" || currentStatusFilter === "Playing") {
        currentStatusFilter = "active";
    }

    updateStatusFilterLabels();
    updateTypeButtons();
    updateStatusButtons();
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
    document.getElementById("settingsSection").classList.toggle("hidden", section !== "settings");
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
        const genres = title.genres || [];

        for (const genre of genres) {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        }
    }

    const genres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

    if (genres.length === 0) {
        document.getElementById("genres").innerHTML = "<p>No genres yet.</p>";
        return;
    }

    const max = genres[0][1];

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

        filteredTitles = filteredTitles.filter(title => {

            const type = String(title.type).toLowerCase();
            const source = String(title.apiSource || "").toLowerCase();

            if (currentTypeFilter === "anime") {
                return (
                    source === "jikan" ||
                    type === "anime" ||
                    type === "tv" ||
                    type === "ova" ||
                    type === "ona" ||
                    type === "special"
                );
            }

            if (currentTypeFilter === "series") {
                return (
                    source === "tmdb" &&
                    type === "series"
                );
            }

            if (currentTypeFilter === "movie") {
                return (
                    source === "tmdb" &&
                    (
                        type === "movie" ||
                        type === "cinema" ||
                        type === "documentary"
                    )
                );
            }

            return type === currentTypeFilter;
        });
    }

    if (currentStatusFilter === "active") {
        filteredTitles = filteredTitles.filter(title =>
            title.status === getActiveStatusName()
        );
    } else if (currentStatusFilter !== "all") {
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
                            <option ${title.status === getPlanStatusName() ? "selected" : ""}>${getPlanStatusName()}</option>
                            <option ${title.status === getActiveStatusName() ? "selected" : ""}>${getActiveStatusName()}</option>
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
                name: name,
                userId: currentUser.id
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
    overlay.className = "folder-modal-overlay";

    const modal = document.createElement("div");
    modal.className = "folder-modal";

    modal.innerHTML = `
        <div class="folder-modal-header">
            <div>
                <p class="folder-modal-label">Folder</p>
                <h2 id="folderModalTitle">${folder.name}</h2>
            </div>

            <button id="closeFolderModalBtn" class="folder-icon-btn">✕</button>
        </div>

        <div class="folder-modal-actions">
            <input id="folderRenameInput" value="${folder.name}">
            <button id="renameFolderModalBtn">Rename</button>
            <button id="deleteFolderModalBtn" class="danger-btn">Delete</button>
        </div>

        <div class="folder-add-box">
            <h3>Add Titles</h3>
            <input id="folderTitleSearchInput" placeholder="Search your list...">
            <div id="folderSearchDropdown"></div>
        </div>

        <div class="folder-content-top">
            <h3>Titles in this folder</h3>
            <span id="folderTitleCount">0 titles</span>
        </div>

        <div id="folderTitlesGrid" class="folder-titles-grid"></div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.getElementById("closeFolderModalBtn").addEventListener("click", () => {
        overlay.remove();
    });

    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            overlay.remove();
        }
    });

    document.getElementById("renameFolderModalBtn").addEventListener("click", async () => {
        const newName = document.getElementById("folderRenameInput").value.trim();

        if (newName === "") {
            alert("Folder name cannot be empty");
            return;
        }

        folder.name = newName;

        await saveFolderToServer(folder);
        await loadFolders();

        document.getElementById("folderModalTitle").textContent = newName;
    });

    document.getElementById("deleteFolderModalBtn").addEventListener("click", async () => {
        const sure = confirm("Delete this folder?");

        if (!sure) {
            return;
        }

        await fetch("/api/folders/" + folder.id, {
            method: "DELETE"
        });

        await loadFolders();
        overlay.remove();
    });

    const searchInput = document.getElementById("folderTitleSearchInput");
    const dropdown = document.getElementById("folderSearchDropdown");

    searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim().toLowerCase();

        dropdown.innerHTML = "";

        if (query.length < 1) {
            dropdown.style.display = "none";
            return;
        }

        if (!folder.titleIds) {
            folder.titleIds = [];
        }

        const matches = titles.filter(title =>
            title.name.toLowerCase().includes(query) &&
            !folder.titleIds.includes(String(title.id))
        );

        if (matches.length === 0) {
            dropdown.innerHTML = `<p class="folder-empty-search">No titles found</p>`;
            dropdown.style.display = "block";
            return;
        }

        for (const title of matches) {
            const row = document.createElement("div");
            row.className = "folder-search-row";

            row.innerHTML = `
                <img src="${title.image}" alt="${title.name}">

                <div>
                    <h4>${title.name}</h4>
                    <p>${title.status} · ${title.watchedEpisodes || 0}/${title.episodes || "?"}</p>
                </div>

                <button>Add</button>
            `;

            row.querySelector("button").addEventListener("click", async () => {
                folder.titleIds.push(String(title.id));

                await saveFolderToServer(folder);
                await loadFolders();

                searchInput.value = "";
                dropdown.style.display = "none";

                renderFolderTitles();
            });

            dropdown.appendChild(row);
        }

        dropdown.style.display = "block";
    });

    function renderFolderTitles() {
        const grid = document.getElementById("folderTitlesGrid");
        const count = document.getElementById("folderTitleCount");

        grid.innerHTML = "";

        if (!folder.titleIds) {
            folder.titleIds = [];
        }

        const folderTitles = folder.titleIds
            .map(id => titles.find(title => String(title.id) === String(id)))
            .filter(title => title);

        count.textContent = folderTitles.length + " titles";

        if (folderTitles.length === 0) {
            grid.innerHTML = `
                <div class="folder-empty-state">
                    <h3>No titles yet</h3>
                    <p>Search above and add titles from your list.</p>
                </div>
            `;
            return;
        }

        for (const title of folderTitles) {
            const card = document.createElement("div");
            card.className = "folder-title-card";

            card.innerHTML = `
                <img src="${title.image}" alt="${title.name}">

                <div class="folder-title-info">
                    <h3>${title.name}</h3>
                    <p>${title.status}</p>
                    <p>${title.watchedEpisodes || 0}/${title.episodes || "?"} episodes</p>
                    <p>Rating: ${title.rating || "—"}</p>
                </div>

                <button class="remove-folder-title-btn">Remove</button>
            `;

            card.querySelector(".remove-folder-title-btn").addEventListener("click", async () => {
                folder.titleIds = folder.titleIds.filter(id =>
                    String(id) !== String(title.id)
                );

                await saveFolderToServer(folder);
                await loadFolders();

                renderFolderTitles();
            });

            grid.appendChild(card);
        }
    }

    renderFolderTitles();
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

// ===== USER SETTINGS =====

function loadUserSettings() {
    document.getElementById("profileName").textContent = currentUser.username;

    document.getElementById("profileBioText").textContent =
        currentUser.bio || "Track your anime journey.";

    document.getElementById("settingsDisplayName").textContent = currentUser.username;
    document.getElementById("settingsDisplayEmail").textContent = currentUser.email;

    document.getElementById("settingsEmail").value = currentUser.email;
    document.getElementById("settingsUsername").value = currentUser.username;
    document.getElementById("settingsPassword").value = "";

}

async function updateCurrentUser(email, username, password) {
    const response = await fetch("/api/users/" + currentUser.id, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email,
            username: username,
            password: password
        })
    });

    if (!response.ok) {
        alert("Could not update account");
        return;
    }

    const updatedUser = await response.json();

    localStorage.setItem("currentUser", JSON.stringify(updatedUser));

    alert("Account updated");
    window.location.reload();
}

const settingsTabs = document.querySelectorAll(".settings-tab");

settingsTabs.forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".settings-tab").forEach(tab => {
            tab.classList.remove("active");
        });

        document.querySelectorAll(".settings-page").forEach(page => {
            page.classList.remove("active");
        });

        button.classList.add("active");

        const tabName = button.dataset.settingsTab;
        document.getElementById("settings-" + tabName).classList.add("active");
    });
});

document.getElementById("saveAccountInfoBtn").addEventListener("click", async () => {
    const email = document.getElementById("settingsEmail").value.trim();
    const username = document.getElementById("settingsUsername").value.trim();

    if (email === "" || username === "") {
        alert("Fill in all fields");
        return;
    }

    await updateCurrentUser(
        email,
        username,
        currentUser.password
    );
});

document.getElementById("savePasswordBtn").addEventListener("click", async () => {
    const password = document.getElementById("settingsPassword").value.trim();

    if (password === "") {
        alert("Password cannot be empty");
        return;
    }

    await updateCurrentUser(
        currentUser.email,
        currentUser.username,
        password
    );
});

document.getElementById("deleteAccountBtn").addEventListener("click", async () => {
    const sure = confirm("Delete your account forever?");

    if (!sure) {
        return;
    }

    const response = await fetch("/api/users/" + currentUser.id, {
        method: "DELETE"
    });

    if (!response.ok) {
        alert("Could not delete account");
        return;
    }

    localStorage.removeItem("currentUser");

    alert("Account deleted");
    window.location.href = "/";
});

function getActiveStatusName() {
    if (currentTypeFilter === "book") {
        return "Reading";
    }

    if (currentTypeFilter === "game") {
        return "Playing";
    }

    return "Watching";
}

function getPlanStatusName() {
    if (currentTypeFilter === "book" || currentTypeFilter === "manga") {
        return "Plan to Read";
    }

    if (currentTypeFilter === "game") {
        return "Plan to Play";
    }

    if (currentTypeFilter === "movie") {
        return "Plan to Watch";
    }

    return "Plan to Watch";
}

function updateStatusFilterLabels() {
    document.getElementById("activeStatusBtn").textContent = getActiveStatusName();
    document.getElementById("planStatusBtn").textContent = getPlanStatusName();
}

function applyTheme(theme) {

    document.body.classList.remove(
        "theme-night",
        "theme-blossom",
        "theme-japan",
        "theme-blackout"
    );

    document.body.classList.add("theme-" + theme);
}

document.querySelectorAll(".design-card").forEach(card => {

    card.addEventListener("click", async () => {

        const theme = card.dataset.design;

        applyTheme(theme);

        const response = await fetch(
            "/api/users/" + currentUser.id,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    profileTheme: theme
                })
            }
        );

        if(response.ok) {

            currentUser.profileTheme = theme;

            localStorage.setItem(
                "currentUser",
                JSON.stringify(currentUser)
            );
        }
    });
});

document.querySelectorAll(".design-nav").forEach(button => {
    button.addEventListener("click", () => {
        const pageName = button.dataset.designPage;
        const page = document.getElementById("design-" + pageName);

        if (!page) {
            console.log("Missing page:", "design-" + pageName);
            return;
        }

        document.querySelectorAll(".design-nav").forEach(nav => {
            nav.classList.remove("active");
        });

        document.querySelectorAll(".design-page").forEach(page => {
            page.classList.remove("active");
        });

        button.classList.add("active");
        page.classList.add("active");
    });
});

document.getElementById("profileBio").value = currentUser.bio || "";

function saveCurrentUserChanges(changes) {
    return fetch("/api/users/" + currentUser.id, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(changes)
    });
}

function updateLocalUser(updatedUser) {
    localStorage.setItem(
        "currentUser",
        JSON.stringify(updatedUser)
    );
}

document.getElementById("saveBioBtn").addEventListener("click", async () => {
    const bio = document.getElementById("profileBio").value.trim();

    const response = await saveCurrentUserChanges({
        bio: bio
    });

    if (!response.ok) {
        alert("Could not save bio");
        return;
    }

    const updatedUser = await response.json();
    updateLocalUser(updatedUser);

    document.getElementById("profileBioText").textContent =
        updatedUser.bio || "Track your anime journey.";

    alert("Bio saved");
});

function getUserFavorites() {
    if (!currentUser.favorites) {
        currentUser.favorites = [];
    }

    return currentUser.favorites;
}

function renderFavoriteSearch() {
    const input = document.getElementById("favoriteSearchInput");
    const results = document.getElementById("favoriteSearchResults");

    if (!input || !results) {
        return;
    }

    const query = input.value.trim().toLowerCase();
    results.innerHTML = "";

    if (query === "") {
        return;
    }

    const favorites = getUserFavorites();

    const matches = titles.filter(title =>
        title.name.toLowerCase().includes(query) &&
        !favorites.includes(String(title.id))
    );

    if (matches.length === 0) {
        results.innerHTML = "<p>No titles found.</p>";
        return;
    }

    for (const title of matches) {
        const row = document.createElement("div");
        row.className = "favorite-row";

        row.innerHTML = `
            <div class="favorite-row-info">
                <img src="${title.image}" alt="${title.name}">
                <div>
                    <h4>${title.name}</h4>
                    <p>${title.status || "No status"}</p>
                </div>
            </div>

            <button>Add</button>
        `;

        row.querySelector("button").addEventListener("click", async () => {
            favorites.push(String(title.id));

            const response = await saveCurrentUserChanges({
                favorites: favorites
            });

            if (!response.ok) {
                alert("Could not add favorite");
                return;
            }

            const updatedUser = await response.json();
            currentUser = updatedUser;
            updateLocalUser(updatedUser);

            input.value = "";
            renderFavoriteSearch();
            renderFavoritesSettings();
        });

        results.appendChild(row);
    }
}

function renderFavoritesSettings() {
    const box = document.getElementById("favoriteTitlesList");

    if (!box) {
        return;
    }

    box.innerHTML = "";

    const favorites = getUserFavorites();

    if (favorites.length === 0) {
        box.innerHTML = "<p>No favorites yet.</p>";
        return;
    }

    for (const id of favorites) {
        const title = titles.find(title =>
            String(title.id) === String(id)
        );

        if (!title) {
            continue;
        }

        const row = document.createElement("div");
        row.className = "favorite-row";

        row.innerHTML = `
            <div class="favorite-row-info">
                <img src="${title.image}" alt="${title.name}">
                <div>
                    <h4>${title.name}</h4>
                    <p>${title.status || "No status"}</p>
                </div>
            </div>

            <button>Remove</button>
        `;

        row.querySelector("button").addEventListener("click", async () => {
            const updatedFavorites = favorites.filter(favId =>
                String(favId) !== String(id)
            );

            const response = await saveCurrentUserChanges({
                favorites: updatedFavorites
            });

            if (!response.ok) {
                alert("Could not remove favorite");
                return;
            }

            const updatedUser = await response.json();
            currentUser = updatedUser;
            updateLocalUser(updatedUser);

            renderFavoriteSearch();
            renderFavoritesSettings();
        });

        box.appendChild(row);
    }
}

const favoriteSearchInput = document.getElementById("favoriteSearchInput");

if (favoriteSearchInput) {
    favoriteSearchInput.addEventListener("input", renderFavoriteSearch);
}

const clearFavoritesBtn = document.getElementById("clearFavoritesBtn");

if (clearFavoritesBtn) {
    clearFavoritesBtn.addEventListener("click", async () => {
        const response = await saveCurrentUserChanges({
            favorites: []
        });

        if (!response.ok) {
            alert("Could not clear favorites");
            return;
        }

        const updatedUser = await response.json();
        currentUser = updatedUser;
        updateLocalUser(updatedUser);

        renderFavoritesSettings();
        renderFavoriteSearch();
    });
}

let selectedAvatarImage = currentUser.avatarImage || "";
let selectedBannerImage = currentUser.bannerImage || "";

function applyProfilePictures() {
    const avatar = document.getElementById("profileAvatar");
    const banner = document.getElementById("profileBanner");

    if (currentUser.avatarImage) {
        avatar.textContent = "";
        avatar.style.backgroundImage = `url(${currentUser.avatarImage})`;
        avatar.style.backgroundSize = "cover";
        avatar.style.backgroundPosition = "center";
    }

    if (currentUser.bannerImage) {
        banner.style.backgroundImage = `url(${currentUser.bannerImage})`;
        banner.style.backgroundSize = "cover";
        banner.style.backgroundPosition = "center";
    }

    const avatarPreview = document.getElementById("avatarPreview");
    const bannerPreview = document.getElementById("bannerPreview");

    if (avatarPreview && currentUser.avatarImage) {
        avatarPreview.src = currentUser.avatarImage;
    }

    if (bannerPreview && currentUser.bannerImage) {
        bannerPreview.src = currentUser.bannerImage;
    }
}

function readImageFile(file, callback) {
    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {
        alert("Only image files are allowed");
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        callback(reader.result);
    };

    reader.readAsDataURL(file);
}

const avatarFileInput = document.getElementById("avatarFileInput");

if (avatarFileInput) {
    avatarFileInput.addEventListener("change", event => {
        const file = event.target.files[0];

        readImageFile(file, image => {
            selectedAvatarImage = image;
            document.getElementById("avatarPreview").src = image;
        });
    });
}

const bannerFileInput = document.getElementById("bannerFileInput");

if (bannerFileInput) {
    bannerFileInput.addEventListener("change", event => {
        const file = event.target.files[0];

        readImageFile(file, image => {
            selectedBannerImage = image;
            document.getElementById("bannerPreview").src = image;
        });
    });
}

const savePicturesBtn = document.getElementById("savePicturesBtn");

if (savePicturesBtn) {
    savePicturesBtn.addEventListener("click", async () => {
        const response = await saveCurrentUserChanges({
            avatarImage: selectedAvatarImage,
            bannerImage: selectedBannerImage
        });

        if (!response.ok) {
            alert("Could not save pictures");
            return;
        }

        const updatedUser = await response.json();

        currentUser = updatedUser;
        updateLocalUser(updatedUser);
        applyProfilePictures();

        alert("Pictures saved");
    });
}

// ===== INIT =====

loadData();
loadFolders();
loadUserSettings();
updateTypeButtons();
updateStatusButtons();
updateStatusFilterLabels();
renderFavoritesSettings();
applyProfilePictures();