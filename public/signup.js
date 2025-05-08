document.getElementById("signupForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const messageElement = document.getElementById("signup-message");
    messageElement.textContent = "";
    messageElement.style.color = "black";
    
    const submitBtn = document.querySelector("#signupForm button[type='submit']");
    submitBtn.disabled = true;
    
    try {
      // Get all form values
      const formData = {
        user_id: document.getElementById("ssn").value,
        username: document.getElementById("username").value,
        password: document.getElementById("password").value,
        fname: document.getElementById("fname").value,
        lname: document.getElementById("lname").value,
        country: document.getElementById("country").value,
        minit: document.getElementById("minit").value,
        phone_num: document.getElementById("phone number").value,
        gender: document.getElementById("gender").value,
        date_birth: document.getElementById("date_birth").value
      };
  
      // Validate required fields
      if (!formData.user_id || formData.user_id.length !== 9) {
        throw new Error("SSN must be 9 digits");
      }
  
      const response = await fetch("https://parallel-backend-production.up.railway.app/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
  
      const result = await response.json();
  
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Signup failed");
      }
  
      // Success handling
      messageElement.style.color = "green";
      messageElement.textContent = result.message;
      localStorage.setItem('user_id', formData.user_id);
      
      setTimeout(() => {
        window.location.href = "createAccount.html";
      }, 1500);
  
    } catch (error) {
      messageElement.style.color = "red";
      messageElement.textContent = error.message;
      console.error("Signup error:", error);
    } finally {
      submitBtn.disabled = false;
    }
  });