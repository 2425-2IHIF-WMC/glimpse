document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser) {
        window.location.href = '../../registration/login.html';
        return;
    }

    const nameEl = document.querySelector('.user-name');
    if (nameEl) nameEl.textContent = currentUser.username;

    const avatarEl = document.querySelector(".user-profile .avatar");
    if (currentUser.avatarImage && avatarEl) {
        avatarEl.style.backgroundImage = `url(${currentUser.avatarImage})`;
        avatarEl.style.backgroundSize = "cover";
        avatarEl.style.backgroundPosition = "center";
        avatarEl.style.backgroundColor = "transparent";
    }

    const userProfile = document.querySelector('.user-profile');
    if (userProfile) {
        userProfile.style.cursor = 'pointer';
        userProfile.addEventListener('click', () => {
            window.location.href = '../../Profile/html/profile.html';
        });
    }

    await loadSavedTitles();

    const results = await Promise.all([
        fetchTMDB(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&page=1`, 'Series'),
        fetchTMDB(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&page=2`, 'Series'),
        fetchTMDB(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&with_networks=213&sort_by=popularity.desc&page=1`, 'Series'),
        fetchTMDB(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&with_networks=49&sort_by=popularity.desc&page=1`, 'Series'),
        fetchTMDB(`https://api.themoviedb.org/3/tv/top_rated?api_key=${TMDB_API_KEY}&page=1`, 'Series')
    ]);
    renderItems(results.flat());
});