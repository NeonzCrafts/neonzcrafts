/* script.js - NeonzCrafts
   Full app logic: products, cart, modal, checkout, EmailJS
   Paste this as your script.js (overwrite existing).
*/

/* ---------- CONFIG ---------- */
const EMAILJS_SERVICE = "service_al4zpdb";
const EMAILJS_TEMPLATE = "template_vimeo5m";
const EMAILJS_PUBLIC_KEY = "CRkybtSL0tLoJJ71X";

const STORAGE_KEYS = {
  cart: "neon_cart_v3",
  cartLegacy: "neon_cart_v2",
  address: "neon_address_v3"
};

/* ---------- PRODUCTS (demo) ----------
   - Uses same images (you already have) so you don't need to upload more.
*/
const PRODUCTS = [
  {
    id: "p1",
    title: "Educational Geometric Shape Toy",
    price: 299,
    originalPrice: 399,
    images: ["1000069559.jpg","1000069560.jpg","1000069561.jpg"],
    desc: "Colorful geometric shapes set — builds early learning and motor skills."
  },
  {
    id: "p2",
    title: "Stacking Ring Set (Bright)",
    price: 249,
    originalPrice: 349,
    images: ["1000069560.jpg","1000069559.jpg","1000069561.jpg"],
    desc: "Fun stacking rings to improve hand-eye coordination."
  },
  {
    id: "p3",
    title: "Shape Sorter Board",
    price: 199,
    originalPrice: 279,
    images: ["1000069561.jpg","1000069559.jpg","1000069560.jpg"],
    desc: "Simple sorter board — great for toddlers and early shape recognition."
  }
];

/* ---------- HELPERS ---------- */
function $(id){ return document.getElementById(id); }
function q(sel, ctx=document){ return (ctx || document).querySelector(sel); }
function qAll(sel, ctx=document){ return Array.from((ctx || document).querySelectorAll(sel)); }
function safeParse(raw, fallback){ try { return JSON.parse(raw||'null') || fallback; } catch { return fallback; } }
function formatCurrency(n){ return `₹${Number(n||0).toFixed(0)}`; }
function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
function debounce(fn, t=80){ let id; return (...args)=>{ clearTimeout(id); id=setTimeout(()=>fn(...args), t); }; }

/* ---------- STORAGE (cart) with legacy support ---------- */
function loadCart(){
  const raw = localStorage.getItem(STORAGE_KEYS.cart);
  if (raw) return safeParse(raw, []);
  const old = localStorage.getItem(STORAGE_KEYS.cartLegacy);
  if (old) {
    const parsed = safeParse(old, []);
    try { localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(parsed)); } catch(e){}
    return parsed;
  }
  return [];
}
function saveCart(cart){
  try { localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart)); } catch(e){}
  updateCartBadge(cart);
  // notify other parts of same page
  window.dispatchEvent(new CustomEvent('neon:cart:updated', { detail:{ cart } }));
}
function clearCart(){ saveCart([]); }

/* ---------- CART OPERATIONS ---------- */
function updateCartBadge(cart){
  const cnt = (cart||[]).reduce((s,i)=>s + (i.qty||0), 0);
  qAll('#cart-count').forEach(el => {
    el.textContent = cnt;
    // animate
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  });
  // also reflect anywhere else if needed
}
function addToCart(id, qty=1){
  const cart = loadCart();
  const idx = cart.findIndex(i => i.id === id);
  if (idx >= 0) cart[idx].qty = (cart[idx].qty||0) + Number(qty);
  else cart.push({ id, qty: Number(qty) });
  saveCart(cart);
}
function updateQty(id, delta){
  const cart = loadCart();
  const idx = cart.findIndex(i => i.id === id);
  if (idx < 0) return;
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  saveCart(cart);
}
function removeFromCart(id){
  const newCart = loadCart().filter(i => i.id !== id);
  saveCart(newCart);
}

/* ---------- UI: PRODUCTS (index.html) ---------- */
function calcDiscountPercent(p){
  if (!p.originalPrice || !p.price) return null;
  const percent = Math.round((1 - (p.price / p.originalPrice)) * 100);
  return percent > 0 ? percent : null;
}

