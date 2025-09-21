// ========== CONFIG ==========
const EMAILJS_SERVICE_ID = "service_al4zpdb";
const EMAILJS_TEMPLATE_ID = "template_vimeo5m";
const EMAILJS_PUBLIC_KEY = "CRkybtSL0tLoJJ71X";

// The products for your store
const PRODUCTS = [
  {
    id: 'p1',
    title: 'Educational Geometric Shape Sorting & Stacking Toys for 1 2 3 Year Old, Montessori Toys for Toddlers, Preschool Educational Color Shape Learning Toy Gift for Kids Girls Boys',
    originalPrice: 399,
    price: 199,
    images: [
        './1000069559.jpg',
        './1000069560.jpg',
        './1000069561.jpg'
    ],
    description: 'A perfect educational toy for toddlers to learn colors, shapes, and improve motor skills. Made from safe, durable materials.'
  }
];

// Sample reviews (These will be static now to avoid bugs)
let REVIEWS = [
  { name: 'Priya S.', text: 'The product quality is amazing! I am so happy with my purchase.', rating: 5 },
  { name: 'Amit V.', text: 'Fast delivery and excellent customer service. Highly recommend!', rating: 5 },
  { name: 'Sneha R.', text: 'A great buy. The product exceeded my expectations.', rating: 4 }
];

const el = id=>document.getElementById(id);
let cart = {};
let addresses=[], selectedAddressIndex=null;

// Load addresses from local storage on startup
function loadAddresses(){
  const savedAddresses = localStorage.getItem('addresses');
  if(savedAddresses){
    addresses = JSON.parse(savedAddresses);
    selectedAddressIndex = parseInt(localStorage.getItem('selectedAddressIndex')); // Ensure it's a number
    if(isNaN(selectedAddressIndex)) selectedAddressIndex = null;
  }
  updateLoginState(); // Call update state here to reflect initial login status
}
// Save addresses to local storage
function saveAddresses(){
  localStorage.setItem('addresses', JSON.stringify(addresses));
  localStorage.setItem('selectedAddressIndex', selectedAddressIndex);
  updateLoginState(); // Call update state every time addresses are saved
}

// New function to manage login/logout UI state
function updateLoginState() {
  if (addresses.length > 0) {
    el('user-display').textContent = `Welcome, ${addresses[0].name}!`;
    el('user-display').classList.remove('hidden');
    el('login-btn').textContent = "Log Out";
  } else {
    el('user-display').textContent = "";
    el('user-display').classList.add('hidden');
    el('login-btn').textContent = "Log In";
  }
}

function formatPrice(v){ return Number(v).toFixed(2); }

// New function to shorten titles for the cart page
function getShortTitle(title, maxLength = 50) {
  return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
}

// ====== Product rendering ======
function renderProducts(){
  const container=el('products');
  const grid=document.createElement('div'); grid.className='products-grid';
  PRODUCTS.forEach(p=>{
    const card=document.createElement('div'); card.className='card';
    card.setAttribute('onclick', `showProductDetail('${p.id}')`); // Make entire card clickable
    
    // Add logic for displaying sale price or regular price
    let priceDisplay = '';
    if (p.originalPrice) {
      priceDisplay = `<span class="original-price">₹${formatPrice(p.originalPrice)}</span> ₹${formatPrice(p.price)} <span class="sale-tag">Sale</span>`;
    } else {
      priceDisplay = `₹${formatPrice(p.price)}`;
    }

    card.innerHTML=`<img src="${p.images[0]}" alt="${p.title}"/><h3>${p.title}</h3><p>${p.description}</p><div class="price">${priceDisplay}</div>`;
    grid.appendChild(card);
  });
  container.innerHTML='<h2>Products</h2>'; container.appendChild(grid);
}

