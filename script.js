/* ===========================
   Robust script.js (storage-safe, compatible)
   Keeps all DOM IDs that HTML expects.
   Features:
     - product rendering
     - cart operations & persistence
     - checkout & address management (persisted)
     - location popup
     - reviews
   Replace existing script.js with this file.
   =========================== */

/* ---------- CONFIG ---------- */
const EMAILJS_SERVICE_ID = "service_al4zpdb";
const EMAILJS_TEMPLATE_ID = "template_vimeo5m";
const EMAILJS_PUBLIC_KEY = "CRkybtSL0tLoJJ71X";

/* ---------- SAFE DOM HELPERS ---------- */
const el = id => document.getElementById(id);
const on = (id, evt, handler) => {
  const node = el(id);
  if (node) node.addEventListener(evt, handler);
};

/* ---------- SAMPLE DATA ---------- */
const PRODUCTS = [
  { id: 'p1', title: 'Educational Geometric Shape Toy', originalPrice: 399, price: 199, images: ["./1000069559.jpg"], description: 'Learn colors & shapes - great for toddlers.' },
  { id: 'p2', title: 'Handmade Ceramic Mug', originalPrice: null, price: 249, images: ["./mug.jpg"], description: 'Beautiful glazed mug for daily use.' },
  { id: 'p3', title: 'Wooden Photo Frame', originalPrice: 499, price: 349, images: ["./frame.jpg"], description: 'Rustic wooden frame for your memories.' }
];

/* ---------- APP STATE ---------- */
let cart = {}; // id -> qty
let addresses = [];
let selectedAddressIndex = null;
let userLocation = null;

/* ---------- STORAGE KEYS & HELPERS ---------- */
const KEY_CART = 'neon_cart_v1';
const KEY_ADDRESSES = 'neon_addresses_v1';
const KEY_SELECTED_ADDR = 'neon_selected_addr_v1';
const KEY_LOCATION = 'neon_location_v1';

function loadCartFromStorage(){
  try {
    const raw = localStorage.getItem(KEY_CART);
    if (raw) cart = JSON.parse(raw);
  } catch(e){ cart = {}; }
}
function saveCartToStorage(){
  try { localStorage.setItem(KEY_CART, JSON.stringify(cart)); } catch(e) {}
}

function loadAddressesFromStorage(){
  try {
    const raw = localStorage.getItem(KEY_ADDRESSES);
    addresses = raw ? JSON.parse(raw) : [];
    const idx = localStorage.getItem(KEY_SELECTED_ADDR);
    selectedAddressIndex = (idx !== null && idx !== '') ? Number(idx) : null;
    if (selectedAddressIndex !== null && (selectedAddressIndex < 0 || selectedAddressIndex >= addresses.length)) {
      selectedAddressIndex = null;
    }
  } catch(e){ addresses = []; selectedAddressIndex = null; }
}
function saveAddressesToStorage(){
  try {
    localStorage.setItem(KEY_ADDRESSES, JSON.stringify(addresses));
    localStorage.setItem(KEY_SELECTED_ADDR, selectedAddressIndex === null ? '' : String(selectedAddressIndex));
  } catch(e){}
}

function loadLocationFromStorage(){
  try {
    const raw = localStorage.getItem(KEY_LOCATION);
    userLocation = raw ? JSON.parse(raw) : null;
  } catch(e){ userLocation = null; }
}
function saveLocationToStorage(){
  try { localStorage.setItem(KEY_LOCATION, JSON.stringify(userLocation)); } catch(e){}
}

/* ---------- UTIL ---------- */
function cartItemsArray(){
  return Object.entries(cart).map(([id, qty]) => {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return null;
    return { ...p, qty };
  }).filter(Boolean);
}
function cartTotal(){
  return cartItemsArray().reduce((s, it) => s + (it.price || 0) * it.qty, 0);
}

