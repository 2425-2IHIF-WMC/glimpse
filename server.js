const express = require("express");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

function read() {
    return JSON.parse(fs.readFileSync("data.json", "utf8"));
}

function save(data) {
    fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
}

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/api/titles", (req, res) => {
    res.json(read().titles);
});

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

app.put("/api/titles/:id", (req, res) => {
    const data = read();

    const title = data.titles.find(t => t.id === req.params.id);

    if (!title) {
        return res.status(404).json({
            error: "Title not found"
        });
    }

    title.status = req.body.status;
    title.watchedEpisodes = Number(req.body.watchedEpisodes);
    title.rating = req.body.rating === "" ? null : Number(req.body.rating);

    save(data);

    res.json(title);
});

app.delete("/api/titles/:id", (req, res) => {
    const data = read();

    data.titles = data.titles.filter(t => t.id !== req.params.id);

    save(data);

    res.json({
        success: true
    });
});

app.listen(PORT, () => {
    console.log("Running on http://localhost:3000");
});