function renderProductsPage(){
  const panel = $('products-panel');
  if (!panel) return;
  panel.innerHTML = '';
  if (!PRODUCTS || PRODUCTS.length === 0) {
    panel.innerHTML = '<p style="text-align:center;color:var(--muted)">No products available.</p>';
    return;
  }

  PRODUCTS.forEach(p => {
    const disc = calcDiscountPercent(p);
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-media" role="button" tabindex="0" aria-label="${p.title}">
        <img src="${p.images[0]}" alt="${p.title}">
      </div>
      <div class="product-body">
        <div style="display:flex;gap:8px;align-items:center;">
          <div class="product-title">${p.title}</div>
          ${disc ? `<div class="discount-badge">${disc}% OFF</div>` : ''}
        </div>
        <div class="price-row">
          ${p.originalPrice ? `<div class="price-original">${formatCurrency(p.originalPrice)}</div>` : ''}
          <div class="price-current">${formatCurrency(p.price)}</div>
        </div>
        <div style="margin-top:auto" class="product-actions">
          <button class="btn btn-primary btn-add">Add</button>
          <button class="btn btn-secondary btn-view">View</button>
        </div>
      </div>
    `;
    panel.appendChild(card);

    // handlers
    const addBtn = q('.btn-add', card);
    const viewBtn = q('.btn-view', card);
    const media = q('.product-media', card);

    addBtn && addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(p.id, 1);
      // open cart page so user sees the cart after adding
      window.location.href = 'cart.html';
    });

    const openModalHandler = (e) => { e && e.stopPropagation(); openProductModal(p); };
    viewBtn && viewBtn.addEventListener('click', openModalHandler);
    media && media.addEventListener('click', openModalHandler);
    media && media.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') openModalHandler(e); });
  });
}

/* ---------- PRODUCT MODAL (horizontal carousel) ---------- */
function openProductModal(product){
  // build overlay
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-dialog" role="dialog" aria-modal="true" aria-label="${product.title}">
      <div class="modal-header">
        <h2>${product.title}</h2>
        <button class="modal-close" aria-label="Close">×</button>
      </div>

      <div class="carousel-container">
        <div class="carousel-images">
          ${product.images.map(src => `<img src="${src}" alt="${product.title}">`).join('')}
        </div>
        <div class="carousel-dots" aria-hidden="true" style="margin-top:10px;display:flex;gap:6px;justify-content:center;"></div>
      </div>

      <div class="modal-info">
        <div class="modal-price">${formatCurrency(product.price)}</div>
        <p class="muted">${product.desc}</p>

        <div class="qty-stepper" style="margin-top:8px;">
          <button id="modal-qty-minus" aria-label="Decrease quantity">−</button>
          <span id="modal-qty-value" style="min-width:28px;display:inline-block;text-align:center;font-weight:700">1</span>
          <button id="modal-qty-plus" aria-label="Increase quantity">+</button>
        </div>

        <div style="display:flex;gap:10px;justify-content:center;margin-top:12px;">
          <button class="btn btn-primary" id="modal-add">Add to Cart</button>
          <button class="btn btn-secondary" id="modal-buy">Buy Now</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // elements
  const dialog = q('.modal-dialog', overlay);
  const closeBtn = q('.modal-close', overlay);
  const carousel = q('.carousel-images', overlay);
  const dotsWrap = q('.carousel-dots', overlay);
  const imgs = Array.from(carousel.querySelectorAll('img'));

  // ensure horizontal layout and sizing (CSS does most)
  // build dots
  imgs.forEach((img, i) => {
    const d = document.createElement('div');
    d.className = 'carousel-dot';
    d.style.width = '10px';
    d.style.height = '10px';
    d.style.borderRadius = '50%';
    d.style.background = i === 0 ? 'var(--accent)' : 'rgba(0,0,0,0.12)';
    d.style.cursor = 'pointer';
    d.dataset.index = i;
    dotsWrap.appendChild(d);
    d.addEventListener('click', () => {
      // scroll to image i
      const left = img.offsetLeft - (carousel.clientWidth - img.clientWidth) / 2;
      carousel.scrollTo({ left, behavior: 'smooth' });
    });
  });

  // update dots on scroll (debounced)
  const updateDots = debounce(() => {
    const ix = Math.round(carousel.scrollLeft / Math.max(1, carousel.clientWidth));
    Array.from(dotsWrap.children).forEach((el, j) => el.style.background = j === ix ? 'var(--accent)' : 'rgba(0,0,0,0.12)');
  }, 80);
  carousel.addEventListener('scroll', updateDots);

  // close behaviors
  closeBtn && closeBtn.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  const escHandler = (e) => { if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', escHandler); } };
  document.addEventListener('keydown', escHandler);

  // keyboard arrows navigation
  const arrowNav = (e) => {
    if (e.key === 'ArrowRight') {
      carousel.scrollBy({ left: carousel.clientWidth * 0.8, behavior: 'smooth' });
    } else if (e.key === 'ArrowLeft') {
      carousel.scrollBy({ left: -carousel.clientWidth * 0.8, behavior: 'smooth' });
    }
  };
  document.addEventListener('keydown', arrowNav);

  // quantity logic
  let qty = 1;
  const qtyValue = $('#modal-qty-value', overlay) || q('#modal-qty-value', overlay);
  q('#modal-qty-minus', overlay).addEventListener('click', () => { if (qty > 1) { qty--; qtyValue.textContent = qty; } });
  q('#modal-qty-plus', overlay).addEventListener('click', () => { qty++; qtyValue.textContent = qty; });

  // Add / Buy
  q('#modal-add', overlay).addEventListener('click', () => {
    addToCart(product.id, qty);
    overlay.remove();
    document.removeEventListener('keydown', escHandler);
    window.location.href = 'cart.html';
  });
  q('#modal-buy', overlay).addEventListener('click', () => {
    addToCart(product.id, qty);
    overlay.remove();
    document.removeEventListener('keydown', escHandler);
    window.location.href = 'checkout.html';
  });

  // cleanup when overlay removed
  const observer = new MutationObserver(() => {
    if (!document.body.contains(overlay)) {
      document.removeEventListener('keydown', arrowNav);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

/* ---------- CART PAGE rendering ---------- */
function renderCartPage(){
  const panel = $('cart-items');
  if (!panel) return;
  const cart = loadCart();
  panel.innerHTML = '';

  if (!cart.length) {
    panel.innerHTML = '<p style="text-align:center;color:var(--muted);padding:12px">Your cart is empty.</p>';
    // Update totals & disable checkout
    updateCartTotals(0);
    setCheckoutEnabled(false);
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
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h4 style="margin:0">${p.title}</h4>
          <div style="font-weight:700">${formatCurrency(p.price * item.qty)}</div>
        </div>
        <div style="display:flex;gap:12px;align-items:center;margin-top:8px">
          <div class="qty-controls">
            <button class="qty-btn minus" aria-label="Decrease">−</button>
            <span style="display:inline-block;min-width:28px;text-align:center">${item.qty}</span>
            <button class="qty-btn plus" aria-label="Increase">+</button>
          </div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
        <button class="remove-btn btn-sm">Remove</button>
      </div>
    `;

    // wiring
    q('.minus', row).addEventListener('click', () => updateQty(item.id, -1));
    q('.plus', row).addEventListener('click', () => updateQty(item.id, 1));
    q('.remove-btn', row).addEventListener('click', () => removeFromCart(item.id));

    panel.appendChild(row);
  });

  updateCartTotals(subtotal);
  setCheckoutEnabled(true);
}

