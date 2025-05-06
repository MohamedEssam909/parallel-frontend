document.addEventListener('DOMContentLoaded', function () {
  loadProfile();
  
  // Scroll to top functionality
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  
  window.addEventListener('scroll', function() {
    const scrollPosition = window.scrollY;
    const pageHeight = document.documentElement.scrollHeight;
    const middlePage = pageHeight / 4;
    
    if (scrollPosition > middlePage) {
      scrollTopBtn.style.display = 'flex';
    } else {
      scrollTopBtn.style.display = 'none';
    }
  });
  
  scrollTopBtn.addEventListener('click', function() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
});

    async function  renderTransaction(){
        const userId = JSON.parse(localStorage.getItem('user_id'))
        const response = await fetch(`https://parallel-backend-production.up.railway.app/transactions?user_id=${userId}`); 
        const data = await response.json();
        const transactions = data[0];
        console.log(transactions)
        let TransactionHTML = `<h2>Latest Transactions</h2>`
        transactions.forEach((transaction)=>{
          TransactionHTML+=
          `   <div class="transactions-table">
                <table>
                    <thead>
                    <tr>
                        <th>Transaction ID</th>
                        <th>Payment Method</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Action</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                    <td>${transaction.transaction_id}</td>
                    <td>
                    <img src="images/visa.svg" alt="Visa" class="payment-logo">
                    </td>
                    <td>$${transaction.amount}</td>
                    <td><span class="status-accepted">Accepted</span></td>
                    <td>${transaction.transaction_date}</td>
                    <td>${transaction.transaction_type}</td>
                    <td><a href="transaction-details.html?id=${transaction.transaction_id}" class="details-btn">Details</a></td>
                    </tr>
                    <!-- Add more dummy transactions here -->
                    </tbody>
                </table>
              </div>`

          });
          document.querySelector(".transactions-section").innerHTML = TransactionHTML;
  }

renderTransaction();