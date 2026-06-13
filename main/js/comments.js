const reviewInput = document.querySelector('.review-input');
const submitBtn = document.querySelector('.submit-review-btn');
const reviewsContainer = document.querySelector('.reviews-container');

const contentId = localStorage.getItem('selectedItemId');
const currentUser = JSON.parse(localStorage.getItem('currentUser'));

async function loadLocalReviews() {
    try {
        const res = await fetch('/api/reviews?contentId=' + contentId);
        const reviews = await res.json();

        for (let i = 0; i < reviews.length; i++) {
            addReviewCard(
                reviews[i].authorName,
                reviews[i].text,
                reviews[i].id,
                reviews[i].userId,
                reviews[i].authorAvatar 
            );
        }
    } catch (error) {
        console.error(error);
    }
}

function addReviewCard(authorName, text, reviewId, authorId, authorAvatar) {
    const card = document.createElement('div');
    card.className = 'review-card-users';

    const safeName = authorName || "Anonymous";
    const firstLetter = safeName.charAt(0).toUpperCase();

    let deleteBtn = '';
    if (currentUser && String(currentUser.id) === String(authorId)) {
        deleteBtn = `<button class="delete-review-btn" data-id="${reviewId}">Delete</button>`;
    }

    let avatarHTML = '';
    if (authorAvatar && authorAvatar.trim() !== '') {
        avatarHTML = `
            <img src="${authorAvatar}" alt="avatar" class="review-avatar-user" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="review-avatar-user fallback-avatar" style="display:none; background: #B6A0FF; color: #340090; justify-content: center; align-items: center; font-weight: bold;">
                ${firstLetter}
            </div>
        `;
    } else {
        avatarHTML = `
            <div class="review-avatar-user" style="background: #B6A0FF; color: #340090; display: flex; justify-content: center; align-items: center; font-weight: bold;">
                ${firstLetter}
            </div>
        `;
    }

    card.innerHTML = `
        <div class="review-header-users" style="display: flex; align-items: center; width: 100%;">
            ${avatarHTML}
            <div class="review-info" style="margin-left: 12px;">
                <span class="review-author-user" data-user-id="${authorId}" style="cursor: pointer;">${safeName}</span>
            </div>
            ${deleteBtn}
        </div>
        <p class="review-text-user" style="margin-top: 12px;">${text}</p>
    `;

    const authorSpan = card.querySelector('.review-author-user');
    if (authorSpan) {
        authorSpan.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            window.location.href = '/user/' + userId;
        });
    }

    const btn = card.querySelector('.delete-review-btn');
    if (btn) {
        btn.addEventListener('click', async function() {
            const id = this.getAttribute('data-id');
            await fetch('/api/reviews/' + id, { method: 'DELETE' });
            card.remove();
        });
    }

    reviewsContainer.prepend(card);
}

submitBtn.addEventListener('click', async function() {
    const text = reviewInput.value.trim();

    if (!text) return;

    if (!currentUser) {
        alert('Please login first.');
        window.location.href = '../../registration/login.html'; 
        return;
    }

    try {
        const res = await fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                authorName: currentUser.username,
                authorAvatar: currentUser.avatarImage || '', 
                contentId: contentId,
                text: text
            })
        });

        const newReview = await res.json();

        addReviewCard(newReview.authorName, newReview.text, newReview.id, newReview.userId, newReview.authorAvatar);

        reviewInput.value = ''; 
    } catch (error) {
        console.error(error);
    }
});

reviewInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        submitBtn.click();
    }
});

loadLocalReviews();