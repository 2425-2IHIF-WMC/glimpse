const continueButton = document.querySelector(".nav-btn");
const cancelButton = document.getElementById("cancel");

cancelButton.addEventListener("click", function(){
    window.location.href = "explore.html";
});

continueButton.addEventListener("click", function(){
    window.location.href = "constructor-1page.html";
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