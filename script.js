/* Shared script for index.html, cart.html, checkout.html, order-success.html
   Features:
   - product rendering (index.html)
   - cart management (add, qty, remove) persisted to localStorage
   - cart count badge sync across pages
   - cart display (cart.html)
   - checkout rendering + address save (checkout.html)
   - place order -> clears cart and navigates to order-success.html
*/

/* ---------- CONFIG / SAMPLE DATA ---------- */
const STORAGE_KEYS = {
  cart: 'neon_cart_v2',
  addresses: 'neon_addresses_v2'
};

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

/* ---------- UTIL ---------- */
function $(id){ return document.getElementById(id); }
function safeParse(raw, fallback){ try{ return JSON.parse(raw || 'null') || fallback }catch(e){ return fallback } }

/* Cart stored as array of {id, qty} */
function loadCart(){
  return safeParse(localStorage.getItem(STORAGE_KEYS.cart), []);
}
function saveCart(cart){
  localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
  updateCartBadge(cart);
}
function updateCartBadge(cart){
  const count = cart.reduce((s,i)=> s + (i.qty||0), 0);
  document.querySelectorAll('#cart-count').forEach(el => el.textContent = count);
}

/* Get product by id */
function findProduct(id){ return PRODUCTS.find(p => p.id === id) }

/* Add product (or increase qty) */
function addToCart(id, qty = 1){
  const cart = loadCart();
  const idx = cart.findIndex(i => i.id === id);
  if (idx >= 0) cart[idx].qty = Math.max(1, cart[idx].qty + Number(qty));
  else cart.push({ id, qty: Number(qty) });
  saveCart(cart);
}

/* Set qty */
function setCartQty(id, qty){
  const cart = loadCart();
  const idx = cart.findIndex(i => i.id === id);
  if (idx >= 0){
    if (qty <= 0) cart.splice(idx,1); else cart[idx].qty = qty;
    saveCart(cart);
  }
}

/* Remove item */
function removeFromCart(id){
  const cart = loadCart().filter(i => i.id !== id);
  saveCart(cart);
}

/* Calculate totals */
function cartItemsDetailed(){
  const cart = loadCart();
  return cart.map(it => {
    const p = findProduct(it.id);
    return { ...p, qty: it.qty, lineTotal: (p.price || 0) * it.qty };
  });
}
function cartSubtotal(){
  return cartItemsDetailed().reduce((s,it)=> s + (it.lineTotal||0), 0);
}
function shippingFor(subtotal){ return subtotal > 1000 ? 0 : 50; } // simple rule

