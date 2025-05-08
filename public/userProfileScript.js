async function loadProfile() {

  document.getElementById('loader').style.display = 'flex';
  const user_id = localStorage.getItem('user_id'); // get saved user_id
  console.log("User ID:", user_id);

  if (!user_id) {
    alert('No user ID found. Please log in again.');
    window.location.href = '/login.html'; // redirect if not logged in
    return;
  }

  try {
    const response = await fetch(`https://parallel-backend-production.up.railway.app/profileInfo?user_id=${user_id}`);
    const profile = await response.json();
    console.log("Profile:", profile);

    if (profile.message === 'Account info not found for this user') {
      // Redirect to create account page if no account exists
      window.location.href = 'createAccount.html';
      return;
    }

    if (profile.message) {
      alert(profile.message);
    } else {
      
      var name = document.querySelector('#name');
      if (name) {
        name.textContent = `${profile.name}`;
      }
      var pic = document.querySelector('#profilePic');
      console.log(pic,"pic",profile.profile_picture)
      if (profile.profile_picture) {
        pic.src = profile.profile_picture;
      }
      var bal = document.querySelector('#balance');
      if (bal) {
        bal.textContent = `  $${profile.balance}`;
      }
      var bank = document.querySelector('#bankName');
      if (bank) {
        bank.textContent = ` ${profile.bank_name}`;
      }
      var subscription = document.querySelector('#subscriptionType');
      if (subscription) {
        subscription.textContent = `Subscription: ${profile.subscription_type}`;
      }
      var card = document.querySelector('#cardType');
      if (card) {
        card.textContent = ` ${profile.card_type}`;
      }
      var item_num = document.querySelector('#items_number');
      if (item_num) {
        item_num.textContent = ` ${profile.item_count} items`;
      }
      var desc=document.querySelector('#description');
      if(desc){
        desc.textContent = profile.address ? profile.address : "New Thunder Seller";

      }
      var avg_days = document.querySelector('#avgDays');
if (avg_days) {
  const avg = profile.average_days_between_purchases ?? 0;
  avg_days.textContent = ` ${avg} Days Between Purchases`;
}

      var coun=document.querySelector('#country');
      if(coun){
        coun.textContent=`${profile.country}`
      }


      var itemsGrid = document.getElementById('itemsGrid');
      const sold_grid = document.getElementById('Sold');
      const to_be_sold_grid = document.getElementById('TobeSold');
      const purschased_grid = document.getElementById('Purschased');
      if (itemsGrid && profile.items && profile.items.length > 0) {
        profile.items.forEach(item => {
          const itemDiv = document.createElement('div');
          itemDiv.className = 'item-card';



          const picc=document.createElement('img');
          picc.src=item.image;
          picc.className = 'item-image'
          picc.onerror=function (){
            this.onerror=null;
            this.src="/box.png";
          }



          itemDiv.innerHTML = `
            <h3>${item.name}</h3>
            <p><strong>Store Name:</strong> ${profile.seller_info?.store_name}</p>
            <p><strong>Price:</strong> $${item.actual_price}</p>
            <p><strong>Rating:</strong> ${item.rating}</p>
            <p><strong>Type:</strong> ${item.type}</p>
            

          `;

          itemDiv.insertBefore(picc,itemDiv.firstChild);

          const type = item.type;
          if (type === 'sold') {
            sold_grid.appendChild(itemDiv);
          } else if (type === 'to_be_sold') {
            to_be_sold_grid.appendChild(itemDiv);
          } else {
            purschased_grid.appendChild(itemDiv);
          }

          



        });
        }
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  }
  finally{
    document.getElementById('loader').style.display = 'none'; // Hide loader
  }
}


async function addFunds() {
  const user_id = localStorage.getItem('user_id');
  const amount = document.getElementById('fundAmount').value;
  
  if (!amount || isNaN(amount)) {
    alert('Please enter a valid amount');
    return;
  }

  try {
    const response = await fetch('https://parallel-backend-production.up.railway.app/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, amount: parseFloat(amount) })
    });
    
    const result = await response.json();
    if (result.success) {
      alert('Funds added successfully!');
      loadProfile(); // Refresh the profile to show updated balance
    } else {
      alert(result.message || 'Error adding funds');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error adding funds');
  }
}