const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (email === "" || username === "" || password === "") {
        alert("Fill in all fields");
        return;
    }

    const response = await fetch("/api/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email,
            username: username,
            password: password
        })
    });

    if (!response.ok) {
        const error = await response.json();
        alert(error.error);
        return;
    }

    const user = await response.json();

    localStorage.setItem("currentUser", JSON.stringify(user));

    alert("Successfully registered");
    window.location.href = "/";
});