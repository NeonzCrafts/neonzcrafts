/* script.js - NeonzCrafts
   Robust product / cart / checkout logic.
   Drop into your repo as-is. Assumes images are in same folder (or adjust paths).
*/

/* -------- CONFIG -------- */
const CONFIG = {
  EMAILJS_ENABLED: true, // set false to disable email sending
  EMAILJS_SERVICE: 'service_al4zpdb',
  EMAILJS_TEMPLATE: 'template_vimeo5m',
  EMAILJS_PUBLIC_KEY: 'CRkybtSL0tLoJJ71X'
};

/* -------- STORAGE KEYS & PRODUCTS -------- */
const STORAGE_KEYS = {
  cart: 'neon_cart_v2',
  address: 'neon_address_v1'
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

/* -------- UTILITIES -------- */
function $(id){ return document.getElementById(id); }
function q(sel, ctx=document){ return ctx.querySelector(sel); }
function qAll(sel, ctx=document){ return Array.from(ctx.querySelectorAll(sel)); }
function safeParse(raw, fallback){ try{ return JSON.parse(raw||'null')||fallback } catch { return fallback; } }
function formatCurrency(n){ return `₹${Number(n||0).toFixed(0)}`; }

/* -------- CART STORAGE -------- */
function loadCart(){
  return safeParse(localStorage.getItem(STORAGE_KEYS.cart), []);
}
function saveCart(c){
  localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(c));
  updateCartBadge(c);
  // notify other listeners on same page
  window.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart: c } }));
}
function updateCartBadge(cart){
  const cnt = (cart||[]).reduce((s,i)=>s + (i.qty||0), 0);
  qAll('#cart-count').forEach(el => el.textContent = cnt);
}

/* -------- CART OPERATIONS -------- */
function addToCart(id, qty=1){
  const cart = loadCart();
  const idx = cart.findIndex(i=>i.id===id);
  if (idx >= 0) cart[idx].qty += qty;
  else cart.push({ id, qty: qty });
  saveCart(cart);
}

function removeFromCart(id){
  let cart = loadCart();
  cart = cart.filter(i => i.id !== id);
  saveCart(cart);
}

function clearCart(){
  saveCart([]);
}

