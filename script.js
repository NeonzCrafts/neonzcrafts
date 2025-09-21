// ================= Part 1 =================
// CONFIG & 3rd-party keys (replace with your own if you have them)
const EMAILJS_SERVICE_ID = "service_al4zpdb";
const EMAILJS_TEMPLATE_ID = "template_vimeo5m";
const EMAILJS_PUBLIC_KEY = "CRkybtSL0tLoJJ71X";

// Firebase placeholder (not active unless you add config)
const firebaseConfig = null;
let firebaseEnabled = false;
if (typeof firebase !== 'undefined' && firebaseConfig) {
  try {
    firebase.initializeApp(firebaseConfig);
    firebaseEnabled = true;
  } catch (e) { console.warn("Firebase init error:", e); }
}

// Simple helper to get element safely
const el = id => document.getElementById(id);

// Safe event attach (only if element exists)
const on = (id, evt, handler) => {
  const node = el(id);
  if (node) node.addEventListener(evt, handler);
};

// ---------- DATA ----------
const PRODUCTS = [
  { id: 'p1', title: 'Educational Geometric Shape Toy', originalPrice: 399, price: 199, images: ["./1000069559.jpg","./1000069560.jpg"], description: 'Learn colors & shapes - great for toddlers.' },
  { id: 'p2', title: 'Handmade Ceramic Mug', originalPrice: null, price: 249, images: ["./mug.jpg"], description: 'Beautiful glazed mug for daily use.' },
  { id: 'p3', title: 'Wooden Photo Frame', originalPrice: 499, price: 349, images: ["./frame.jpg"], description: 'Rustic wooden frame for your memories.' }
];

// initial reviews (keeps UI non-empty)
let REVIEWS = [
  { name: 'Priya S.', text: 'Amazing quality!', rating: 5 },
  { name: 'Amit V.', text: 'Fast delivery, great service.', rating: 5 }
];

// cart stored as id -> qty mapping for reliability
let cart = {}; // { p1: 2, p3: 1 }
let addresses = []; // saved addresses list
let selectedAddressIndex = null;
let userLocation = null;
let loggedInUser = null;

// ---------- Storage helpers ----------
function loadCartFromStorage() {
  try {
    const raw = localStorage.getItem('cart');
    if (raw) cart = JSON.parse(raw);
  } catch (e) { cart = {}; }
}
function saveCartToStorage() {
  try { localStorage.setItem('cart', JSON.stringify(cart)); } catch (e) {}
}