/* ---------- totals & checkout state ---------- */
function updateCartTotals(subtotal){
  const shipping = 0; // always free
  // support both id sets
  const setIf = (id, value) => { const el = $(id); if (el) el.textContent = value; };
  setIf('subtotal', formatCurrency(subtotal));
  setIf('shipping', shipping === 0 ? 'Free' : formatCurrency(shipping));
  setIf('total', formatCurrency(subtotal + shipping));
  setIf('subtotal-amt', formatCurrency(subtotal));
  setIf('shipping-amt', shipping === 0 ? 'Free' : formatCurrency(shipping));
  setIf('grand-amt', formatCurrency(subtotal + shipping));
}

function setCheckoutEnabled(enabled){
  // anchor on cart page
  const toCheckout = $('to-checkout');
  if (toCheckout) {
    if (!enabled) {
      toCheckout.classList.add('disabled');
      toCheckout.style.pointerEvents = 'none';
      toCheckout.setAttribute('aria-disabled', 'true');
      toCheckout.style.opacity = '0.6';
    } else {
      toCheckout.classList.remove('disabled');
      toCheckout.style.pointerEvents = '';
      toCheckout.removeAttribute('aria-disabled');
      toCheckout.style.opacity = '';
    }
  }
  const place = $('place-order');
  if (place) {
    if (!enabled) { place.disabled = true; place.setAttribute('aria-disabled', 'true'); place.style.opacity = '0.6'; }
    else { place.disabled = false; place.removeAttribute('aria-disabled'); place.style.opacity = ''; }
  }
}

