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

    const promises = [];
    for (let page = 1; page <= 5; page++) {
        promises.push(fetchTMDB(
            `https://api.themoviedb.org/3/trending/all/week?api_key=${TMDB_API_KEY}&page=${page}`
        ));
    }
    const results = await Promise.all(promises);
    renderItems(results.flat());
});