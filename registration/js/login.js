const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async function(event){
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const response = await fetch(`http://localhost:3000/users?email=${email}`);
    
    const users = await response.json();
    
    if(users.length == 0){
        alert('No users found.');
        return; 
    }
    const user = users[0];
    if(user.password != password){
        alert('Passwords do not match.');
        return;
    }
    alert('Successfully logged in');
    localStorage.setItem('currentUser', JSON.stringify(user));
    window.location.href="index.html";
    
})