// ====== Product Detail Page ======
function showProductDetail(id){
    const product = PRODUCTS.find(p=>p.id===id);
    if (!product) return;

    el('products').classList.add('hidden');
    el('product-detail').classList.remove('hidden');

    const contentDiv = el('product-detail-content');
    
    // Create the image gallery HTML
    const galleryHtml = product.images.map(imgUrl => `<img src="${imgUrl}" alt="Product thumbnail" onclick="changeMainImage('${imgUrl}')">`).join('');
    
    // Add logic for displaying sale price or regular price on detail page
    let priceDisplay = '';
    if (product.originalPrice) {
      priceDisplay = `<span class="original-price">₹${formatPrice(product.originalPrice)}</span> ₹${formatPrice(product.price)} <span class="sale-tag">Sale</span>`;
    } else {
      priceDisplay = `₹${formatPrice(product.price)}`;
    }

    contentDiv.innerHTML = `
      <div class="product-details-container">
        <div class="product-image-section">
          <img src="${product.images[0]}" alt="${product.title}" id="main-product-image">
          <div class="thumbnail-gallery">${galleryHtml}</div>
        </div>
        <div class="product-info-section">
          <h2>${product.title}</h2>
          <div class="price">${priceDisplay}</div>
          <p>${product.description}</p>
          <div class="quantity-selector-pill">
            <button onclick="changeQtyOnDetail(-1)">-</button>
            <span id="detail-qty">1</span>
            <button onclick="changeQtyOnDetail(1)">+</button>
          </div>
          <button class="checkout-btn" onclick="addToCartAndCheckout('${product.id}')">BUY NOW</button>
          <button class="add-to-cart-btn" onclick="addToCart('${product.id}', Number(el('detail-qty').textContent))">Add to cart</button>
        </div>
      </div>
    `;
    
    // Set the first thumbnail as active
    contentDiv.querySelector('.thumbnail-gallery img').classList.add('active');
    
    // Now that the product details are rendered, render the reviews
    renderReviews();
}

function changeMainImage(imgUrl) {
    el('main-product-image').src = imgUrl;
    el('product-detail-content').querySelectorAll('.thumbnail-gallery img').forEach(img => {
        img.classList.remove('active');
    });
    el('product-detail-content').querySelector(`img[src='${imgUrl}']`).classList.add('active');
}

function changeQtyOnDetail(change){
    const qtySpan = el('detail-qty');
    let currentQty = Number(qtySpan.textContent);
    currentQty += change;
    if (currentQty < 1) currentQty = 1;
    qtySpan.textContent = currentQty;
}

function addToCartAndCheckout(id){
  const qty = Number(el('detail-qty').textContent);
  addToCart(id, qty);
  el('view-cart').click();
}

// ====== Cart logic ======
function addToCart(id,qty=1){ cart[id]=(cart[id]||0)+qty; updateCartUI(); }
function removeFromCart(id){ delete cart[id]; updateCartUI(); }
function changeQty(id,qty){ qty<=0?removeFromCart(id):(cart[id]=qty, updateCartUI()); }
function cartItems(){ return Object.entries(cart).map(([id,qty])=>({...PRODUCTS.find(x=>x.id===id), qty})); }
function cartTotal(){ return cartItems().reduce((s,i)=>s + i.price*i.qty,0); }

function updateCartUI(){
  el('cart-count').textContent=Object.values(cart).reduce((a,b)=>a+b,0);
  const itemsDiv=el('cart-items'); itemsDiv.innerHTML='';
  const items=cartItems();
  el('cart-total').textContent = formatPrice(cartTotal());
  if(items.length===0){ itemsDiv.innerHTML='<p>Your cart is empty.</p>'; }
  else{
    items.forEach(it=>{
      const div=document.createElement('div'); div.className='cart-item';
      div.innerHTML=`
          <img src="${it.images[0]}" alt="${it.title}">
          <div style="flex:1">
              <div><strong>${getShortTitle(it.title)}</strong></div>
              <div class="price">₹${formatPrice(it.price)}</div>
          </div>
          <div class="cart-quantity-pill">
              <button class="small dec" data-id="${it.id}">-</button>
              <span class="qty">${it.qty}</span>
              <button class="small inc" data-id="${it.id}">+</button>
              <button class="remove-from-cart-btn" data-id="${it.id}"><span class="material-symbols-outlined">delete</span></button>
          </div>
      `;
      itemsDiv.appendChild(div);
    });
    itemsDiv.querySelectorAll('.inc').forEach(b=>b.onclick=e=>changeQty(e.currentTarget.dataset.id,cart[e.currentTarget.dataset.id]+1));
    itemsDiv.querySelectorAll('.dec').forEach(b=>b.onclick=e=>changeQty(e.currentTarget.dataset.id,cart[e.currentTarget.dataset.id]-1));
    itemsDiv.querySelectorAll('.remove-from-cart-btn').forEach(b=>b.onclick=e=>removeFromCart(e.currentTarget.dataset.id));
  }
}

