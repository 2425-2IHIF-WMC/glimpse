const registerForm = document.getElementById('registerForm');

registerForm.addEventListener("submit", async function(event){
    event.preventDefault();
    
    const emailValue = document.getElementById('email').value;
    const usernameValue = document.getElementById('username').value;
    const passwordValue = document.getElementById('password').value;
    
    const newUser = { 
        email: emailValue,
        username: usernameValue,
        password: passwordValue
    };
    
    try{
        const response = await fetch("http://localhost:3000/users", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newUser)
        });
        
        if(response.ok){
            alert("Successfully registered");
            window.location.href="login.html";
        }
        else{
            alert("Failed to register");
        }
    } catch(error){
        console.log("Error with the connection", error);
        alert("server doesnt response. Chech the connection; ", error.message);
    }
});
