document.addEventListener('DOMContentLoaded', async () => {
    const results = await Promise.all([
        fetchTMDB(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=99&sort_by=popularity.desc&page=1`, 'Documentary'),
        fetchTMDB(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=99&sort_by=popularity.desc&page=2`, 'Documentary'),
        fetchTMDB(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&with_genres=99&sort_by=popularity.desc&page=1`, 'Documentary'),
        fetchTMDB(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&with_genres=99&sort_by=popularity.desc&page=2`, 'Documentary')
    ]);
    renderItems(results.flat());
});