document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

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

    const uploadField = document.querySelector(".upload-cover");
    const inputImage = document.getElementById("image-file");

    if (uploadField && inputImage) {
        uploadField.addEventListener("click", function(){
            inputImage.click();
            alert("Upload File");
        });
    }

    const itemInput = document.querySelector(".input-Title");
    const yearInput = document.querySelector(".input-Year");
    const tagInput = document.querySelector(".input-Tag");
    const ratingInput = document.getElementById("rating");
    const submitButton = document.querySelector(".submit-button");
    const error = document.getElementById("error");

    if (ratingInput) {
        ratingInput.addEventListener("change", function(){
            const ratingText = document.getElementById("number-rating");
            if (ratingText) ratingText.innerText = `${ratingInput.value}/10`;
        });
    }

    if (submitButton && itemInput && yearInput && tagInput) {
        submitButton.addEventListener("click", function(){
            if(itemInput.value.trim() === "" && yearInput.value.trim() === "" && tagInput.value.trim() === ""){
                if (error) {
                    error.innerText = "Please fill out all the fields";
                    error.style.color = "red";
                }
                return;
            } else {
                const objectFilled = {
                    title: itemInput.value.trim(),
                    year: yearInput.value.trim(),
                    tag: tagInput.value.trim(),
                    rating: ratingInput ? ratingInput.value.trim() : ""
                };
            }
        });
    }

    const backButton = document.querySelector(".nav-btn-back");
    const continueButton = document.querySelector(".nav-btn-continue");

    if (backButton) {
        backButton.addEventListener("click", function(){
            window.location.href = "constructor.html";
        });
    }

    if (continueButton) {
        continueButton.addEventListener("click", function(){
            window.location.href = "constructor-2page.html";
        });
    }
});