/* -------- RENDER PRODUCTS (index.html) -------- */
function renderProductsPage(){
  const panel = $('products-panel');
  if (!panel) return;
  panel.innerHTML = '';

  PRODUCTS.forEach(p => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <button class="product-media" aria-label="${p.title}">
        <img src="${p.images[0]}" alt="${p.title}">
      </button>
      <div class="product-body">
        <h3 class="product-title">${p.title}</h3>
        <div class="price-row">
          ${p.originalPrice ? `<div class="price-original">${formatCurrency(p.originalPrice)}</div>` : ''}
          <div class="price-current">${formatCurrency(p.price)}</div>
        </div>
        <p class="muted product-desc">${p.desc}</p>
        <div class="product-actions">
          <button class="btn btn-outline btn-sm btn-view">View</button>
          <input class="mini-qty" type="number" min="1" value="1" aria-label="Quantity">
          <button class="btn btn-primary btn-add">Add to Cart</button>
        </div>
      </div>
    `;
    panel.appendChild(card);

    // actions
    q('.btn-add', card).addEventListener('click', (e) => {
      const qty = Number(q('.mini-qty', card).value) || 1;
      addToCart(p.id, qty);
      // open cart page for user to review
      window.location.href = 'cart.html';
    });

    q('.btn-view', card).addEventListener('click', () => openProductModal(p));
    q('.product-media', card).addEventListener('click', () => openProductModal(p));
  });
}

/* -------- PRODUCT MODAL -------- */
function openProductModal(product){
  // create modal container
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-dialog" role="dialog" aria-modal="true" aria-label="${product.title}">
      <header class="modal-header">
        <h2>${product.title}</h2>
        <button class="modal-close" aria-label="Close">×</button>
      </header>
      <div class="modal-body">
        <div class="modal-carousel">
          ${product.images.map(src => `<img src="${src}" alt="${product.title}">`).join('')}
        </div>
        <p class="muted">${product.desc}</p>
        <div class="modal-price-row">
          ${product.originalPrice ? `<div class="price-original">${formatCurrency(product.originalPrice)}</div>` : ''}
          <div class="price-current">${formatCurrency(product.price)}</div>
        </div>
        <div class="modal-actions">
          <input class="mini-qty" type="number" min="1" value="1" aria-label="Quantity">
          <button class="btn btn-primary btn-add">Add to Cart</button>
          <button class="btn btn-secondary btn-buy">Buy Now</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // close handler
  q('.modal-close', modal).addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (ev) => { if (ev.target === modal) modal.remove(); });

  // carousel simple: show first image only with ability to click to cycle
  const imgs = qAll('.modal-carousel img', modal);
  let idx = 0;
  function show(i){
    imgs.forEach((im, j)=>im.style.display = j===i ? 'block' : 'none');
  }
  show(0);
  q('.modal-carousel', modal).addEventListener('click', () => { idx = (idx+1) % imgs.length; show(idx); });

  // add to cart
  q('.btn-add', modal).addEventListener('click', () => {
    const qty = Number(q('.mini-qty', modal).value) || 1;
    addToCart(product.id, qty);
    // close modal and open cart
    modal.remove();
    window.location.href = 'cart.html';
  });

  // buy now -> add then go to checkout
  q('.btn-buy', modal).addEventListener('click', () => {
    const qty = Number(q('.mini-qty', modal).value) || 1;
    addToCart(product.id, qty);
    modal.remove();
    window.location.href = 'checkout.html';
  });
}

/* -------- RENDER CART (cart.html) -------- */
function renderCartPage(){
  const panel = $('cart-items');
  if (!panel) return;
  const cart = loadCart();
  panel.innerHTML = '';

  if (!cart.length){
    panel.innerHTML = '<p class="muted center">Your cart is empty.</p>';
    updateCartTotals(0);
    ensureCheckoutBlocked(true);
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
      <img class="cart-thumb" src="${p.images[0]}" alt="${p.title}">
      <div class="cart-meta">
        <h4>${p.title}</h4>
        <div class="cart-price">${formatCurrency(p.price)} × ${item.qty} = <strong>${formatCurrency(p.price * item.qty)}</strong></div>
      </div>
      <div class="cart-actions">
        <button class="btn btn-sm btn-remove">Remove</button>
      </div>
    `;
    panel.appendChild(row);

    q('.btn-remove', row).addEventListener('click', () => {
      removeFromCart(item.id);
      // re-render after removal
      renderCartPage();
    });
  });

  updateCartTotals(subtotal);
  ensureCheckoutBlocked(false);
}

/* -------- UPDATE TOTALS (works across pages) -------- */
function updateCartTotals(subtotal){
  const shippingText = 'Free';
  const total = subtotal;
  const setIf = (id, text) => { const el = $(id); if (el) el.textContent = text; };
  setIf('subtotal', formatCurrency(subtotal));
  setIf('subtotal-amt', formatCurrency(subtotal));
  setIf('shipping', shippingText);
  setIf('shipping-amt', shippingText);
  setIf('total', formatCurrency(total));
  setIf('grand-amt', formatCurrency(total));
}

/* -------- PREVENT CHECKOUT WHEN CART EMPTY -------- */
function ensureCheckoutBlocked(block){
  const checkoutBtn = $('to-checkout') || $('place-order') || q('.btn-checkout');
  if (!checkoutBtn) return;
  if (block) {
    checkoutBtn.classList.add('disabled');
    checkoutBtn.setAttribute('aria-disabled', 'true');
    checkoutBtn.addEventListener('click', preventCheckoutHandler);
  } else {
    checkoutBtn.classList.remove('disabled');
    checkoutBtn.removeAttribute('aria-disabled');
    checkoutBtn.removeEventListener('click', preventCheckoutHandler);
  }
}
function preventCheckoutHandler(e){ e.preventDefault(); alert('Please add items to cart before proceeding to checkout.'); }

