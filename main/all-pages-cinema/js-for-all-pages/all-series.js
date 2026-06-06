document.addEventListener('DOMContentLoaded', async () => {
    const results = await Promise.all([
        fetchTMDB(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&page=1`, 'Series'),
        fetchTMDB(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&page=2`, 'Series'),
        fetchTMDB(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&with_networks=213&sort_by=popularity.desc&page=1`, 'Series'),
        fetchTMDB(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&with_networks=49&sort_by=popularity.desc&page=1`, 'Series'),
        fetchTMDB(`https://api.themoviedb.org/3/tv/top_rated?api_key=${TMDB_API_KEY}&page=1`, 'Series')
    ]);
    renderItems(results.flat());
});