/* ---------- RENDER: PRODUCTS ---------- */
function renderProducts(){
  const grid = el('products-grid');
  if (!grid) return;
  grid.innerHTML = '';
  PRODUCTS.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-img"><img src="${p.images && p.images[0] ? p.images[0] : ''}" alt="${p.title}" onerror="this.style.opacity=0.6; this.src=''; this.alt='Image unavailable'"></div>
      <div class="card-body">
        <h3>${p.title}</h3>
        <div class="price-row">
          ${p.originalPrice ? `<span class="original-price">₹${p.originalPrice}</span>` : ''}
          <span class="price-current">₹${p.price}</span>
          ${p.originalPrice ? `<span style="background:#ffebee;color:#c62828;padding:4px 8px;border-radius:8px;font-weight:700;font-size:0.82rem;margin-left:6px;">Sale</span>` : ''}
        </div>
        <div style="flex:1;"></div>
        <div class="card-actions">
          <button class="btn btn-secondary" data-id="${p.id}" data-action="buy">BUY NOW</button>
          <button class="btn btn-primary" data-id="${p.id}" data-action="add">Add to Cart</button>
        </div>
      </div>
    `;
    grid.appendChild(card);

    const buyBtn = card.querySelector('button[data-action="buy"]');
    const addBtn = card.querySelector('button[data-action="add"]');
    if (buyBtn) buyBtn.addEventListener('click', () => showProductDetail(p.id));
    if (addBtn) addBtn.addEventListener('click', () => { addToCart(p.id, 1); alert('Added to cart'); });
  });
}

/* ---------- PRODUCT DETAIL ---------- */
function showProductDetail(id){
  const product = PRODUCTS.find(x => x.id === id);
  if (!product) return;
  hideAllPanels();
  const detailPanel = el('product-detail');
  if (!detailPanel) return;
  detailPanel.classList.remove('hidden');
  detailPanel.setAttribute('aria-hidden','false');

  const content = el('product-detail-content');
  if (!content) return;
  content.innerHTML = `
    <div class="product-details-container">
      <div class="product-image-section">
        <img id="main-product-image" src="${product.images && product.images[0] ? product.images[0] : ''}" alt="${product.title}" onerror="this.src=''; this.alt='Image unavailable'">
      </div>
      <div class="product-info-section">
        <h2>${product.title}</h2>
        <div class="price-row" style="justify-content:flex-start;">
          ${product.originalPrice ? `<span class="original-price">₹${product.originalPrice}</span>` : ''}
          <span class="price-current" style="margin-left:6px;">₹${product.price}</span>
          ${product.originalPrice ? `<span style="background:#ffebee;color:#c62828;padding:4px 8px;border-radius:8px;font-weight:700;font-size:0.82rem;margin-left:8px;">Sale</span>` : ''}
        </div>
        <p style="color:var(--muted); margin-top:10px;">${product.description || ''}</p>

        <div class="quantity-selector-pill" style="margin-top:12px;">
          <button id="detail-decrease" class="small">-</button>
          <span id="detail-qty" style="min-width:28px; display:inline-block; text-align:center;">1</span>
          <button id="detail-increase" class="small">+</button>
        </div>

        <div style="display:flex; gap:10px; margin-top:16px;">
          <button id="detail-buy" class="btn btn-primary">BUY NOW</button>
          <button id="detail-add" class="btn btn-secondary">Add to Cart</button>
        </div>
      </div>
    </div>
  `;

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

  renderReviews();
}

/* ---------- NAVIGATION ---------- */
function hideAllPanels(){
  document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.panel').forEach(p => p.setAttribute('aria-hidden','true'));
}
function showPanel(panelId){
  document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
  const panel = el(panelId);
  if (panel) {
    panel.classList.remove('hidden');
    panel.setAttribute('aria-hidden','false');
  }
}

/* ---------- CART OPERATIONS & UI ---------- */
function addToCart(id, qty = 1){
  if (!id) return;
  const current = Number(cart[id] || 0);
  cart[id] = Math.max(0, current + Number(qty));
  if (cart[id] === 0) delete cart[id];
  saveCartToStorage();
  updateCartUI();
}

function removeFromCart(id){
  delete cart[id];
  saveCartToStorage();
  updateCartUI();
}
function changeCartQty(id, delta){
  if (!cart[id]) return;
  cart[id] = Math.max(0, cart[id] + delta);
  if (cart[id] === 0) delete cart[id];
  saveCartToStorage();
  updateCartUI();
}

function updateCartUI(){
  const count = Object.values(cart).reduce((a,b) => a + Number(b || 0), 0);
  if (el('cart-count')) el('cart-count').textContent = count;

  const wrap = el('cart-items');
  if (!wrap) return;
  wrap.innerHTML = '';
  const items = cartItemsArray();
  if (items.length === 0){
    wrap.innerHTML = '<p>Your cart is empty.</p>';
  } else {
    items.forEach(it => {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <img src="${it.images && it.images[0] ? it.images[0] : ''}" alt="${it.title}" onerror="this.style.opacity=0.6; this.src=''; this.alt='Image unavailable'">
        <div style="flex:1;">
          <strong>${it.title}</strong><br>
          <div style="color:var(--muted);">₹${it.price} each</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;">
          <div style="display:flex; gap:6px; align-items:center;">
            <button class="small" data-action="dec" data-id="${it.id}">-</button>
            <span>${it.qty}</span>
            <button class="small" data-action="inc" data-id="${it.id}">+</button>
          </div>
          <div>
            <button class="small" data-action="remove" data-id="${it.id}">Remove</button>
          </div>
        </div>
      `;
      wrap.appendChild(div);
    });

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

  if (el('cart-total')) el('cart-total').textContent = cartTotal().toFixed(2);
}