// ---------- PRODUCTS RENDERING ----------
function renderProducts() {
  const grid = el('products-grid');
  if (!grid) return;
  grid.innerHTML = '';

  PRODUCTS.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${p.images && p.images[0] ? p.images[0] : ''}" alt="${p.title}">
      <h3>${p.title}</h3>
      <div class="price">
        ${p.originalPrice ? `<span class="original-price">₹${p.originalPrice}</span>` : ''}
        ₹${p.price} ${p.originalPrice ? `<span class="sale-tag">Sale</span>` : ''}
      </div>
      <button class="buy-btn small" data-id="${p.id}">BUY NOW</button>
      <button class="add-btn small" data-id="${p.id}">Add to Cart</button>
    `;
    grid.appendChild(card);

    // attach listeners for this card
    const buyBtn = card.querySelector('.buy-btn');
    const addBtn = card.querySelector('.add-btn');
    if (buyBtn) buyBtn.addEventListener('click', () => { showProductDetail(p.id); });
    if (addBtn) addBtn.addEventListener('click', () => { addToCart(p.id, 1); });
  });
}

// ---------- PRODUCT DETAIL ----------
function showProductDetail(id) {
  const product = PRODUCTS.find(x => x.id === id);
  if (!product) return;
  // toggle panels
  hideAllPanels();
  const detailPanel = el('product-detail');
  if (!detailPanel) return;
  detailPanel.classList.remove('hidden');

  const content = el('product-detail-content');
  content.innerHTML = `
    <div class="product-details-container">
      <div class="product-image-section">
        <img id="main-product-image" src="${product.images && product.images[0] ? product.images[0] : ''}" alt="${product.title}">
      </div>
      <div class="product-info-section">
        <h2>${product.title}</h2>
        <div class="price">
          ${product.originalPrice ? `<span class="original-price">₹${product.originalPrice}</span>` : ''}
          ₹${product.price}
          ${product.originalPrice ? `<span class="sale-tag">Sale</span>` : ''}
        </div>
        <p>${product.description || ''}</p>
        <div class="quantity-selector-pill">
          <button id="detail-decrease" class="small">-</button>
          <span id="detail-qty">1</span>
          <button id="detail-increase" class="small">+</button>
        </div>
        <div style="display:flex; gap:8px;">
          <button id="detail-buy" class="checkout-btn">BUY NOW</button>
          <button id="detail-add" class="add-btn">Add to Cart</button>
        </div>
      </div>
    </div>
  `;

  // qty controls
  const qtyEl = el('detail-qty');
  if (el('detail-decrease')) el('detail-decrease').addEventListener('click', () => {
    let v = Number(qtyEl.textContent) || 1; v = Math.max(1, v - 1); qtyEl.textContent = v;
  });
  if (el('detail-increase')) el('detail-increase').addEventListener('click', () => {
    let v = Number(qtyEl.textContent) || 1; v = v + 1; qtyEl.textContent = v;
  });

  if (el('detail-add')) el('detail-add').addEventListener('click', () => {
    const qty = Number(qtyEl.textContent) || 1;
    addToCart(product.id, qty);
    updateCartUI();
    alert('Added to cart');
  });

  if (el('detail-buy')) el('detail-buy').addEventListener('click', () => {
    const qty = Number(qtyEl.textContent) || 1;
    addToCart(product.id, qty);
    showCheckout();
  });

  // render reviews for this product (shared reviews in this simple version)
  renderReviews();
}

// ---------- NAVIGATION HELPERS ----------
function hideAllPanels() {
  document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
  // about is handled separately by showPanel
}
function showPanel(panelId) {
  document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
  const panel = el(panelId);
  if (panel) panel.classList.remove('hidden');

  // About only shows when on products (homepage)
  if (panelId === 'products') {
    if (el('about')) el('about').classList.remove('hidden');
  } else {
    if (el('about')) el('about').classList.add('hidden');
  }
}

// attach main nav listeners (safe attach)
on('view-products', 'click', () => showPanel('products'));
on('view-cart', 'click', () => showPanel('cart'));
// ================= Part 2 =================
// ---------- CART DATA & UTILS ----------
function cartItemsArray() {
  // returns array of items { ...productProps, qty }
  return Object.entries(cart).map(([id, qty]) => {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return null;
    return { ...p, qty };
  }).filter(Boolean);
}
function cartTotal() {
  return cartItemsArray().reduce((s, it) => s + (it.price || 0) * it.qty, 0);
}

// Initialize cart from storage
loadCartFromStorage();

// ---------- CART OPERATIONS ----------
function addToCart(id, qty = 1) {
  if (!id) return;
  const current = Number(cart[id] || 0);
  cart[id] = Math.max(0, current + Number(qty));
  if (cart[id] === 0) delete cart[id];
  saveCartToStorage();
  updateCartUI();
}

function removeFromCart(id) {
  delete cart[id];
  saveCartToStorage();
  updateCartUI();
}

function changeCartQty(id, delta) {
  if (!cart[id]) return;
  cart[id] = Math.max(0, cart[id] + delta);
  if (cart[id] === 0) delete cart[id];
  saveCartToStorage();
  updateCartUI();
}

// ---------- CART UI ----------
function updateCartUI() {
  // count
  const count = Object.values(cart).reduce((a, b) => a + Number(b || 0), 0);
  if (el('cart-count')) el('cart-count').textContent = count;

  // items
  const wrap = el('cart-items');
  if (!wrap) return;
  wrap.innerHTML = '';
  const items = cartItemsArray();
  if (items.length === 0) {
    wrap.innerHTML = '<p>Your cart is empty.</p>';
  } else {
    items.forEach(it => {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <img src="${it.images && it.images[0] ? it.images[0] : ''}" alt="${it.title}">
        <div style="flex:1">
          <strong>${it.title}</strong><br>₹${it.price}
        </div>
        <div>
          <button class="small" data-action="dec" data-id="${it.id}">-</button>
          <span>${it.qty}</span>
          <button class="small" data-action="inc" data-id="${it.id}">+</button>
          <button class="small" data-action="remove" data-id="${it.id}">x</button>
        </div>
      `;
      wrap.appendChild(div);
    });

    // attach item buttons (delegation could be used; here we attach)
    wrap.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        if (action === 'dec') changeCartQty(id, -1);
        if (action === 'inc') changeCartQty(id, 1);
        if (action === 'remove') removeFromCart(id);
      });
    });
  }

  // total
  if (el('cart-total')) el('cart-total').textContent = cartTotal().toFixed(2);
}

