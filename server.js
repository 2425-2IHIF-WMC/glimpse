const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
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

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "main/html/index_homePage_SearchBar.html"));
});

app.get("/profile", (req, res) => {
    res.sendFile(path.join(__dirname, "Profile/html/profile.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "registration/login.html"));
});

app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "registration/register.html"));
});

// ===== TITLES API =====

app.get("/api/titles", (req, res) => {
    const data = read();
    const userId = req.query.userId;

    const titles = data.titles.filter(title =>
        String(title.userId) === String(userId)
    );

    res.json(titles);
});

app.post("/api/titles", (req, res) => {
    const data = read();

    const exists = data.titles.find(t =>
        Number(t.mal_id) === Number(req.body.mal_id) &&
        String(t.userId) === String(req.body.userId)
    );

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
        type: req.body.type || "anime",
        lastUpdated: Date.now(),
        userId: req.body.userId,
        ...req.body
    };

    data.titles.push(newTitle);
    save(data);

    res.json(newTitle);
});

app.put("/api/titles/:id", (req, res) => {
    const data = read();

    const title = data.titles.find(
        t => String(t.id) === String(req.params.id)
    );

    if (!title) {
        return res.status(404).json({
            error: "Title not found"
        });
    }

    title.status = req.body.status;
    title.watchedEpisodes = Number(req.body.watchedEpisodes);
    title.rating = req.body.rating === "" ? null : Number(req.body.rating);
    title.lastUpdated = Date.now();

    save(data);
    res.json(title);
});

app.delete("/api/titles/:id", (req, res) => {
    const data = read();

    data.titles = data.titles.filter(
        t => String(t.id) !== String(req.params.id)
    );

    save(data);

    res.json({
        success: true
    });
});

// ===== FOLDERS API =====

app.get("/api/folders", (req, res) => {
    const data = read();
    const userId = req.query.userId;

    if (!data.folders) {
        data.folders = [];
        save(data);
    }

    const folders = data.folders.filter(folder =>
        String(folder.userId) === String(userId)
    );

    res.json(folders);
});

app.post("/api/folders", (req, res) => {
    const data = read();

    if (!data.folders) {
        data.folders = [];
    }

    const newFolder = {
        id: Date.now().toString(),
        userId: req.body.userId,
        name: req.body.name,
        titleIds: [],
        order: data.folders.length
    };

    data.folders.push(newFolder);
    save(data);

    res.json(newFolder);
});

app.patch("/api/folders/:id", (req, res) => {
    const data = read();

    const folder = data.folders.find(
        f => String(f.id) === String(req.params.id)
    );

    if (!folder) {
        return res.status(404).json({
            error: "Folder not found"
        });
    }

    if (req.body.name !== undefined) {
        folder.name = req.body.name;
    }

    if (req.body.titleIds !== undefined) {
        folder.titleIds = req.body.titleIds;
    }

    save(data);

    res.json(folder);
});

app.delete("/api/folders/:id", (req, res) => {
    const data = read();

    data.folders = data.folders.filter(
        f => String(f.id) !== String(req.params.id)
    );

    save(data);

    res.json({
        success: true
    });
});

// ===== USERS API =====

app.get("/api/users", (req, res) => {
    const data = read();
    res.json(data.users || []);
});

app.post("/api/register", (req, res) => {
    const data = read();

    if (!data.users) {
        data.users = [];
    }

    const exists = data.users.find(user =>
        user.username === req.body.username ||
        user.email === req.body.email
    );

    if (exists) {
        return res.status(409).json({
            error: "Username or email already exists"
        });
    }

    const newUser = {
        id: Date.now().toString(),
        email: req.body.email,
        username: req.body.username,
        password: req.body.password
    };

    data.users.push(newUser);
    save(data);

    res.json(newUser);
});

app.post("/api/login", (req, res) => {
    const data = read();

    const user = data.users.find(user =>
        user.email === req.body.email &&
        user.password === req.body.password
    );

    if (!user) {
        return res.status(401).json({
            error: "Wrong email or password"
        });
    }

    res.json(user);
});

app.patch("/api/users/:id", (req, res) => {
    const data = read();

    const user = data.users.find(user =>
        String(user.id) === String(req.params.id)
    );

    if (!user) {
        return res.status(404).json({
            error: "User not found"
        });
    }

    user.email = req.body.email;
    user.username = req.body.username;
    user.password = req.body.password;

    save(data);

    res.json(user);
});

// ===== START SERVER =====

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});