/* ---------- CHECKOUT RENDER ---------- */
function renderOrderSummary(){
  const out = el('order-summary');
  if (!out) return;
  out.innerHTML = '';
  const items = cartItemsArray();
  if (items.length === 0){
    out.innerHTML = '<p>Your cart is empty.</p>';
    return;
  }
  items.forEach(it => {
    const div = document.createElement('div');
    div.className = 'order-summary-item';
    div.style = 'display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px dashed rgba(0,0,0,0.06);';
    div.innerHTML = `<span style="color:var(--muted)">${it.title} (x${it.qty})</span><span>₹${(it.price * it.qty).toFixed(2)}</span>`;
    out.appendChild(div);
  });
  const totalDiv = document.createElement('div');
  totalDiv.className = 'order-summary-total';
  totalDiv.style = 'display:flex; justify-content:space-between; padding:8px 0; font-weight:800; margin-top:8px;';
  totalDiv.innerHTML = `<strong>Total:</strong> <span>₹${cartTotal().toFixed(2)}</span>`;
  out.appendChild(totalDiv);
}

/* ---------- ADDRESS MANAGEMENT ---------- */
function renderAddresses(){
  const container = el('addresses-container');
  if (!container) return;
  container.innerHTML = '';
  if (!addresses || addresses.length === 0){
    container.innerHTML = '<p>No saved addresses.</p>';
    return;
  }
  addresses.forEach((a, idx) => {
    const div = document.createElement('div');
    div.className = 'address-card' + (idx === selectedAddressIndex ? ' selected' : '');
    div.innerHTML = `
      <div><strong>${a.name}</strong></div>
      <div style="margin-top:6px; color:var(--muted);">${(a.street||'')}${a.city ? `, ${a.city}` : ''} ${a.pincode ? `- ${a.pincode}` : ''}</div>
      <div style="margin-top:8px;">Phone: ${a.phone || ''}</div>
      <div style="margin-top:8px; display:flex; gap:8px;">
        <button class="small select-addr" data-idx="${idx}">${idx === selectedAddressIndex ? 'Selected' : 'Select'}</button>
        <button class="small remove-addr" data-idx="${idx}">Remove</button>
      </div>
    `;
    container.appendChild(div);
  });

  container.querySelectorAll('.select-addr').forEach(btn => btn.addEventListener('click', () => {
    selectedAddressIndex = Number(btn.dataset.idx);
    saveAddressesToStorage();
    renderAddresses();
  }));
  container.querySelectorAll('.remove-addr').forEach(btn => btn.addEventListener('click', () => {
    const idx = Number(btn.dataset.idx);
    addresses.splice(idx, 1);
    if (selectedAddressIndex === idx) selectedAddressIndex = null;
    if (selectedAddressIndex !== null && selectedAddressIndex > idx) selectedAddressIndex--;
    saveAddressesToStorage();
    renderAddresses();
  }));
}

