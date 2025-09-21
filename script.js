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
function addToCartAndCheckout(id){ addToCart(id,+el('detail-qty').textContent); el('view-cart').click(); }

// ===== Cart =====
function addToCart(id,qty=1){ cart[id]=(cart[id]||0)+qty; updateCartUI(); }
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

// ===== Navigation & Init =====
document.addEventListener('DOMContentLoaded',()=>{
  if (typeof emailjs!=='undefined' && emailjs.init) {
    try { emailjs.init(EMAILJS_PUBLIC_KEY); } catch(e){ console.warn('EmailJS init error',e); }
  }
  renderProducts(); updateCartUI();

  el('view-products').onclick=()=>{ el('products').classList.remove('hidden'); el('cart').classList.add('hidden'); el('product-detail').classList.add('hidden'); el('checkout-form').classList.add('hidden'); };
  el('view-cart').onclick=()=>{ el('products').classList.add('hidden'); el('cart').classList.remove('hidden'); el('product-detail').classList.add('hidden'); el('checkout-form').classList.add('hidden'); };
  el('back-to-products').onclick=()=>{ el('product-detail').classList.add('hidden'); el('products').classList.remove('hidden'); };
});
