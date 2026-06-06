document.addEventListener('DOMContentLoaded', async () => {
    const promises = [];
    for (let page = 1; page <= 5; page++) {
        promises.push(fetchTMDB(
            `https://api.themoviedb.org/3/trending/all/week?api_key=${TMDB_API_KEY}&page=${page}`
        ));
    }
    const results = await Promise.all(promises);
    renderItems(results.flat());
});