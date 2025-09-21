// ========== CONFIG ==========
const EMAILJS_SERVICE_ID = "service_al4zpdb";
const EMAILJS_TEMPLATE_ID = "template_vimeo5m";
const EMAILJS_PUBLIC_KEY = "CRkybtSL0tLoJJ71X";

// Firebase (disabled by default)
const firebaseConfig = null;
let firebaseEnabled = false;
if (typeof firebase !== 'undefined' && firebaseConfig) {
  try {
    firebase.initializeApp(firebaseConfig);
    var db = firebase.firestore();
    firebaseEnabled = true;
  } catch (e) {
    console.warn("Firebase init error:", e);
  }
}

// ===== Products =====
const PRODUCTS = [
  {
    id: 'p1',
    title: 'Educational Geometric Shape Sorting & Stacking Toy',
    originalPrice: 399,
    price: 199,
    images: ["./1000069559.jpg","./1000069560.jpg","./1000069561.jpg"],
    description: 'A perfect educational toy for toddlers to learn colors, shapes, and motor skills.'
  }
];

let REVIEWS = [
  { name: 'Priya S.', text: 'Amazing quality!', rating: 5 },
  { name: 'Amit V.', text: 'Fast delivery, great service.', rating: 5 },
  { name: 'Sneha R.', text: 'Exceeded my expectations.', rating: 4 }
];

const el = id => document.getElementById(id);
let cart = {};
let addresses = [], selectedAddressIndex = null;
let loggedInUser = null;

// ===== Login/User Functions =====
function handleLogin() {
    // This is a placeholder for actual login logic.
    // In a real application, you would use a service like Firebase Auth.
    loggedInUser = "TestUser"; // Set a dummy user for demonstration
    el('login-btn').classList.add('hidden');
    el('user-display').classList.remove('hidden');
    el('user-display').textContent = `Welcome, ${loggedInUser}!`;
    alert("Logged in as TestUser. (This is a placeholder)");
}

// ===== Render Products =====
function renderProducts(){
  const container = el('products');
  const grid = document.createElement('div'); grid.className = 'products-grid';
  PRODUCTS.forEach(p=>{
    const card = document.createElement('div'); card.className = 'card';
    card.innerHTML = `
      <img src="${p.images[0]}" alt="${p.title}">
      <h3>${p.title}</h3>
      <div class="price">
        ${p.originalPrice ? `<span class="original-price">₹${p.originalPrice}</span>` : ""}
        ₹${p.price} ${p.originalPrice ? `<span class="sale-tag">Sale</span>` : ""}
      </div>
      <button class="buy-btn" onclick="showProductDetail('${p.id}')">BUY NOW</button>
      <button class="add-btn small" onclick="addToCart('${p.id}',1)">Add to Cart</button>
    `;
    grid.appendChild(card);
  });
  const old = container.querySelector('.products-grid'); if (old) old.remove();
  container.appendChild(grid);
}

// ===== Product Detail =====
function showProductDetail(id){
  const product = PRODUCTS.find(x=>x.id===id); if (!product) return;
  el('products').classList.add('hidden');
  el('product-detail').classList.remove('hidden');
  const content = el('product-detail-content');
  let price = product.originalPrice
    ? `<span class="original-price">₹${product.originalPrice}</span> ₹${product.price} <span class="sale-tag">Sale</span>`
    : `₹${product.price}`;
  content.innerHTML = `
    <div class="product-details-container">
      <div class="product-image-section">
        <img src="${product.images[0]}" alt="${product.title}" id="main-product-image">
      </div>
      <div class="product-info-section">
        <h2>${product.title}</h2>
        <div class="price">${price}</div>
        <p>${product.description}</p>
        <div class="quantity-selector-pill">
          <button onclick="changeQtyOnDetail(-1)">-</button>
          <span id="detail-qty">1</span>
          <button onclick="changeQtyOnDetail(1)">+</button>
        </div>
        <button class="checkout-btn" onclick="addToCartAndCheckout('${product.id}')">BUY NOW</button>
        <button class="add-btn" onclick="addToCart('${product.id}',Number(el('detail-qty').textContent))">Add to Cart</button>
      </div>
    </div>
  `;
  renderReviews();
}

function changeQtyOnDetail(c){
  const q=el('detail-qty'); let v=+q.textContent+c; if(v<1)v=1; q.textContent=v;
}
function addToCartAndCheckout(id){ addToCart(id,+el('detail-qty').textContent); showCheckout(); }

// ===== Cart =====
function addToCart(id,qty=1){ 
  cart[id]=(cart[id]||0)+qty; 
  if (cart[id] < 1) {
    delete cart[id];
  }
  updateCartUI();
}
function removeFromCart(id){ delete cart[id]; updateCartUI(); }
function cartItems(){ return Object.entries(cart).map(([id,q])=>({...PRODUCTS.find(p=>p.id===id),qty:q})); }
function cartTotal(){ return cartItems().reduce((s,i)=>s+i.price*i.qty,0); }

