


document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    localStorage.setItem('cart',JSON.stringify([]))
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

  
    const res = await fetch("https://parallel-backend-production.up.railway.app/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
  
    const data = await res.json();

    localStorage.setItem('username', username);
    localStorage.setItem('user_id', data.user_id);
    document.getElementById("message").textContent = data.message;
    if (data.message.includes("successful")) {
      
      window.location.href = "../index.html";
    } else {
     
      document.getElementById("message").textContent = data.message;
    }
   
  
  });



  async function loadProfile() {
    const username = localStorage.getItem('user_id'); 
    console.log(user_id)
  
    if (!user_id) {
      alert('No user id found. Please log in again.');
      window.location.href = '/login.html'; 
      return;
    }
  
    try {
      const response = await fetch(`https://parallel-backend-production.up.railway.app/profileInfo?username=${username}`);
      const profile = await response.json();
      console.log(profile)
      if (profile.message) {
        alert(profile.message);
      } else {
        var pic = document.querySelector('#profilePic');
        if(pic) pic.src = profile.profile_picture || 'defaultPic.jpg';
        var bal = document.querySelector('#balance');
        if(bal) bal.textContent = `Balance: $${profile.balance}`;
        document.querySelector('#bankName').textContent = `Bank: ${profile.bank_name}`;
       document.querySelector('#subscriptionType').textContent = `Subscription: ${profile.subscription_type}`;
       document.querySelector('#cardType').textContent = `Card Type: ${profile.card_type}`;
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }
  



  
