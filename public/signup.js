document.getElementById("signupForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const user_id = document.getElementById("ssn").value;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const fname=document.getElementById("fname").value;
    const lname=document.getElementById("lname").value;
    const country=document.getElementById("country").value;
  
    const res = await fetch("https://parallel-backend-production.up.railway.app/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, username, password,fname,lname,country })
    });
  
    const data = await res.json();
    document.getElementById("signup-message").textContent = data.message;
  });
  