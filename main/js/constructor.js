const continueButton = document.querySelector(".nav-btn");
const cancelButton = document.getElementById("cancel");

cancelButton.addEventListener("click", function(){
    window.location.href = "explore.html";
});

continueButton.addEventListener("click", function(){
    window.location.href = "constructor-1page.html";
});