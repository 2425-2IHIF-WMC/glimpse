document.addEventListener('DOMContentLoaded', async () => {
    const results = await Promise.all([
        fetchTMDB(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&page=1`, 'Cinema'),
        fetchTMDB(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&page=2`, 'Cinema'),
        fetchTMDB(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&page=1`, 'Series'),
        fetchTMDB(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&page=2`, 'Series'),
        fetchTMDB(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=99&page=1`, 'Documentary'),
        fetchJikan('tv'),
        fetchJikan('movie')
    ]);
    renderItems(results.flat());
});