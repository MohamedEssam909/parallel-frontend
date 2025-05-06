//import {saveToStorage} from './productDetailsPage.js'
//import {products} from '../../data/products.js'
//import {deliveryOptions} from '../../data/deliveryOptions.js'
//import dayjs from 'https://unpkg.com/supersimpledev@8.5.0/dayjs/esm/index.js'

//const today = dayjs();
//const deliveryDate = today.add(7,'days');
//console.log(deliveryDate.format('dddd, MMMM D'));

let cart = JSON.parse(localStorage.getItem('cart')) || [];

function renderCartPage(){
	cart = JSON.parse(localStorage.getItem('cart')) || [];
	const cartContainer = document.querySelector('.js-cart-container');

	if (cart.length === 0) {
		cartContainer.innerHTML = '<p>Your cart is empty.</p>';
		return;
	}
	let productHTML = ``;
	cart.forEach(cartitem => {
		let product = cartitem.item;
		productHTML += `
			<div class="cart-item" style="display: flex; align-items: center; gap: 1rem; padding: 0.5rem; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 0.5rem; background-color: #f9f9f9;">
				<img src="${product.image}" alt="${product.item_name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">
				<div style="flex: 1;">
					<h2 style="font-size: 1rem; margin: 0; font-weight: bold;">${product.item_name}</h2>
					<p style="font-size: 0.9rem; margin: 0.2rem 0;">
						${product.discount_price 
							? `$${product.discount_price} <small style="color: #888;"><s>$${product.actual_price}</s></small>` 
							: `$${product.actual_price}`}
					</p>
					<p style="font-size: 0.8rem; color: #555; margin: 0;">Quantity: ${cartitem.quantity}</p>
					<p style="font-size: 0.9rem; color: #333; margin: 0.5rem 0; font-weight: bold;">Seller: ${product.seller.store_name}</p>
				</div>
				<div style="text-align: right;">
					<div style="font-size: 0.8rem; color: #888;">Rating: ${product.item_rating ? product.item_rating.toFixed(1) : 'No rating'}</div>
					<button class="btn-delete" data-item-id = "${product.item_id}" style="background-color: #ff4d4d; color: white; border: none; padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer;">Delete</button>
				</div>
			</div>
		`;
	});
	cartContainer.innerHTML = productHTML;
	document.querySelectorAll(".btn-delete").forEach((element)=>{
		element.addEventListener('click',(button)=>{
			const id = button.currentTarget.dataset.itemId;
			removeFromCart(id);
			renderCartPage();
			updateOrderSummary();
		})
	
});
}

function removeFromCart(productId){
    const newCart = [];
    cart.forEach((item)=>{
        if (item.productId !== productId)
            newCart.push(item);
    })
    cart = newCart;
    localStorage.setItem('cart',JSON.stringify(cart));
    //console.log(cart);
}


