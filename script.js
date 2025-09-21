const STORAGE_KEYS = { cart: 'neon_cart_v2', addresses: 'neon_addresses_v2' };

const PRODUCTS = [
  { 
    id: 'p1', 
    title: 'Educational Geometric Shape Toy', 
    price: 299, 
    originalPrice: 399, 
    images: ['1000069559.jpg','1000069560.jpg','1000069561.jpg'], 
    desc: 'Interactive and colorful shape toy to improve cognitive skills for toddlers.'
  }
];

function $(id){ return document.getElementById(id); }
function safeParse(raw,fallback){ try{ return JSON.parse(raw||'null')||fallback }catch{ return fallback } }

function loadCart(){ return safeParse(localStorage.getItem(STORAGE_KEYS.cart),[]); }
function saveCart(c){ localStorage.setItem(STORAGE_KEYS.cart,JSON.stringify(c)); updateCartBadge(c); }
function updateCartBadge(c){ const cnt=c.reduce((s,i)=>s+i.qty,0); document.querySelectorAll('#cart-count').forEach(el=>el.textContent=cnt); }
function addToCart(id,qty=1){ let c=loadCart(); const i=c.findIndex(x=>x.id===id); i>=0?c[i].qty+=qty:c.push({id,qty}); saveCart(c); }

// ---------- PRODUCT RENDER ----------
function renderProductsPage(){
  const panel = $('products-panel');
  if (!panel) return;
  panel.innerHTML = '';
  const p = PRODUCTS[0];

  const card = document.createElement('article');
  card.className = 'product-card';
  card.innerHTML = `
    <div class="carousel-container">
      <div class="carousel-images">
        ${p.images.map(src => `<img src="${src}" alt="${p.title}">`).join('')}
      </div>
      <div class="carousel-dots">
        ${p.images.map((_, i) => `<div class="carousel-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`).join('')}
      </div>
    </div>
    <div class="product-body">
      <h3 class="product-title">${p.title}</h3>
      <div class="price-row">
        ${p.originalPrice ? `<div class="price-original">₹${p.originalPrice}</div>` : ''}
        <div class="price-current">₹${p.price}</div>
      </div>
      <p class="muted" style="text-align:center">${p.desc}</p>
      <div style="margin-top:8px;display:flex;gap:8px;align-items:center;">
        <input type="number" min="1" value="1" class="mini-qty" style="width:72px;padding:8px;border-radius:8px;border:1px solid #eee">
        <button class="btn btn-primary add-js">Add to Cart</button>
      </div>
    </div>`;
  panel.appendChild(card);

  // Carousel Logic
  const imgContainer = card.querySelector('.carousel-images');
  const dots = card.querySelectorAll('.carousel-dot');
  let idx = 0;
  function showSlide(i) {
    idx = i;
    imgContainer.style.transform = `translateX(-${idx * 100}%)`;
    dots.forEach((d, di) => d.classList.toggle('active', di === idx));
  }
  dots.forEach(d => d.addEventListener('click', () => showSlide(Number(d.dataset.index))));

  const qty = card.querySelector('.mini-qty');
  const btn = card.querySelector('.add-js');
  btn.addEventListener('click', () => {
    addToCart(p.id, Number(qty.value) || 1);
    alert('Added to cart');
  });
}

// ---------- CART PAGE RENDER ----------
function renderCartPage(){
  const panel = $('cart-items');
  if (!panel) return;
  const cart = loadCart();
  panel.innerHTML = '';
  
  if (cart.length === 0) {
    panel.innerHTML = '<p style="text-align:center;margin:1rem 0;color:#aaa">Your cart is empty.</p>';
    updateCartTotals(0);
    return;
  }
  
  let subtotal = 0;
  cart.forEach(item => {
    const p = PRODUCTS.find(pr => pr.id === item.id);
    if (!p) return;
    subtotal += p.price * item.qty;

    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <img src="${p.images[0]}" alt="${p.title}" class="cart-thumb">
      <div class="cart-details">
        <h4>${p.title}</h4>
        <div class="cart-price">₹${p.price} × ${item.qty} = <strong>₹${p.price * item.qty}</strong></div>
        <button class="btn-sm remove-btn">Remove</button>
      </div>
    `;
    row.querySelector('.remove-btn').addEventListener('click', () => removeFromCart(item.id));
    panel.appendChild(row);
  });

  updateCartTotals(subtotal);
}

function updateCartTotals(subtotal){
  const shipping = subtotal > 0 ? 50 : 0;
  if ($('subtotal')) $('subtotal').textContent = `₹${subtotal}`;
  if ($('shipping')) $('shipping').textContent = shipping > 0 ? `₹${shipping}` : 'Free';
  if ($('total')) $('total').textContent = `₹${subtotal + shipping}`;
}

function removeFromCart(id){
  let cart = loadCart();
  cart = cart.filter(c => c.id !== id);
  saveCart(cart);
  renderCartPage();
}

// ---------- INITIALIZATION ----------
document.addEventListener('DOMContentLoaded', () => {
  // Always update cart badge first
  updateCartBadge(loadCart());

  // Render products if we are on index.html
  renderProductsPage();

  // Render cart if we are on cart.html
  renderCartPage();

  // Attach place order validation if we are on checkout.html
  const placeOrderBtn = document.getElementById('place-order');
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const form = document.getElementById('address-form');
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const addressData = {
        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
        street: form.street.value.trim(),
        city: form.city.value.trim(),
        pincode: form.pincode.value.trim(),
      };
      localStorage.setItem('neon_address', JSON.stringify(addressData));

      window.location.href = 'order-success.html';
    });
  }
});