/* ---------- INDEX PAGE: RENDER PRODUCTS ---------- */
function renderProductsPage(){
  const panel = $('products-panel');
  if (!panel) return;
  panel.innerHTML = '';
  PRODUCTS.forEach(p => {
    const img = p.image && p.image.trim() ? p.image : ''; // allow blank
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-media">
        <img src="${img}" alt="${p.title}" onerror="this.onerror=null;this.src='https://via.placeholder.com/600x400?text=No+Image'">
      </div>
      <div class="product-body">
        <h3 class="product-title">${p.title}</h3>
        <div class="price-row">
          ${p.originalPrice ? `<div class="price-original">₹${p.originalPrice}</div>` : ''}
          <div class="price-current">₹${p.price}</div>
        </div>
        <p class="muted" style="text-align:center;margin-top:6px">${p.desc || ''}</p>
        <div style="margin-top:8px;display:flex;gap:8px;align-items:center;">
          <input type="number" min="1" value="1" aria-label="Quantity" class="mini-qty" style="width:72px;padding:8px;border-radius:8px;border:1px solid #eee">
          <button class="btn btn-primary add-js">Add to Cart</button>
        </div>
      </div>
    `;
    panel.appendChild(card);

    const qtyInput = card.querySelector('.mini-qty');
    const addBtn = card.querySelector('.add-js');
    addBtn.addEventListener('click', () => {
      const q = Math.max(1, Number(qtyInput.value) || 1);
      addToCart(p.id, q);
      showToast('Added to cart');
    });
  });
}

/* ---------- CART PAGE: RENDER CART ---------- */
function renderCartPage(){
  const itemsDiv = $('cart-items');
  if (!itemsDiv) return;
  const cartItems = cartItemsDetailed();
  itemsDiv.innerHTML = '';
  if (!cartItems.length){
    itemsDiv.innerHTML = `<div class="muted center">Your cart is empty. <br/><a href="index.html" class="btn btn-primary" style="margin-top:10px;display:inline-block">Shop Now</a></div>`;
    $('cart-totals') && $('cart-totals').classList.add('hidden');
    $('cart-empty') && $('cart-empty').classList.remove('hidden');
    return;
  }
  $('cart-totals') && $('cart-totals').classList.remove('hidden');
  $('cart-empty') && $('cart-empty').classList.add('hidden');

  cartItems.forEach(item => {
    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = `
      <img src="${item.image || ''}" alt="${item.title}" onerror="this.onerror=null;this.src='https://via.placeholder.com/150?text=No+Image'">
      <div style="flex:1">
        <div style="font-weight:700">${item.title}</div>
        <div class="muted">₹${item.price} each</div>
        <div style="margin-top:8px;display:flex;align-items:center;gap:8px">
          <div class="qty-controls">
            <button class="btn-qty dec">-</button>
            <span class="qty-display">${item.qty}</span>
            <button class="btn-qty inc">+</button>
          </div>
          <button class="btn btn-secondary remove-item">Remove</button>
        </div>
      </div>
      <div style="text-align:right;min-width:92px">
        <div class="muted">Line</div>
        <div style="font-weight:800">₹${(item.lineTotal||0).toFixed(2)}</div>
      </div>
    `;
    itemsDiv.appendChild(row);

    // wire up controls
    const dec = row.querySelector('.dec');
    const inc = row.querySelector('.inc');
    const remove = row.querySelector('.remove-item');
    dec.addEventListener('click', () => {
      setCartQty(item.id, item.qty - 1);
      renderCartPage(); renderCartTotals();
    });
    inc.addEventListener('click', () => {
      setCartQty(item.id, item.qty + 1);
      renderCartPage(); renderCartTotals();
    });
    remove.addEventListener('click', () => {
      removeFromCart(item.id);
      renderCartPage(); renderCartTotals();
      showToast('Removed from cart');
    });
  });

  renderCartTotals();
}

function renderCartTotals(){
  const sub = cartSubtotal();
  const ship = shippingFor(sub);
  const grand = sub + ship;
  if ($('subtotal-amt')) $('subtotal-amt').textContent = `₹${sub.toFixed(2)}`;
  if ($('shipping-amt')) $('shipping-amt').textContent = `₹${ship.toFixed(2)}`;
  if ($('grand-amt')) $('grand-amt').textContent = `₹${grand.toFixed(2)}`;

  if ($('co-subtotal')) $('co-subtotal').textContent = `₹${sub.toFixed(2)}`;
  if ($('co-shipping')) $('co-shipping').textContent = `₹${ship.toFixed(2)}`;
  if ($('co-grand')) $('co-grand').textContent = `₹${grand.toFixed(2)}`;
}

/* ---------- CHECKOUT PAGE: RENDER & ADDRESS ---------- */
function renderCheckoutPage(){
  const itemsDiv = $('checkout-items');
  if (!itemsDiv) return;
  const items = cartItemsDetailed();
  if (!items.length){
    itemsDiv.innerHTML = `<div class="muted">Your cart is empty. <a href="index.html">Continue shopping</a></div>`;
    return;
  }
  itemsDiv.innerHTML = items.map(it => `
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #eee">
      <div style="flex:1">${it.title} <div class="muted" style="font-size:0.9rem">x ${it.qty} • ₹${it.price} each</div></div>
      <div style="min-width:90px;text-align:right;font-weight:800">₹${it.lineTotal.toFixed(2)}</div>
    </div>
  `).join('');
  renderCartTotals();
}

/* Addresses saved in localStorage */
function loadAddresses(){ return safeParse(localStorage.getItem(STORAGE_KEYS.addresses), []) }
function saveAddresses(list){ localStorage.setItem(STORAGE_KEYS.addresses, JSON.stringify(list)) }

function renderSavedAddresses(){
  const wrapper = $('saved-addresses');
  if (!wrapper) return;
  const list = loadAddresses();
  if (!list.length){ wrapper.innerHTML = '<div class="muted">No saved addresses.</div>'; return; }
  wrapper.innerHTML = list.map((a, i) => `
    <div style="border:1px solid #eee;padding:10px;border-radius:8px;margin-top:8px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-weight:700">${a.name} • ${a.phone}</div>
        <div class="muted">${[a.street,a.city,a.pincode].filter(Boolean).join(', ')}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <button class="btn btn-secondary select-addr" data-idx="${i}">Use</button>
        <button class="btn btn-secondary remove-addr" data-idx="${i}">Delete</button>
      </div>
    </div>
  `).join('');

  wrapper.querySelectorAll('.select-addr').forEach(b => b.addEventListener('click', (ev) => {
    const idx = Number(ev.target.dataset.idx);
    const list = loadAddresses();
    const chosen = list[idx];
    if (chosen) {
      // prefill form
      if ($('address-name')) $('address-name').value = chosen.name || '';
      if ($('address-phone')) $('address-phone').value = chosen.phone || '';
      if ($('address-street')) $('address-street').value = chosen.street || '';
      if ($('address-city')) $('address-city').value = chosen.city || '';
      if ($('address-pincode')) $('address-pincode').value = chosen.pincode || '';
      showToast('Address loaded into form');
    }
  }));
  wrapper.querySelectorAll('.remove-addr').forEach(b => b.addEventListener('click', (ev) => {
    const idx = Number(ev.target.dataset.idx);
    const list = loadAddresses();
    list.splice(idx,1);
    saveAddresses(list);
    renderSavedAddresses();
    showToast('Address deleted');
  }));
}

/* ---------- ORDER PLACEMENT ---------- */
function placeOrder(){
  const cart = loadCart();
  if (!cart.length){ alert('Your cart is empty'); window.location.href = 'cart.html'; return; }

  // basic address validation
  const name = $('address-name') ? $('address-name').value.trim() : '';
  const phone = $('address-phone') ? $('address-phone').value.trim() : '';
  const pincode = $('address-pincode') ? $('address-pincode').value.trim() : '';

  if (!name || !/^\d{10}$/.test(phone) || !/^\d{6}$/.test(pincode)){
    alert('Please provide a valid name, 10-digit phone and 6-digit pincode before placing the order.');
    return;
  }

  // optionally save address to storage
  const addresses = loadAddresses();
  addresses.unshift({ name, phone, street: $('address-street') ? $('address-street').value.trim() : '', city: $('address-city') ? $('address-city').value.trim() : '', pincode });
  // keep only recent 5
  while (addresses.length > 5) addresses.pop();
  saveAddresses(addresses);

  // create order summary (locally)
  const items = cartItemsDetailed();
  const subtotal = cartSubtotal();
  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;

  // clear cart
  saveCart([]);

  // Save a minimal order record to sessionStorage (optional)
  const order = {
    id: 'ORD' + Date.now(),
    items: items.map(i => ({ id:i.id, title:i.title, qty:i.qty, price:i.price })),
    subtotal, shipping, total, createdAt: new Date().toISOString()
  };
  try { sessionStorage.setItem('last_order', JSON.stringify(order)); } catch(e){}

  // redirect to success
  window.location.href = 'order-success.html';
}

/* ---------- SMALL UI HELPERS ---------- */
let toastTimer = null;
function showToast(text){
  let toast = document.querySelector('.nc-toast');
  if (!toast){
    toast = document.createElement('div');
    toast.className = 'nc-toast';
    toast.style = 'position:fixed;left:50%;transform:translateX(-50%);bottom:24px;background:rgba(0,0,0,0.82);color:#fff;padding:10px 14px;border-radius:8px;z-index:9999;font-weight:700';
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.style.opacity = '1';
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{ toast.style.opacity='0'; }, 1600);
}

/* ---------- PAGE BOOTSTRAP ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // init cart badge from storage
  updateCartBadge(loadCart());

  // run page-specific renderers
  if ($('products-panel')) renderProductsPage();
  if ($('cart-items')) renderCartPage();
  if ($('checkout-items')) {
    renderCheckoutPage();
    renderSavedAddresses();

    // address form
    const addrForm = $('address-form');
    if (addrForm){
      addrForm.addEventListener('submit', (ev) => {
        ev.preventDefault();
        // validate minimal
        const name = $('address-name').value.trim();
        const phone = $('address-phone').value.trim();
        const pincode = $('address-pincode').value.trim();
        if (!name || !/^\d{10}$/.test(phone) || !/^\d{6}$/.test(pincode)){
          alert('Please fill a valid name, 10-digit phone and 6-digit pincode.');
          return;
        }
        // save address
        const store = loadAddresses();
        store.unshift({ name, phone, street: $('address-street').value.trim(), city: $('address-city').value.trim(), pincode });
        while (store.length > 5) store.pop();
        saveAddresses(store);
        renderSavedAddresses();
        showToast('Address saved');
      });
    }

    const addrClear = $('address-clear');
    if (addrClear) addrClear.addEventListener('click', () => {
      ['address-name','address-phone','address-street','address-city','address-pincode'].forEach(id => { if($(id)) $(id).value=''; });
      showToast('Form cleared');
    });

    const placeBtn = $('place-order');
    if (placeBtn) placeBtn.addEventListener('click', placeOrder);
  }

  // If on order-success page, optionally show last order info (not required)
  if (document.querySelector('.success-card')) {
    // nothing heavy needed; cart is already cleared
  }
}();

const STORAGE_KEYS = { cart: 'neon_cart_v2', addresses: 'neon_addresses_v2' };

function $(id){ return document.getElementById(id); }
function safeParse(raw,fallback){ try{ return JSON.parse(raw||'null')||fallback }catch{ return fallback } }
function loadCart(){ return safeParse(localStorage.getItem(STORAGE_KEYS.cart),[]); }
function saveCart(c){ localStorage.setItem(STORAGE_KEYS.cart,JSON.stringify(c)); updateCartBadge(c); }
function updateCartBadge(c){ const cnt=c.reduce((s,i)=>s+i.qty,0); document.querySelectorAll('#cart-count').forEach(el=>el.textContent=cnt); }
function addToCart(id,qty=1){ let c=loadCart(); const i=c.findIndex(x=>x.id===id); i>=0?c[i].qty+=qty:c.push({id,qty}); saveCart(c); }

function renderProductsPage(){
  const panel=$('products-panel'); if(!panel)return;
  panel.innerHTML='';
  const p=PRODUCTS[0];
  const card=document.createElement('article'); card.className='product-card';
  card.innerHTML=`
    <div class="carousel-container">
      <div class="carousel-images">
        ${p.images.map(src=>`<img src="${src}" alt="${p.title}">`).join('')}
      </div>
      <div class="carousel-dots">
        ${p.images.map((_,i)=>`<div class="carousel-dot ${i===0?'active':''}" data-index="${i}"></div>`).join('')}
      </div>
    </div>
    <div class="product-body">
      <h3 class="product-title">${p.title}</h3>
      <div class="price-row">
        ${p.originalPrice?`<div class="price-original">₹${p.originalPrice}</div>`:''}
        <div class="price-current">₹${p.price}</div>
      </div>
      <p class="muted" style="text-align:center">${p.desc}</p>
      <div style="margin-top:8px;display:flex;gap:8px;align-items:center;">
        <input type="number" min="1" value="1" class="mini-qty" style="width:72px;padding:8px;border-radius:8px;border:1px solid #eee">
        <button class="btn btn-primary add-js">Add to Cart</button>
      </div>
    </div>`;
  panel.appendChild(card);

  const imgContainer=card.querySelector('.carousel-images');
  const dots=card.querySelectorAll('.carousel-dot');
  let idx=0;
  function showSlide(i){
    idx=i;
    imgContainer.style.transform=`translateX(-${idx*100}%)`;
    dots.forEach((d,di)=>d.classList.toggle('active',di===idx));
  }
  dots.forEach(d=>d.addEventListener('click',()=>showSlide(Number(d.dataset.index))));

  const qty=card.querySelector('.mini-qty'),btn=card.querySelector('.add-js');
  btn.addEventListener('click',()=>{ addToCart(p.id,Number(qty.value)||1); alert('Added to cart'); });
}

document.addEventListener('DOMContentLoaded',()=>{
  updateCartBadge(loadCart());
  if($('products-panel')) renderProductsPage();
});