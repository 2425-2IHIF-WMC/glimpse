document.addEventListener('DOMContentLoaded', async () => {
    const results = await Promise.all([
        fetchTMDB(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&page=1`, 'Cinema'),
        fetchTMDB(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&page=2`, 'Cinema'),
        fetchTMDB(`https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&page=1`, 'Cinema'),
        fetchTMDB(`https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_API_KEY}&page=1`, 'Cinema')
    ]);
    renderItems(results.flat());
});