function updateCartUI(){
  el('cart-count').textContent = Object.values(cart).reduce((a,b)=>a+b,0);
  const wrap = el('cart-items'); wrap.innerHTML='';
  const items = cartItems();
  el('cart-total').textContent = cartTotal().toFixed(2);
  if(!items.length){ wrap.innerHTML="<p>Your cart is empty.</p>"; return; }
  items.forEach(it=>{
    const div=document.createElement('div'); div.className='cart-item';
    div.innerHTML=`
      <img src="${it.images[0]}" alt="">
      <div style="flex:1">
        <strong>${it.title}</strong><br>₹${it.price}
      </div>
      <div>
        <button class="small" onclick="addToCart('${it.id}',-1)">-</button>
        <span>${it.qty}</span>
        <button class="small" onclick="addToCart('${it.id}',1)">+</button>
        <button class="small" onclick="removeFromCart('${it.id}')">x</button>
      </div>`;
    wrap.appendChild(div);
  });
}

// ===== Checkout Page Functions =====
function showCheckout() {
    el('products').classList.add('hidden');
    el('cart').classList.add('hidden');
    el('product-detail').classList.add('hidden');
    el('checkout-form').classList.remove('hidden');
    
    renderOrderSummary();
    renderAddresses();
}

function renderOrderSummary() {
    const orderSummaryContainer = el('order-summary');
    orderSummaryContainer.innerHTML = '';
    const items = cartItems();
    if (items.length === 0) {
        orderSummaryContainer.innerHTML = '<p>Your cart is empty.</p>';
        return;
    }
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'order-summary-item';
        div.innerHTML = `
            <span>${item.title} (x${item.qty})</span>
            <span>₹${(item.price * item.qty).toFixed(2)}</span>
        `;
        orderSummaryContainer.appendChild(div);
    });

    const total = cartTotal();
    const totalDiv = document.createElement('div');
    totalDiv.className = 'order-summary-total';
    totalDiv.innerHTML = `<strong>Total:</strong> <span>₹${total.toFixed(2)}</span>`;
    orderSummaryContainer.appendChild(totalDiv);
}

function renderAddresses() {
    const addressesContainer = el('addresses-container');
    addressesContainer.innerHTML = '';

    if (addresses.length === 0) {
        addressesContainer.innerHTML = '<p>No saved addresses.</p>';
        el('add-address-btn').classList.remove('hidden');
        el('new-address-form').classList.add('hidden');
        return;
    }

    addresses.forEach((addr, index) => {
        const div = document.createElement('div');
        div.className = 'address-card';
        if (index === selectedAddressIndex) {
            div.classList.add('selected');
        }
        div.innerHTML = `
            <strong>${addr.name}</strong><br>
            ${addr.street}, ${addr.city} - ${addr.pincode}<br>
            Phone: ${addr.phone}<br>
            <button class="remove-address" onclick="removeAddress(${index})">Remove</button>
            <input type="radio" name="address-selection" value="${index}" ${index === selectedAddressIndex ? 'checked' : ''} onclick="selectAddress(${index})">
        `;
        addressesContainer.appendChild(div);
    });
}

function selectAddress(index) {
    selectedAddressIndex = index;
    renderAddresses();
}

function removeAddress(index) {
    addresses.splice(index, 1);
    if (selectedAddressIndex === index) {
        selectedAddressIndex = null;
    } else if (selectedAddressIndex > index) {
        selectedAddressIndex--;
    }
    renderAddresses();
}

el('add-address-btn').onclick = () => {
    el('new-address-form').classList.remove('hidden');
};

el('cancel-address-btn').onclick = (e) => {
    e.preventDefault();
    el('new-address-form').classList.add('hidden');
};

el('new-address-form').onsubmit = (e) => {
    e.preventDefault();
    const newAddress = {
        name: el('address-name').value,
        phone: el('address-phone').value,
        pincode: el('address-pincode').value,
        city: el('address-city').value,
        street: el('address-street').value,
        landmark: el('address-landmark').value
    };

    if (newAddress.phone.length !== 10) {
        alert("Please enter a valid 10-digit mobile number.");
        return;
    }
    if (newAddress.pincode.length !== 6) {
        alert("Please enter a valid 6-digit pincode.");
        return;
    }
    
    addresses.push(newAddress);
    selectedAddressIndex = addresses.length - 1;
    renderAddresses();
    el('new-address-form').reset();
    el('new-address-form').classList.add('hidden');
};