// ====== Checkout ======
function showCheckoutForm(){
  if(Object.keys(cart).length===0){ alert("Your cart is empty!"); return; }
  el('products').classList.add('hidden'); el('cart').classList.add('hidden'); el('product-detail').classList.add('hidden'); el('checkout-form').classList.remove('hidden');
  el('new-address-form').classList.add('hidden'); // Hide form on load
  renderAddresses(); renderOrderSummary();
}
function hideCheckoutForm(){ el('checkout-form').classList.add('hidden'); el('products').classList.remove('hidden'); }

// Render addresses
function renderAddresses(){
  const container=el('addresses-container'); container.innerHTML='';
  addresses.forEach((addr,idx)=>{
    const div=document.createElement('div'); div.className='address-card';
    div.innerHTML=`<input type="radio" name="selected-address" ${selectedAddressIndex===idx?'checked':''} data-idx="${idx}"><label><strong>${addr.name}</strong></label><div>${addr.phone}</div><div>${addr.pincode}, ${addr.city}</div><div>${addr.street}</div><div>${addr.landmark}</div><button class="small remove-address" data-idx="${idx}">Remove</button>`; // Corrected data attribute to data-idx
    container.appendChild(div);
  });
  container.querySelectorAll('input[name="selected-address"]').forEach(r=>r.onchange=e=>selectedAddressIndex=parseInt(e.currentTarget.dataset.idx));
  container.querySelectorAll('.remove-address').forEach(b=>b.onclick=e=>{ 
    addresses.splice(parseInt(e.currentTarget.dataset.idx),1); // Corrected this line to use data-idx
    if(selectedAddressIndex!==null && selectedAddressIndex>=addresses.length) selectedAddressIndex=addresses.length-1; 
    renderAddresses(); 
    saveAddresses(); // Added this line to save changes to local storage
  });
}

// Add new address (using the form)
el('add-address-btn').onclick=()=>{ el('new-address-form').classList.remove('hidden'); };
el('cancel-address-btn').onclick=()=>{ el('new-address-form').classList.add('hidden'); };

el('new-address-form').onsubmit=e=>{
  e.preventDefault();
  const name=el('address-name').value;
  const phone=el('address-phone').value;
  const pincode=el('address-pincode').value;
  const city=el('address-city').value;
  const street=el('address-street').value;
  const landmark=el('address-landmark').value;
  
  addresses.push({name,phone,pincode,city,street,landmark});
  selectedAddressIndex=addresses.length-1; 
  renderAddresses(); 
  el('new-address-form').classList.add('hidden');
  e.target.reset(); // Clear the form
  saveAddresses(); // Save to local storage
};

// New toggle login/logout function
function toggleLogin() {
    if (addresses.length > 0) {
        // Log out logic
        localStorage.removeItem('addresses');
        localStorage.removeItem('selectedAddressIndex');
        addresses = [];
        selectedAddressIndex = null;
        alert("You have been logged out.");
    } else {
        // Show address form for "login"
        el('add-address-btn').click();
    }
    updateLoginState();
}

// Link the new function to the login button
el('login-btn').onclick = toggleLogin;

// Render order summary
function renderOrderSummary(){
  const summaryDiv=el('order-summary');
  const items=cartItems().map(i=>`${getShortTitle(i.title)} × ${i.qty} = ₹${formatPrice(i.price*i.qty)}`).join('<br>');
  summaryDiv.innerHTML=`${items}<hr><strong>Total: ₹${formatPrice(cartTotal())}</strong>`;
}

// Show the full-page order success animation
function showOrderSuccessScreen() {
    // Hide all other sections
    document.querySelectorAll('.panel').forEach(panel => panel.classList.add('hidden'));
    document.querySelector('header').classList.add('hidden');
    document.querySelector('footer').classList.add('hidden');
    
    // Show the success overlay
    el('order-success-overlay').classList.remove('hidden');
    
    // Clear the cart and reset after a delay
    setTimeout(() => {
        cart = {};
        updateCartUI();
        el('order-success-overlay').classList.add('hidden');
        document.querySelector('header').classList.remove('hidden');
        document.querySelector('footer').classList.remove('hidden');
        el('products').classList.remove('hidden');
    }, 4000); // Wait for 4 seconds before returning to products page
}