/* -------- CHECKOUT PAGE RENDER & ADDRESS MANAGEMENT -------- */
function renderCheckoutPage(){
  // totals
  const cart = loadCart();
  let subtotal = 0;
  cart.forEach(item => {
    const p = PRODUCTS.find(pr => pr.id === item.id);
    if (p) subtotal += p.price * item.qty;
  });
  updateCartTotals(subtotal);

  // address form logic
  const form = $('address-form');
  const savedBox = $('saved-address');
  const saved = safeParse(localStorage.getItem(STORAGE_KEYS.address), null);

  function fillForm(addr){
    if (!form) return;
    form.elements['name'].value = addr?.name || '';
    form.elements['phone'].value = addr?.phone || '';
    form.elements['street'].value = addr?.street || '';
    form.elements['city'].value = addr?.city || '';
    form.elements['pincode'].value = addr?.pincode || '';
  }

  if (saved && savedBox){
    // show compact saved address
    savedBox.innerHTML = `
      <div class="saved-card">
        <div><strong>${saved.name}</strong></div>
        <div>${saved.street}, ${saved.city} • ${saved.pincode}</div>
        <div class="saved-actions">
          <button class="btn btn-outline btn-edit">Edit</button>
          <button class="btn btn-secondary btn-use">Use</button>
        </div>
      </div>
    `;
    q('.btn-edit', savedBox).addEventListener('click', () => {
      // expand form for editing
      if (form) { form.style.display = 'block'; fillForm(saved); window.scrollTo({top: form.offsetTop - 60, behavior: 'smooth'}); }
    });
    q('.btn-use', savedBox).addEventListener('click', () => {
      alert('Saved address selected for this order.');
    });
    if (form) form.style.display = 'none';
  } else {
    if (form) form.style.display = 'block';
    if (savedBox) savedBox.innerHTML = '';
  }

  if (form){
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const addr = {
        name: form.elements['name'].value.trim(),
        phone: form.elements['phone'].value.trim(),
        street: form.elements['street'].value.trim(),
        city: form.elements['city'].value.trim(),
        pincode: form.elements['pincode'].value.trim()
      };
      localStorage.setItem(STORAGE_KEYS.address, JSON.stringify(addr));
      alert('Address saved');
      renderCheckoutPage(); // re-render to show compact address
    });
  }

  // place order button
  const placeBtn = $('place-order');
  if (placeBtn) {
    placeBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const currCart = loadCart();
      if (!currCart.length) { alert('Your cart is empty'); return; }
      const savedAddr = safeParse(localStorage.getItem(STORAGE_KEYS.address), null);
      if (!savedAddr) { alert('Please save an address first'); return; }

      // If EmailJS enabled, send order
      if (CONFIG.EMAILJS_ENABLED && window.emailjs){
        try {
          // prepare template params
          const items = currCart.map(it => {
            const p = PRODUCTS.find(pr => pr.id === it.id);
            return `${p.title} × ${it.qty} = ${formatCurrency(p.price * it.qty)}`;
          }).join('\n');
          const total = currCart.reduce((s,it)=>s + (PRODUCTS.find(pr=>pr.id===it.id).price * it.qty), 0);

          const params = {
            to_name: savedAddr.name,
            to_phone: savedAddr.phone,
            to_address: `${savedAddr.street}, ${savedAddr.city} - ${savedAddr.pincode}`,
            order_items: items,
            order_total: formatCurrency(total)
          };
          await emailjs.send(CONFIG.EMAILJS_SERVICE, CONFIG.EMAILJS_TEMPLATE, params, CONFIG.EMAILJS_PUBLIC_KEY);
        } catch (err) {
          console.error('EmailJS error', err);
        }
      }

      // clear cart and go to success page
      clearCart();
      window.location.href = 'order-success.html';
    });
  }

  // Prevent checkout button if cart empty
  ensureCheckoutBlocked(!cart.length);
}

/* -------- INIT ---------- */
document.addEventListener('DOMContentLoaded', () => {
  try {
    updateCartBadge(loadCart());

    // initialize emailjs if present and enabled
    if (CONFIG.EMAILJS_ENABLED && window.emailjs && !window.emailjs.__inited){
      try { emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY); window.emailjs.__inited = true; } catch {}
    }

    // decide which render functions to call by detecting elements
    if ($('products-panel')) renderProductsPage();
    if ($('cart-items')) renderCartPage();
    if ($('address-form') || $('place-order')) renderCheckoutPage();

    // expose some functions for debugging in console
    window.NEON = { addToCart, removeFromCart, loadCart, saveCart, clearCart, PRODUCTS };

    // listen cart updates to re-render if on same page
    window.addEventListener('cart:updated', () => {
      if ($('cart-items')) renderCartPage();
      if ($('subtotal') || $('total')) renderCheckoutPage();
    });

  } catch (err){
    console.error('Init error', err);
  }
});
