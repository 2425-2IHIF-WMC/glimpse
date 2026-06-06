// --- All what is really needed ---
const reviewInput = document.querySelector('.review-input');
const submitBtn = document.querySelector('.submit-review-btn');
const reviewsContainer = document.querySelector('.reviews-container');

submitBtn.addEventListener('click', function() {
    const textReview = reviewInput.value.trim(); 

    if(textReview) {
        const newReviewCard = document.createElement('div');

        newReviewCard.className = 'review-card-users';

        newReviewCard.innerHTML = `
            <div class="review-header">
                <div class="review-avatar-user">U</div>
                <div class="review-info">
                    <span class="review-author-user">You</span>
                </div>
            </div>
            <p class="review-text-user">${textReview}</p>
        `;

        reviewsContainer.appendChild(newReviewCard);

        reviewInput.value = '';
    }
});

reviewInput.addEventListener('keydown', function(event){
    if(event.key === 'Enter'){
        event.preventDefault();
        submitBtn.click();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    //shows the user
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        const nameEl = document.querySelector('.user-name');
        if (nameEl) nameEl.textContent = currentUser.username;
    } else {
        window.location.href = '../../registration/login.html';
    }
    //get to the profile page
    const userProfile = document.querySelector('.user-profile');
    if (userProfile) {
        userProfile.style.cursor = 'pointer';
        userProfile.addEventListener('click', () => {
            window.location.href = '../../Profile/html/profile.html';
        });
    }
});