/* ---------- CHECKOUT page rendering & handlers ---------- */
function renderCheckoutPage(){
  // totals
  const cart = loadCart();
  const subtotal = cart.reduce((s, it) => {
    const p = PRODUCTS.find(pr => pr.id === it.id) || { price: 0 };
    return s + p.price * it.qty;
  }, 0);
  updateCartTotals(subtotal);

  // product list section
  const productPanel = $('checkout-products');
  if (productPanel) {
    productPanel.innerHTML = '';
    if (!cart.length) {
      productPanel.innerHTML = '<p style="color:var(--muted);text-align:center">Your cart is empty.</p>';
    } else {
      cart.forEach(item => {
        const p = PRODUCTS.find(pr => pr.id === item.id);
        if (!p) return;
        const row = document.createElement('div');
        row.className = 'checkout-item';
        row.innerHTML = `
          <img src="${p.images[0]}" alt="${p.title}" class="checkout-thumb">
          <div class="checkout-info">
            <div class="checkout-title">${p.title}</div>
            <div class="checkout-meta">Qty: ${item.qty}</div>
          </div>
          <div class="checkout-price">${formatCurrency(p.price * item.qty)}</div>
        `;
        // clicking thumbnail opens modal
        row.querySelector('.checkout-thumb')?.addEventListener('click', () => openProductModal(p));
        productPanel.appendChild(row);
      });
    }
  }

  // address summary vs form
  const saved = safeParse(localStorage.getItem(STORAGE_KEYS.address), null);
  const form = $('address-form');
  const summary = $('address-summary');
  const savedText = $('saved-address-text'); // note: many versions used this id
  // also support alternative id if present
  const savedTextAlt = $('saved-address-text') || $('saved-address-text') || savedText;

  if (saved && saved.name) {
    if (form) form.style.display = 'none';
    if (summary) summary.style.display = 'block';
    const textEl = $('saved-address-text') || $('saved-address-text') || savedText;
    if (textEl) textEl.innerHTML = `<strong>${saved.name}</strong><br>${saved.street}, ${saved.city} - ${saved.pincode}<br>📞 ${saved.phone}`;
  } else {
    if (form) form.style.display = '';
    if (summary) summary.style.display = 'none';
  }

  // enable/disable place order according to cart
  setCheckoutEnabled(cart.length > 0);
}

