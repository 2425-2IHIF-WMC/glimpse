const uploadField = document.querySelector(".upload-cover");
const inputImage = document.getElementById("image-file");

uploadField.addEventListener("click", function(){
    inputImage.click();
    alert("Upload File");
});


const itemInput = document.querySelector(".input-Title");
const yearInput = document.querySelector(".input-Year");
const tagInput = document.querySelector(".input-Tag");
const ratingInput = document.getElementById("rating");
const submitButton = document.querySelector(".submit-button");
const error = document.getElementById("error");
// itemInput.addEventListener("blur", function(){
//     const item = itemInput.value;
//
//     if(item.trim() !== ""){
//         alert("The items text is " + item.trim());
//     }
// });
// yearInput.addEventListener("blur", function(){
//     const year = yearInput.value;
//
//     if(year.trim() !== ""){
//         alert("The year text is " + year.trim());
//     }
// });
// tagInput.addEventListener("blur", function(){
//     const tag = tagInput.value;
//
//     if(tag.trim() !== ""){
//         alert("The tags text is " + tag.trim());
//     }
// });

ratingInput.addEventListener("change", function(){
   const ratingText = document.getElementById("number-rating");
   ratingText.innerText = `${ratingInput.value}/10`;
});

submitButton.addEventListener("click", function(){
    // const item = itemInput.value;
    // const year = yearInput.value;
    // const tag = tagInput.value;
    if(itemInput.value.trim() === "" && yearInput.value.trim() === "" && tagInput.value.trim() === ""){
        error.innerText = "Please fill out all the fields";
        error.style.color = "red";
        return;
    }
    else{
        const objectFilled = {
            title: itemInput.value.trim(),
            year: yearInput.value.trim(),
            tag: tagInput.value.trim(),
            rating: ratingInput.value.trim(),
        }
        alert(objectFilled);
    }
    
});


const backButton = document.querySelector(".nav-btn-back");
const continueButton = document.querySelector(".nav-btn-continue");

backButton.addEventListener("click", function(){
    window.location.href = "constructor.html"; 
});
continueButton.addEventListener("click", function(){
    window.location.href = "constructor-2page.html";
});

document.addEventListener('DOMContentLoaded', () => {
    //show the user 
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        const nameEl = document.querySelector('.user-name');
        if (nameEl) nameEl.textContent = currentUser.username;
    } else {
        window.location.href = '../../registration/login.html';
    }
    //get to the user profile page
    const userProfile = document.querySelector('.user-profile');
    if (userProfile) {
        userProfile.style.cursor = 'pointer';
        userProfile.addEventListener('click', () => {
            window.location.href = '../../Profile/html/profile.html';
        });
    }
});


