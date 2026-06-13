const userId = window.location.pathname.split('/').pop();

async function loadUser() {
   
    const res = await fetch('/api/users');
    const users = await res.json();

    let user = null;

    for (let i = 0; i < users.length; i++) {
        if (String(users[i].id) === String(userId)) {
            user = users[i];
            break; 
        }
    }

   
    if (user === null) {
        window.location.href = '/error_pages/404.html';
        return;
    }
    
    document.title = user.username + ' — Glimpse';
    document.getElementById('username').textContent = user.username;

    if (user.bio) {
        document.getElementById('bio').textContent = user.bio;
    } else {
        document.getElementById('bio').textContent = 'No bio yet.';
    }

   
    const avatar = document.getElementById('avatar');

    if (user.avatarImage) {
        avatar.style.backgroundImage = `url(${user.avatarImage})`;
        avatar.textContent = ''; 
    } else {
        avatar.textContent = user.username.charAt(0).toUpperCase();
    }

    if (user.bannerImage) {
        document.getElementById('banner').style.backgroundImage = `url(${user.bannerImage})`;
    }

    
    const titlesRes = await fetch('/api/titles?userId=' + user.id);
    const titles = await titlesRes.json();

    const grid = document.getElementById('titlesGrid');
    grid.innerHTML = ''; 

    if (titles.length === 0) {
        grid.innerHTML = '<p class="empty">No titles yet.</p>';
        return;
    }
    
    for (let i = 0; i < titles.length; i++) {
        let currentTitle = titles[i];

        let card = document.createElement('div');
        card.className = 'title-card';

        let imageUrl = currentTitle.image;
        if (!imageUrl) {
            imageUrl = 'https://via.placeholder.com/100x150';
        }

        card.innerHTML = `
            <img src="${imageUrl}" alt="${currentTitle.name}">
            <div class="title-card-name">${currentTitle.name}</div>
        `;

        grid.appendChild(card);
    }
}

loadUser();