el('place-order-btn').onclick = (e) => {
    e.preventDefault();
    if (Object.keys(cart).length === 0) {
        alert("Your cart is empty. Please add items before placing an order.");
        return;
    }
    
    const form = el('new-address-form');
    if (!form.classList.contains('hidden')) {
        const phone = el('address-phone').value;
        const pincode = el('address-pincode').value;
        if (phone.length !== 10) {
            alert("Please enter a valid 10-digit mobile number.");
            return;
        }
        if (pincode.length !== 6) {
            alert("Please enter a valid 6-digit pincode.");
            return;
        }
    } else if (addresses.length === 0) {
        alert("Please add a shipping address.");
        return;
    }

    const orderDetails = Object.values(cart).map(item => `${item.title} (${item.qty}x)`).join(', ');
    const orderTotal = cartTotal();
    const selectedAddress = addresses[selectedAddressIndex];
    const orderNotes = el('order-notes').value;

    const emailParams = {
        user_name: selectedAddress.name,
        user_email: "not-available@example.com", // Since email is not a form field
        user_phone: selectedAddress.phone,
        user_address: `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.pincode}`,
        order_details: orderDetails,
        order_total: `₹${orderTotal.toFixed(2)}`,
        order_notes: orderNotes
    };

    if (typeof emailjs!=='undefined' && emailjs.send) {
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailParams)
            .then((response) => {
                console.log('SUCCESS!', response.status, response.text);
                localStorage.removeItem('cart');
                cart = {};
                updateCartUI();
                el('order-success').classList.remove('hidden');
                setTimeout(() => {
                    el('order-success').classList.add('hidden');
                    el('products').classList.remove('hidden');
                    el('checkout-form').classList.add('hidden');
                }, 5000);
            }, (error) => {
                console.log('FAILED...', error);
                alert('Order failed. Please try again.');
            });
    } else {
        alert("Order placed successfully! (Email service not available)");
        localStorage.removeItem('cart');
        cart = {};
        updateCartUI();
    }
};

// ===== Reviews =====
function renderReviews(){
  const c=el('reviews-container'); c.innerHTML='';
  REVIEWS.forEach(r=>{
    const div=document.createElement('div'); div.className='review-card';
    const stars = '★'.repeat(r.rating) + '☆'.repeat(5-r.rating);
    div.innerHTML=`<div class="review-header"><strong>${r.name}</strong><span class="stars">${stars}</span></div><p>"${r.text}"</p>`;
    c.appendChild(div);
  });
}

// Event listener for review submission
el('add-review-form').onsubmit = (e) => {
    e.preventDefault();
    const name = el('review-name').value;
    const text = el('review-text').value;
    const rating = document.querySelector('input[name="rating"]:checked').value;

    const newReview = {
        name: name,
        text: text,
        rating: Number(rating)
    };

    REVIEWS.push(newReview);
    renderReviews();
    el('add-review-form').reset();
    el('add-review-form').classList.add('hidden');
    el('toggle-review-form-btn').textContent = '+ Add a Review';
};

el('toggle-review-form-btn').onclick = () => {
    const form = el('add-review-form');
    form.classList.toggle('hidden');
    el('toggle-review-form-btn').textContent = form.classList.contains('hidden') ? '+ Add a Review' : 'Hide Form';
};

el('cancel-review-btn').onclick = (e) => {
    e.preventDefault();
    el('add-review-form').classList.add('hidden');
    el('toggle-review-form-btn').textContent = '+ Add a Review';
};

// ===== Navigation & Init =====
document.addEventListener('DOMContentLoaded', () => {
    if (typeof emailjs!=='undefined' && emailjs.init) {
        try { emailjs.init(EMAILJS_PUBLIC_KEY); } catch(e){ console.warn('EmailJS init error',e); }
    }
    renderProducts(); updateCartUI();
    renderReviews();

    el('view-products').onclick = () => {
        el('products').classList.remove('hidden');
        el('cart').classList.add('hidden');
        el('product-detail').classList.add('hidden');
        el('checkout-form').classList.add('hidden');
    };

    el('view-cart').onclick = () => {
        el('products').classList.add('hidden');
        el('cart').classList.remove('hidden');
        el('product-detail').classList.add('hidden');
        el('checkout-form').classList.add('hidden');
    };
    
    el('checkout-btn').onclick = () => {
        showCheckout();
    };
    
    el('cancel-checkout').onclick = () => {
        el('products').classList.add('hidden');
        el('cart').classList.remove('hidden');
        el('product-detail').classList.add('hidden');
        el('checkout-form').classList.add('hidden');
    };
    
    el('back-to-products').onclick = () => {
        el('product-detail').classList.add('hidden');
        el('products').classList.remove('hidden');
    };

    el('back-to-products-from-cart').onclick = () => {
        el('products').classList.remove('hidden');
        el('cart').classList.add('hidden');
        el('product-detail').classList.add('hidden');
        el('checkout-form').classList.add('hidden');
    };
    
    el('login-btn').onclick = handleLogin;
});
