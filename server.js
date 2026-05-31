const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());

/*
  🔥 VERY IMPORTANT
  This serves ALL folders (main, Profile, etc.)
*/
app.use(express.static(path.join(__dirname)));

// ===== DATABASE =====

function read() {
    return JSON.parse(
        fs.readFileSync("dataBases/db.json", "utf8")
    );
}

function save(data) {
    fs.writeFileSync(
        "dataBases/db.json",
        JSON.stringify(data, null, 2)
    );
}
// ===== ROUTES =====

// Default page (Discover)
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "main/html/index_homePage_SearchBar.html"));
});

// Profile shortcut route
app.get("/profile", (req, res) => {
    res.sendFile(path.join(__dirname, "Profile/html/profile.html"));
});

// ===== API =====

// GET all titles
app.get("/api/titles", (req, res) => {
    res.json(read().titles);
});

// ADD title (with duplicate protection)
app.post("/api/titles", (req, res) => {
    const data = read();

    const exists = data.titles.find(t => t.mal_id == req.body.mal_id);

    if (exists) {
        return res.status(409).json({
            error: "Already added"
        });
    }

    const newTitle = {
        id: Date.now().toString(),
        rating: null,
        watchedEpisodes: 0,
        status: "Plan to Watch",
        ...req.body
    };

    data.titles.push(newTitle);
    save(data);

    res.json(newTitle);
});

// UPDATE title
app.put("/api/titles/:id", (req, res) => {
    const data = read();
    const title = data.titles.find(t => t.id === req.params.id);

    if (!title) {
        return res.status(404).json({ error: "Title not found" });
    }

    title.status = req.body.status;
    title.watchedEpisodes = Number(req.body.watchedEpisodes);
    title.rating = req.body.rating === "" ? null : Number(req.body.rating);

    save(data);
    res.json(title);
});

// DELETE title
app.delete("/api/titles/:id", (req, res) => {
    const data = read();

    data.titles = data.titles.filter(t => t.id !== req.params.id);

    save(data);

    res.json({ success: true });
});

// ===== START SERVER =====

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});