/* init checkout handlers */
function initCheckoutHandlers(){
  // init emailjs if available
  if (window.emailjs && typeof emailjs.init === 'function') {
    try { emailjs.init(EMAILJS_PUBLIC_KEY); } catch(e){ console.warn('EmailJS init failed', e); }
  }

  const form = $('address-form');
  if (form) {
    // prefill if saved
    const saved = safeParse(localStorage.getItem(STORAGE_KEYS.address), null);
    if (saved) {
      ['name','phone','street','city','pincode'].forEach(f => { if (form.elements[f]) form.elements[f].value = saved[f] || ''; });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const data = {
        name: (form.elements['name']?.value || '').trim(),
        phone: (form.elements['phone']?.value || '').trim(),
        street: (form.elements['street']?.value || '').trim(),
        city: (form.elements['city']?.value || '').trim(),
        pincode: (form.elements['pincode']?.value || '').trim()
      };
      localStorage.setItem(STORAGE_KEYS.address, JSON.stringify(data));
      // update UI instantly
      renderCheckoutPage();
      alert('✅ Address saved');
    });
  }

  $('edit-address')?.addEventListener('click', () => {
    const form = $('address-form'); const summary = $('address-summary');
    if (form) form.style.display = '';
    if (summary) summary.style.display = 'none';
  });

  $('clear-address')?.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEYS.address);
    const form = $('address-form'); const summary = $('address-summary');
    if (form) { form.reset(); form.style.display = ''; }
    if (summary) summary.style.display = 'none';
    alert('Saved address cleared');
  });

  $('place-order')?.addEventListener('click', async (e) => {
    const btn = $('place-order');
    const cart = loadCart();
    if (!cart.length) { alert('Your cart is empty. Please add items before placing an order.'); return; }
    const addr = safeParse(localStorage.getItem(STORAGE_KEYS.address), null);
    if (!addr || !addr.name) { alert('Please save your shipping address before placing order.'); return; }

    // prevent multiple clicks
    if (btn.disabled) return;
    btn.disabled = true;
    const prevText = btn.textContent;
    btn.textContent = 'Placing...';
    btn.style.opacity = '0.7';

    // prepare template params
    const itemsHtml = cart.map(it => {
      const p = PRODUCTS.find(pr => pr.id === it.id) || {};
      return `${p.title || it.id} × ${it.qty} = ${formatCurrency((p.price||0) * it.qty)}`;
    }).join('\n');

    const total = cart.reduce((s,it) => {
      const p = PRODUCTS.find(pr => pr.id === it.id) || { price:0 };
      return s + p.price * it.qty;
    }, 0);

    const templateParams = {
      order_items: itemsHtml,
      order_total: formatCurrency(total),
      customer_name: addr.name,
      customer_phone: addr.phone,
      customer_address: `${addr.street}, ${addr.city} - ${addr.pincode}`
    };

    try {
      if (!window.emailjs || typeof emailjs.send !== 'function') throw new Error('EmailJS not loaded');
      await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, templateParams);

      // success
      clearCart();
      // small delay so UI updates
      setTimeout(() => window.location.href = 'order-success.html', 200);
    } catch (err) {
      console.error('EmailJS error', err);
      alert('Failed to send order confirmation. Please try again.');
      btn.disabled = false;
      btn.textContent = prevText;
      btn.style.opacity = '1';
    }
  });
}

/* ---------- brand/back behavior ----------
   NOTE: your HTML currently uses a back button on non-index pages and plain
   brand div on index. We won't force navigation here to avoid mismatches.
*/

/* ---------- cross-tab & event syncing ---------- */
window.addEventListener('storage', (e) => {
  if (!e.key) return;
  if (e.key === STORAGE_KEYS.cart || e.key === STORAGE_KEYS.cartLegacy) {
    updateCartBadge(loadCart());
    // re-render relevant sections if present
    if ($('cart-items')) renderCartPage();
    if ($('checkout-products')) renderCheckoutPage();
  }
});

window.addEventListener('neon:cart:updated', () => {
  updateCartBadge(loadCart());
  if ($('cart-items')) renderCartPage();
  if ($('checkout-products')) renderCheckoutPage();
});

/* ---------- INIT ---------- */
document.addEventListener('DOMContentLoaded', () => {
  try {
    // make sure emailjs is initialized if SDK already loaded
    if (window.emailjs && typeof emailjs.init === 'function') {
      try { emailjs.init(EMAILJS_PUBLIC_KEY); } catch(e){ console.warn('EmailJS init error', e); }
    }
  } catch(e){}

  // initial badge
  updateCartBadge(loadCart());

  // render pages conditionally
  renderProductsPage();
  renderCartPage();
  renderCheckoutPage();

  // init handlers for checkout & place order
  initCheckoutHandlers();

  // accessibility: allow clicking brand to go home only if it is anchor (no change otherwise)
  // no forced behavior here to match your HTML choices

  // ensure UI responds when cart updated programmatically
  window.addEventListener('neon:cart:updated', () => {
    renderCartPage();
    renderCheckoutPage();
  });

} );
