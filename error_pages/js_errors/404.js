
const backBtn = document.querySelector('.btn-primary');


backBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.history.back();
});

const response = await fetch('http://localhost:3000/users/999');

if (response.status === 404) {
    window.location.href = "404.html";
}

window.addEventListener('error', function(event) {
    console.error("Error", event.error);
    window.location.href = "404.html";
});