// render once on load
updateCartUI();

// ---------- CHECKOUT ----------
function showCheckout() {
  hideAllPanels();
  if (el('checkout-form')) el('checkout-form').classList.remove('hidden');
  renderOrderSummary();
  renderAddresses();
}

on('checkout-btn', 'click', () => {
  if (Object.keys(cart).length === 0) {
    alert('Your cart is empty. Add items first.');
    return;
  }
  showCheckout();
});
on('back-to-products-from-cart', 'click', () => showPanel('products'));

// ORDER SUMMARY
function renderOrderSummary() {
  const out = el('order-summary');
  if (!out) return;
  out.innerHTML = '';
  const items = cartItemsArray();
  if (items.length === 0) {
    out.innerHTML = '<p>Your cart is empty.</p>';
    return;
  }
  items.forEach(it => {
    const div = document.createElement('div');
    div.className = 'order-summary-item';
    div.innerHTML = `<span>${it.title} (x${it.qty})</span><span>₹${(it.price * it.qty).toFixed(2)}</span>`;
    out.appendChild(div);
  });
  const totalDiv = document.createElement('div');
  totalDiv.className = 'order-summary-total';
  totalDiv.innerHTML = `<strong>Total:</strong> <span>₹${cartTotal().toFixed(2)}</span>`;
  out.appendChild(totalDiv);
}

// ---------- ADDRESS MANAGEMENT ----------
on('add-address-btn', 'click', () => {
  const form = el('new-address-form');
  if (form) form.classList.remove('hidden');
});
on('cancel-address-btn', 'click', (e) => {
  e.preventDefault();
  const form = el('new-address-form');
  if (form) form.classList.add('hidden');
});

if (el('new-address-form')) {
  el('new-address-form').addEventListener('submit', e => {
    e.preventDefault();
    const newAddress = {
      name: (el('address-name') && el('address-name').value.trim()) || '',
      phone: (el('address-phone') && el('address-phone').value.trim()) || '',
      pincode: (el('address-pincode') && el('address-pincode').value.trim()) || '',
      city: (el('address-city') && el('address-city').value.trim()) || '',
      street: (el('address-street') && el('address-street').value.trim()) || '',
      landmark: (el('address-landmark') && el('address-landmark').value.trim()) || ''
    };
    if (!/^\d{10}$/.test(newAddress.phone)) { alert('Enter valid 10-digit phone'); return; }
    if (!/^\d{6}$/.test(newAddress.pincode)) { alert('Enter valid 6-digit pincode'); return; }
    addresses.push(newAddress);
    selectedAddressIndex = addresses.length - 1;
    // hide and reset
    el('new-address-form').reset();
    el('new-address-form').classList.add('hidden');
    renderAddresses();
  });
}

function renderAddresses() {
  const container = el('addresses-container');
  if (!container) return;
  container.innerHTML = '';
  if (addresses.length === 0) {
    container.innerHTML = '<p>No saved addresses.</p>';
    return;
  }
  addresses.forEach((a, idx) => {
    const div = document.createElement('div');
    div.className = 'address-card' + (idx === selectedAddressIndex ? ' selected' : '');
    div.innerHTML = `
      <strong>${a.name}</strong><br>
      ${a.street}, ${a.city} - ${a.pincode}<br>
      Phone: ${a.phone}
      <div style="margin-top:8px;">
        <button class="small select-addr" data-idx="${idx}">Select</button>
        <button class="small remove-addr" data-idx="${idx}">Remove</button>
      </div>
    `;
    container.appendChild(div);
  });
  // attach address buttons
  container.querySelectorAll('.select-addr').forEach(btn => btn.addEventListener('click', () => {
    selectedAddressIndex = Number(btn.dataset.idx);
    renderAddresses();
  }));
  container.querySelectorAll('.remove-addr').forEach(btn => btn.addEventListener('click', () => {
    const idx = Number(btn.dataset.idx);
    addresses.splice(idx, 1);
    if (selectedAddressIndex === idx) selectedAddressIndex = null;
    renderAddresses();
  }));
}