function updateOrderSummary() {
  const cartData = cart;
  let shippingCost = cartData.length > 0 ? 4.99 : 0;
  const totalItems = cartData.reduce((sum, item) => sum + item.quantity, 0);
  const itemsTotal = cartData.reduce((sum, item) => sum + (item.item.discount_price || item.item.actual_price) * item.quantity, 0);
  const subtotal = itemsTotal + shippingCost;

  let totalTax = 0;
  const taxDetails = cartData.length > 0 ? cartData.map(item => {
    const itemPrice = (item.item.discount_price || item.item.actual_price) * item.quantity;
    const itemTax = itemPrice * (item.item.tax_rate / 100 || 0);
    totalTax += itemTax;
    return `
      <div class="tax-item-container">
        <li class="tax-item">${item.item.item_name}</li>
        <span class="tax-info">(${item.item.tax_rate}%)→$${itemTax.toFixed(2)}</span>
      </div>`;
  }).join("") : '';

  const orderTotal = subtotal + totalTax;

  document.querySelector('.js-total-items').textContent = totalItems;
  document.querySelector('.js-items-total').textContent = `$${itemsTotal.toFixed(2)}`;
  document.querySelector('.js-shipping').textContent = `$${shippingCost.toFixed(2)}`;
  document.querySelector('.js-subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.querySelector('.js-tax').innerHTML = taxDetails;
  document.querySelector('.total-tax').innerHTML = `<span>$${totalTax.toFixed(2)}</span>`;
  document.querySelector('.js-order-total').textContent = `$${orderTotal.toFixed(2)}`;

  // Disable place order button and show empty cart message when cart is empty
  const placeOrderButton = document.querySelector('.place-order-button');
  if (cartData.length === 0) {
    placeOrderButton.disabled = true;
    placeOrderButton.style.opacity = '0.5';
    placeOrderButton.style.cursor = 'not-allowed';
  } else {
    checkFundsAndUpdateButton();
  }
}

async function fetchUserBalance() {
  try {
    const userId = JSON.parse(localStorage.getItem('user_id'));
    const response = await fetch(`https://parallel-backend-production.up.railway.app/user/balance?user_id=${userId}`); 
    const data = await response.json();
    console.log(data[0])
    const balanceElement = document.querySelector('.js-user-balance');
    balanceElement.textContent = `$${Number(data[0].balance).toFixed(2)}`;
    checkFundsAndUpdateButton(); // Add this line
     
  } catch (error) {
    console.error('Error fetching user balance:', error);
    document.querySelector('.js-user-balance').textContent = 'Error fetching balance';
  }
}

// Add this new function
function checkFundsAndUpdateButton() {
  const placeOrderButton = document.querySelector('.place-order-button');
  const summaryTitle = document.querySelector('.payment-summary-title');
  const errorMessage = document.querySelector('.insufficient-funds-message') || document.createElement('div');
  errorMessage.className = 'insufficient-funds-message';
  
  const balanceText = document.querySelector('.js-user-balance').textContent;
  const orderTotalText = document.querySelector('.js-order-total').textContent;
  const balance = parseFloat(balanceText.replace('$', ''));
  const orderTotal = parseFloat(orderTotalText.replace('$', ''));

  if (balance < orderTotal && orderTotal > 0) {
    // Disable button and show error
    placeOrderButton.disabled = true;
    placeOrderButton.style.opacity = '0.5';
    placeOrderButton.style.cursor = 'not-allowed';
    placeOrderButton.style.backgroundColor = '#ccc';
    
    // Update error message with requested text
    errorMessage.innerHTML = `
      <div style="
        background: linear-gradient(to right, #fff5f5, #fff);
        border-left: 4px solid #dc3545;
        border-radius: 4px;
        padding: 16px;
        margin: 20px 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        animation: slideIn 0.3s ease-out;
      ">
        <div style="display: flex; align-items: center; gap: 12px;">
          <svg style="width: 24px; height: 24px; color: #dc3545;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div>
            <div style="font-weight: 600; color: #dc3545; margin-bottom: 4px;">Insufficient Funds</div>
            <div style="color: #666; font-size: 14px;">Your current balance is insufficient to complete this order.</div>
          </div>
        </div>
      </div>
      <style>
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>
    `;

    if (!document.querySelector('.insufficient-funds-message')) {
      summaryTitle.parentNode.insertBefore(errorMessage, summaryTitle);
    }
  } else {
    // Enable button and restore styles
    placeOrderButton.disabled = false;
    placeOrderButton.style.opacity = '1';
    placeOrderButton.style.cursor = 'pointer';
    placeOrderButton.style.backgroundColor = '';
    if (errorMessage.parentNode) {
      errorMessage.remove();
    }
  }
}

document.addEventListener('DOMContentLoaded', fetchUserBalance);

window.addEventListener('load', () => {
  renderCartPage();
});

document.addEventListener('DOMContentLoaded', () => {
  updateOrderSummary()
});

document.addEventListener('DOMContentLoaded', () => {
  const placeOrderButton = document.querySelector('.place-order-button');

  const loadingBar = document.getElementById("loadingBar");

  // Simulate fetching data
  function enableLoading() {
	loadingBar.style.display = "block";
	placeOrderButton.disabled = true;

  }

  function disableLoading() {
	loadingBar.style.display = "none";
	  placeOrderButton.disabled = false;
  }

  
  disableLoading();

  placeOrderButton.addEventListener('click', async () => {
    try {
      const cartData = JSON.parse(localStorage.getItem('cart')) || [];
      const id = JSON.parse(localStorage.getItem('user_id'));

      if (cartData.length === 0) {
        alert('Your cart is empty.');
        return;
      }

      const orderDetails = cartData.map(item => ({
        item_id: item.item.item_id,
        quantity: item.quantity,
        price_at_purchase: item.item.discount_price || item.item.actual_price,
        seller_id: item.item.seller.store_name,
        tax_rate: item.item.tax_rate
      }));

      enableLoading();
      const response = await fetch('https://parallel-backend-production.up.railway.app/orders/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order: orderDetails,
          userId: id
        }),     
      });

      disableLoading();
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('cart', JSON.stringify([]));
        window.location.href = 'shoppingPage.html?orderSuccess=true';
      } else {
        if (data.message === 'Insufficient funds') {
          alert('Transaction failed: Insufficient funds available in your account.');
        } else if (data.message === 'Insufficient stock') {
          alert('Transaction failed: Some items are no longer in stock.');
        } else {
          alert(`Error placing order: ${data.message}`);
        }
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('An error occurred while placing your order. Please try again.');
    }
  });
});

