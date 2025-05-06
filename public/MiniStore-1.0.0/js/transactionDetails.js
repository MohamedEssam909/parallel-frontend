document.addEventListener('DOMContentLoaded', async function () {
  const urlParams = new URLSearchParams(window.location.search);
  const transactionId = urlParams.get('id');

  if (transactionId) {
    try {
      const response = await fetch(`https://parallel-backend-production.up.railway.app/transactions/byId/?transactionId=${transactionId}`);
      const transaction = await response.json();

      const userId = localStorage.getItem('user_id')
      const response2 = await fetch(`https://parallel-backend-production.up.railway.app/buyerAccount/?user_id=${userId}`);
      const buyerInfo = await response2.json();
   
      const response3 = await fetch(`https://parallel-backend-production.up.railway.app/productsDetails/?user_id=${userId}`);
      const orderlist = await response3.json();
      
      let matchedorder;
      const txMinute = toMinuteString(transaction.transaction_date);
      orderlist.forEach(order => {
        const orderMinute = toMinuteString(order.order_time); 
        if (txMinute === orderMinute) {
            matchedorder = order;
            }
        });
      //console.log(matchedorder)
      const response4 = await fetch(`https://parallel-backend-production.up.railway.app/orderContents/?order_id=${matchedorder.order_id}`);
      const ordercontents = await response4.json();
      //console.log(ordercontents)

      let orderitemHTML = `<div class="section-title">Product Details</div>`;
      ordercontents.forEach((item)=>{
          orderitemHTML+=
          `<div class="product-info">
              <img src="${item.image}" alt="Product" class="product-image">
              <div>
                  <h3>${item.name}</h3>
                  <div class="info-grid">
                      <div class="info-item">
                          <div class="info-label">Unit Price</div>
                          <div class="info-value">$${item.price_at_purchase}</div>
                      </div>
                      <div class="info-item">
                          <div class="info-label">Quantity</div>
                          <div class="info-value">${item.quantity}</div>
                      </div>
                      <div class="info-item">
                          <div class="info-label">Seller</div>
                          <div class="info-value">${item.store_name}</div>
                      </div>
                  </div>
              </div>
          </div>`
          document.querySelector('.section-product').innerHTML = orderitemHTML;
      });
      const response5 = await fetch(`https://parallel-backend-production.up.railway.app/paymentInfo/?order_id=${matchedorder.order_id}`);
      const paymentInfo = await response5.json();
      
      
      console.log(buyerInfo)
    
      if (paymentInfo) {

        document.querySelector('.info-Method').innerHTML = `${paymentInfo[0].method}`;
        document.querySelector('.info-payment-date').innerHTML = `${paymentInfo[0].payment_date}`;

        document.querySelector('.sub-total').innerHTML = `$${paymentInfo[0].amount_without_taxes}`;
        let taxPercentage = Math.round((Number(paymentInfo[0].tax_amount) / Number(paymentInfo[0].amount_without_taxes)) * 100)
        let Total = Number(paymentInfo[0].amount_without_taxes) + 4.99 + Number(paymentInfo[0].tax_amount);
        document.querySelector('.Tax-percent').innerHTML = `Tax (${taxPercentage}%)`;
        document.querySelector('.Tax').innerHTML = `$${paymentInfo[0].tax_amount}`;
        document.querySelector('.total').innerHTML = `$${Total.toFixed(2)}`;

      } 

      if (transaction) {
        document.querySelector('.info-transaction-id').innerHTML = `${transaction.transaction_id}`;
        document.querySelector('.info-date').innerHTML = `${transaction.transaction_date}`;
        document.querySelector('.info-amount').innerHTML = `$${transaction.amount}`;
        
      } 

      if (buyerInfo) {
        document.querySelector('.info-name').innerHTML = `${buyerInfo.fname} ${buyerInfo.lname}`;
        document.querySelector('.info-minit').innerHTML = `${buyerInfo.minit}`;
        document.querySelector('.info-phone').innerHTML = `${buyerInfo.phone_num}`;
        document.querySelector('.info-address').innerHTML = `${buyerInfo.address}`;
        document.querySelector('.info-country').innerHTML = `${buyerInfo.country}`;
      } 






    } catch (error) {
      console.error('Error fetching transaction details:', error);
      document.querySelector('.transaction-details').innerHTML = '<p>Error loading transaction details.</p>';
    }
  } else {
    document.querySelector('.transaction-details').innerHTML = '<p>No transaction ID provided.</p>';
  }
});


function toMinuteString(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
}
  