// ---------- PLACE ORDER ----------
on('place-order-btn', 'click', () => {
  if (Object.keys(cart).length === 0) { alert('Cart empty'); return; }

  // ensure selected address
  if (!selectedAddressIndex && el('new-address-form') && !el('new-address-form').classList.contains('hidden') ) {
    alert('Please fill address form or select an address.');
    return;
  }
  if (!selectedAddressIndex && addresses.length === 0) {
    alert('Please add a shipping address.');
    return;
  }
  const finalAddress = (!el('new-address-form') || el('new-address-form').classList.contains('hidden')) ? addresses[selectedAddressIndex] : {
    name: el('address-name').value.trim(),
    phone: el('address-phone').value.trim(),
    street: el('address-street').value.trim(),
    city: el('address-city').value.trim(),
    pincode: el('address-pincode').value.trim()
  };
  if (!finalAddress || !finalAddress.name) { alert('Provide valid address'); return; }

  const orderItems = cartItemsArray();
  const orderDetails = orderItems.map(it => `${it.title} (${it.qty}x)`).join(', ');
  const orderTotal = cartTotal();
  const orderNotes = (el('order-notes') && el('order-notes').value.trim()) || '';

  const emailParams = {
    user_name: finalAddress.name,
    user_email: "not-available@example.com",
    user_phone: finalAddress.phone || '',
    user_address: `${finalAddress.street || ''}, ${finalAddress.city || ''} - ${finalAddress.pincode || ''}`,
    order_details: orderDetails,
    order_total: `₹${orderTotal.toFixed(2)}`,
    order_notes: orderNotes
  };

  // Try EmailJS if available, otherwise fallback to success message
  if (typeof emailjs !== 'undefined' && emailjs.send) {
    try { emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailParams)
      .then(() => {
        // clear cart & update
        cart = {}; saveCartToStorage(); updateCartUI();
        el('order-success').classList.remove('hidden');
        setTimeout(() => { el('order-success').classList.add('hidden'); showPanel('products'); }, 3000);
      }, (err) => {
        console.warn('EmailJS failed:', err);
        alert('Order placed locally, but email failed. Check settings.');
        cart = {}; saveCartToStorage(); updateCartUI();
        el('order-success').classList.remove('hidden');
        setTimeout(() => { el('order-success').classList.add('hidden'); showPanel('products'); }, 3000);
      });
    } catch (err) {
      console.warn('EmailJS send error', err);
      alert('Order placed, but email service error.');
      cart = {}; saveCartToStorage(); updateCartUI();
      el('order-success').classList.remove('hidden');
      setTimeout(() => { el('order-success').classList.add('hidden'); showPanel('products'); }, 3000);
    }
  } else {
    // fallback
    alert('Order placed successfully! (Email service not configured)');
    cart = {}; saveCartToStorage(); updateCartUI();
    if (el('order-success')) el('order-success').classList.remove('hidden');
    setTimeout(() => { if (el('order-success')) el('order-success').classList.add('hidden'); showPanel('products'); }, 2000);
  }
});
// ================= Part 3 =================
// ---------- LOCATION POPUP ----------
on('change-location-btn', 'click', (e) => {
  if (el('location-popup')) el('location-popup').classList.remove('hidden');
});
on('close-location-popup', 'click', () => {
  if (el('location-popup')) el('location-popup').classList.add('hidden');
});
on('pincode-submit', 'click', (e) => {
  const pin = el('pincode-input') ? el('pincode-input').value.trim() : '';
  if (/^\d{6}$/.test(pin)) {
    userLocation = { pincode: pin, locationText: `Local area (${pin})` };
    if (el('location-text')) el('location-text').textContent = `Delivering to ${pin}`;
    if (el('delivery-info')) el('delivery-info').textContent = `Delivery by ${getDeliveryDate()}`;
    if (el('location-popup')) el('location-popup').classList.add('hidden');
  } else {
    alert('Enter valid 6-digit pincode');
  }
});
on('use-current-location', 'click', () => {
  if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    // We don't call external API here — simulate mapping to a pincode/city
    const mapped = getPincodeFromGeolocation(latitude, longitude);
    updateLocation(mapped.pincode, `Delivery to ${mapped.locationText}`);
  }, err => {
    console.warn('Geolocation error', err);
    alert('Unable to get location');
  });
});