/* ---------- PLACE ORDER ---------- */
on('place-order-btn','click', () => {
  if (Object.keys(cart).length === 0){
    alert('Your cart is empty. Add items first.');
    return;
  }

  let finalAddress = null;

  if (selectedAddressIndex !== null && addresses[selectedAddressIndex]) {
    finalAddress = addresses[selectedAddressIndex];
  } else {
    const newForm = el('new-address-form');
    if (newForm && !newForm.classList.contains('hidden')) {
      const name = el('address-name') ? el('address-name').value.trim() : '';
      const phone = el('address-phone') ? el('address-phone').value.trim() : '';
      const pincode = el('address-pincode') ? el('address-pincode').value.trim() : '';
      const city = el('address-city') ? el('address-city').value.trim() : '';
      const street = el('address-street') ? el('address-street').value.trim() : '';
      if (!name) { alert('Please enter name for the shipping address.'); return; }
      if (!/^\d{10}$/.test(phone)) { alert('Enter valid 10-digit phone'); return; }
      if (!/^\d{6}$/.test(pincode)) { alert('Enter valid 6-digit pincode'); return; }
      finalAddress = { name, phone, pincode, city, street };
      addresses.push(finalAddress);
      selectedAddressIndex = addresses.length - 1;
      saveAddressesToStorage();
      renderAddresses();
      newForm.reset();
      newForm.classList.add('hidden');
    } else {
      alert('Please add or select a shipping address.');
      return;
    }
  }

  if (!userLocation) {
    const ok = confirm('No delivery location selected. Proceed anyway?');
    if (!ok) return;
  }

  const orderItems = cartItemsArray();
  const orderDetails = orderItems.map(it => `${it.title} (${it.qty}x)`).join(', ');
  const orderTotal = cartTotal();
  const orderNotes = (el('order-notes') && el('order-notes').value.trim()) || '';

  const emailParams = {
    user_name: finalAddress.name,
    user_email: "not-provided@example.com",
    user_phone: finalAddress.phone || '',
    user_address: `${finalAddress.street || ''}, ${finalAddress.city || ''} - ${finalAddress.pincode || ''}`,
    order_details: orderDetails,
    order_total: `₹${orderTotal.toFixed(2)}`,
    order_notes: orderNotes
  };

  if (typeof emailjs !== 'undefined' && emailjs.send) {
    try {
      if (emailjs.init) emailjs.init(EMAILJS_PUBLIC_KEY);
      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailParams)
      .then(() => {
        cart = {}; saveCartToStorage(); updateCartUI();
        if (el('order-success')) el('order-success').classList.remove('hidden');
        setTimeout(() => {
          if (el('order-success')) el('order-success').classList.add('hidden');
          showPanel('products');
        }, 2000);
      }, (err) => {
        console.warn('EmailJS send failed', err);
        alert('Order placed locally but email notify failed.');
        cart = {}; saveCartToStorage(); updateCartUI();
        if (el('order-success')) el('order-success').classList.remove('hidden');
        setTimeout(()=> { if (el('order-success')) el('order-success').classList.add('hidden'); showPanel('products'); }, 2000);
      });
    } catch(e){
      console.warn('EmailJS error', e);
      alert('Order placed (email failed).');
      cart = {}; saveCartToStorage(); updateCartUI();
      if (el('order-success')) el('order-success').classList.remove('hidden');
      setTimeout(()=> { if (el('order-success')) el('order-success').classList.add('hidden'); showPanel('products'); }, 2000);
    }
  } else {
    alert('Order placed successfully! (Email service not configured)');
    cart = {}; saveCartToStorage(); updateCartUI();
    if (el('order-success')) el('order-success').classList.remove('hidden');
    setTimeout(()=> { if (el('order-success')) el('order-success').classList.add('hidden'); showPanel('products'); }, 1500);
  }
});

/* ---------- LOCATION HANDLING ---------- */
on('change-location-btn','click', () => {
  if (el('location-popup')) el('location-popup').classList.remove('hidden');
});
on('close-location-popup','click', () => {
  if (el('location-popup')) el('location-popup').classList.add('hidden');
});
on('pincode-submit','click', () => {
  const pin = el('pincode-input') ? el('pincode-input').value.trim() : '';
  if (/^\d{6}$/.test(pin)) {
    userLocation = { pincode: pin, locationText: `Delivery to ${pin}` };
    if (el('location-text')) el('location-text').textContent = `Delivery to ${pin}`;
    if (el('delivery-info')) el('delivery-info').textContent = `Delivery by ${getDeliveryDate()} for pincode ${pin}`;
    saveLocationToStorage();
    if (el('location-popup')) el('location-popup').classList.add('hidden');
  } else {
    alert('Enter valid 6-digit pincode');
  }
});
on('use-current-location','click', () => {
  if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    const mapped = getPincodeFromGeolocation(latitude, longitude);
    updateLocation(mapped.pincode, `Delivery to ${mapped.locationText}`);
  }, err => {
    console.warn('Geolocation error', err);
    alert('Unable to get location');
  });
});

function updateLocation(pincode, locationText){
  userLocation = { pincode, locationText };
  if (el('location-text')) el('location-text').textContent = locationText;
  if (el('delivery-info')) el('delivery-info').textContent = `Delivery by ${getDeliveryDate()} for pincode ${pincode}`;
  saveLocationToStorage();
  if (el('location-popup')) el('location-popup').classList.add('hidden');
}
function getDeliveryDate(){
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}
function getPincodeFromGeolocation(lat, lng){
  const cities = [{c:'Mumbai',p:'400001'}, {c:'Delhi',p:'110001'}, {c:'Bengaluru',p:'560001'}, {c:'Chennai',p:'600001'}];
  const pick = cities[Math.floor(Math.random() * cities.length)];
  return { pincode: pick.p, locationText: pick.c };
}

/* ---------- REVIEWS ---------- */
let REVIEWS = [
  { name: 'Priya S.', text: 'Amazing quality!', rating: 5 },
  { name: 'Amit V.', text: 'Fast delivery, great service.', rating: 5 }
];
function renderReviews(){
  const container = el('reviews-container');
  if (!container) return;
  container.innerHTML = '';
  REVIEWS.forEach(r => {
    const div = document.createElement('div');
    div.className = 'review-card';
    const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><strong>${r.name}</strong><span style="color:#f0ad4e">${stars}</span></div><p style="margin:0;color:var(--muted);">"${r.text}"</p>`;
    container.appendChild(div);
  });
}
if (el('add-review-form')) {
  el('add-review-form').addEventLis