// Place order via EmailJS
el('place-order-btn').onclick=()=>{
  if(selectedAddressIndex===null){ alert("Select an address before placing order!"); return; }
  const addr=addresses[selectedAddressIndex];
  const items=cartItems().map(i=>`${getShortTitle(i.title)} × ${i.qty} = ₹${formatPrice(i.price*i.qty)}`).join('\n');
  const notes = el('order-notes').value || 'No special instructions.';
  const message=`New COD Order:\n\nName: ${addr.name}\nPhone: ${addr.phone}\nAddress:\n${addr.street}, ${addr.landmark}, ${addr.city}, ${addr.pincode}\n\nItems:\n${items}\n\nTotal: ₹${formatPrice(cartTotal())}\n\nSpecial Instructions:\n${notes}`;
  emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    customer_name: addr.name,
    customer_phone: addr.phone,
    customer_address:`${addr.street}, ${addr.landmark}, ${addr.city}, ${addr.pincode}`,
    order_summary: items,
    order_total: formatPrice(cartTotal()),
    full_message: message,
    special_notes: notes
  }, EMAILJS_PUBLIC_KEY)
  .then(()=>{ showOrderSuccessScreen(); })
  .catch(err=>{ console.error(err); alert("Error sending order. Check EmailJS setup."); });
};

// ====== Review Rendering & Submission ======
function renderReviews() {
  const container = el('reviews-container');
  container.innerHTML = '';
  // Load reviews from local storage, or use default if none exist
  const savedReviews = localStorage.getItem('reviews');
  if(savedReviews){
      REVIEWS = JSON.parse(savedReviews);
  }
  REVIEWS.forEach(review => {
    const div = document.createElement('div');
    div.className = 'review-card';
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    div.innerHTML = `
      <div class="review-header">
        <strong>${review.name}</strong>
        <span class="stars">${stars}</span>
      </div>
      <p>"${review.text}"</p>
    `;
    container.appendChild(div);
  });
}

// New logic to toggle the review form
el('toggle-review-form-btn').onclick = () => {
    const form = el('add-review-form');
    const button = el('toggle-review-form-btn');
    if (form.classList.contains('hidden')) {
        form.classList.remove('hidden');
        button.textContent = "Cancel";
    } else {
        form.classList.add('hidden');
        button.textContent = "+ Add a Review";
    }
};

el('cancel-review-btn').onclick = () => {
    el('add-review-form').classList.add('hidden');
    el('toggle-review-form-btn').textContent = "+ Add a Review";
};

el('add-review-form').onsubmit = e => {
    e.preventDefault();
    const name = el('review-name').value;
    const text = el('review-text').value;
    const rating = parseInt(el('add-review-form').querySelector('input[name="rating"]:checked').value);
    
    // Add the new review to the array
    REVIEWS.push({ name, text, rating });
    
    // Save the updated reviews to local storage (THIS IS TEMPORARY, DO NOT RELY ON THIS)
    localStorage.setItem('reviews', JSON.stringify(REVIEWS));
    
    // Re-render the reviews section
    renderReviews();
    
    // Hide the form and reset it
    el('add-review-form').classList.add('hidden');
    el('toggle-review-form-btn').textContent = "+ Add a Review";
    e.target.reset();
};

// Navigation
document.addEventListener('DOMContentLoaded',()=>{
  loadAddresses();
  renderProducts(); 
  updateCartUI(); 
  el('view-products').onclick=()=>{ el('products').classList.remove('hidden'); el('cart').classList.add('hidden'); el('product-detail').classList.add('hidden'); el('checkout-form').classList.add('hidden'); };
  el('view-cart').onclick=()=>{ el('products').classList.add('hidden'); el('cart').classList.remove('hidden'); el('product-detail').classList.add('hidden'); el('checkout-form').classList.add('hidden'); };
  el('back-to-products').onclick=()=>{ el('product-detail').classList.add('hidden'); el('products').classList.remove('hidden'); };
  el('checkout-btn').onclick=showCheckoutForm;
  el('cancel-checkout').onclick=hideCheckoutForm;
});