// helper placeholders for location
function getDeliveryDate() {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}
function getPincodeFromGeolocation(lat, lng) {
  // This is a dummy mapping — replace with real reverse-geocoding if you want
  const cities = [{c:'Mumbai',p:'400001'}, {c:'Delhi',p:'110001'}, {c:'Bengaluru',p:'560001'}, {c:'Chennai',p:'600001'}];
  const pick = cities[Math.floor(Math.random() * cities.length)];
  return { pincode: pick.p, locationText: pick.c };
}
function updateLocation(pincode, locationText) {
  userLocation = { pincode, locationText };
  if (el('location-text')) el('location-text').textContent = locationText;
  if (el('delivery-info')) el('delivery-info').textContent = `Delivery by ${getDeliveryDate()} for pincode ${pincode}`;
  if (el('location-popup')) el('location-popup').classList.add('hidden');
}

// ---------- REVIEWS ----------
function renderReviews() {
  const container = el('reviews-container');
  if (!container) return;
  container.innerHTML = '';
  REVIEWS.forEach(r => {
    const div = document.createElement('div');
    div.className = 'review-card';
    const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    div.innerHTML = `<div class="review-header"><strong>${r.name}</strong><span class="stars">${stars}</span></div><p>"${r.text}"</p>`;
    container.appendChild(div);
  });
}
if (el('add-review-form')) {
  el('add-review-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = el('review-name') ? el('review-name').value.trim() : 'Anonymous';
    const text = el('review-text') ? el('review-text').value.trim() : '';
    const rating = document.querySelector('input[name="rating"]:checked') ? document.querySelector('input[name="rating"]:checked').value : 5;
    if (!text) { alert('Write a short review'); return; }
    REVIEWS.push({ name: name || 'Anonymous', text, rating: Number(rating) });
    renderReviews();
    if (el('add-review-form')) el('add-review-form').reset();
    if (el('add-review-form')) el('add-review-form').classList.add('hidden');
    if (el('toggle-review-form-btn')) el('toggle-review-form-btn').textContent = '+ Add a Review';
  });
}
on('toggle-review-form-btn', 'click', () => {
  const form = el('add-review-form');
  if (!form) return;
  form.classList.toggle('hidden');
  el('toggle-review-form-btn').textContent = form.classList.contains('hidden') ? '+ Add a Review' : 'Hide Form';
});
on('cancel-review-btn', 'click', (e) => {
  e.preventDefault();
  if (el('add-review-form')) el('add-review-form').classList.add('hidden');
  if (el('toggle-review-form-btn')) el('toggle-review-form-btn').textContent = '+ Add a Review';
});

// ---------- MISC UI ----------
on('back-to-products', 'click', () => showPanel('products'));

// ---------- INITIALIZATION (DOMContentLoaded) ----------
document.addEventListener('DOMContentLoaded', () => {
  // init EmailJS safely
  if (typeof emailjs !== 'undefined' && emailjs.init) {
    try { emailjs.init(EMAILJS_PUBLIC_KEY); } catch (e) { console.warn('EmailJS init error', e); }
  }

  // Load cart & other state
  loadCartFromStorage();
  renderProducts();
  updateCartUI();
  renderReviews();

  // ensure About visibility on first load: show products + about
  showPanel('products');

  // set login button placeholder
  on('login-btn', 'click', () => {
    loggedInUser = 'TestUser';
    if (el('login-btn')) el('login-btn').classList.add('hidden');
    if (el('user-display')) { el('user-display').classList.remove('hidden'); el('user-display').textContent = `Welcome, ${loggedInUser}!`; }
  });
});