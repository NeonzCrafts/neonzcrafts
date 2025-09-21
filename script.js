/* script.js - NeonzCrafts
   Replace your current script.js with this file.
*/

/* ---------- STORAGE KEYS ---------- */
const STORAGE_KEYS = {
  cart: 'neon_cart_v3',
  cartLegacy: 'neon_cart_v2',
  address: 'neon_address_v3'
};

/* ---------- PRODUCTS (single sample) ---------- */
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

/* ---------- EmailJS config (use provided values) ---------- */
const EMAILJS_SERVICE = 'service_al4zpdb';
const EMAILJS_TEMPLATE = 'template_vimeo5m';
const EMAILJS_PUBLIC_KEY = 'CRkybtSL0tLoJJ71X';

/* ---------- Helpers ---------- */
function $(id){ return document.getElementById(id); }
function q(sel, ctx=document){ return ctx.querySelector(sel); }
function qAll(sel, ctx=document){ return Array.from((ctx||document).querySelectorAll(sel)); }
function safeParse(raw, fallback){ try { return JSON.parse(raw||'null') || fallback } catch { return fallback; } }
function formatCurrency(n){ return `₹${Number(n||0).toFixed(0)}`; }

/* ---------- Cart storage + migration ---------- */
function loadCart(){
  const v3 = localStorage.getItem(STORAGE_KEYS.cart);
  if (v3) return safeParse(v3, []);
  const legacy = localStorage.getItem(STORAGE_KEYS.cartLegacy);
  if (legacy) {
    const parsed = safeParse(legacy, []);
    try { localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(parsed)); } catch(e){}
    return parsed;
  }
  return [];
}
function saveCart(cart){
  try { localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart)); } catch(e){}
  updateCartBadge(cart);
  window.dispatchEvent(new CustomEvent('neon:cart:updated', { detail: { cart } }));
}
function clearCart(){ saveCart([]); }

/* ---------- Cart operations ---------- */
function updateCartBadge(cart){
  const cnt = (cart||[]).reduce((s,i) => s + (i.qty || 0), 0);
  qAll('#cart-count').forEach(el => el.textContent = cnt);
}
function addToCart(id, qty = 1){
  const cart = loadCart();
  const idx = cart.findIndex(i => i.id === id);
  if (idx >= 0) cart[idx].qty = (cart[idx].qty || 0) + Number(qty);
  else cart.push({ id, qty: Number(qty) });
  saveCart(cart);
}
function removeFromCart(id){
  const cart = loadCart().filter(i => i.id !== id);
  saveCart(cart);
}

/* ---------- Render products (index.html) ---------- */
function renderProductsPage(){
  const panel = $('products-panel');
  if (!panel) return;
  panel.innerHTML = '';

  PRODUCTS.forEach(p => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-media" role="button" tabindex="0" aria-label="${p.title}">
        <img src="${p.images[0]}" alt="${p.title}">
      </div>
      <div class="product-body">
        <div class="product-title">${p.title}</div>
        <div class="price-row">
          ${p.originalPrice ? `<div class="price-original">${formatCurrency(p.originalPrice)}</div>` : ''}
          <div class="price-current">${formatCurrency(p.price)}</div>
        </div>
        <div class="product-actions">
          <button class="btn btn-primary btn-add">Add</button>
          <button class="btn btn-secondary btn-view">View</button>
        </div>
      </div>
    `;
    panel.appendChild(card);

    const addBtn = q('.btn-add', card);
    const viewBtn = q('.btn-view', card);
    const media = q('.product-media', card);

    addBtn && addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(p.id, 1);
      // open cart page so user can see the item immediately
      window.location.href = 'cart.html';
    });

    const openModalHandler = (e) => { e.stopPropagation(); openProductModal(p); };
    viewBtn && viewBtn.addEventListener('click', openModalHandler);
    media && media.addEventListener('click', openModalHandler);
    media && media.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') openModalHandler(e); });
  });
}

/* ---------- Modal product detail (with safe overlay styles) ---------- */
function openProductModal(product){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  // inline base overlay styles to avoid z-index/pointer issues
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);display:flex;justify-content:center;align-items:flex-start;padding:20px;z-index:9999;overflow:auto;';
  overlay.innerHTML = `
    <div class="modal-dialog" role="dialog" aria-modal="true" aria-label="${product.title}" style="max-width:720px;width:100%;background:var(--card, #fff);border-radius:12px;padding:18px;box-shadow:0 18px 48px rgba(0,0,0,0.4);">
      <div class="modal-header" style="display:flex;justify-content:space-between;align-items:center;">
        <h2 style="margin:0">${product.title}</h2>
        <button class="modal-close" aria-label="Close" style="font-size:24px;line-height:1;border:0;background:transparent;cursor:pointer;">×</button>
      </div>

      <div class="carousel-container" style="margin-top:12px;">
        <div class="carousel-images" style="display:flex; overflow-x:auto; scroll-snap-type:x mandatory; -webkit-overflow-scrolling:touch;">
          ${product.images.map(src=>`<img src="${src}" alt="${product.title}" style="min-width:100%;height:auto;object-fit:cover;scroll-snap-align:center;border-radius:8px;">`).join('')}
        </div>
        <div class="carousel-dots" style="margin-top:8px;display:flex;gap:8px;justify-content:center;"></div>
      </div>

      <div class="modal-info" style="margin-top:12px;">
        <div class="modal-price" style="font-weight:700;color:var(--primary,#ff6f00)">${formatCurrency(product.price)}</div>
        <p class="muted" style="margin-top:8px;">${product.desc}</p>
        <div class="modal-actions" style="margin-top:12px;display:flex;gap:8px;align-items:center;">
          <input id="modal-qty" type="number" min="1" value="1" style="width:84px;padding:8px;border-radius:8px;border:1px solid rgba(0,0,0,0.08);">
          <button class="btn btn-primary" id="modal-add">Add to Cart</button>
          <button class="btn btn-secondary" id="modal-buy">Buy Now</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const closeBtn = q('.modal-close', overlay);
  const carousel = q('.carousel-images', overlay);
  const dotsWrap = q('.carousel-dots', overlay);
  const imgs = Array.from(carousel.querySelectorAll('img'));

  // create dots
  imgs.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'carousel-dot' + (i===0 ? ' active' : '');
    dot.dataset.index = i;
    dot.style.width = '10px'; dot.style.height = '10px'; dot.style.borderRadius = '50%';
    dot.style.background = i===0 ? 'var(--primary,#ff6f00)' : 'rgba(0,0,0,0.15)';
    dot.style.cursor = 'pointer';
    dotsWrap.appendChild(dot);
    dot.addEventListener('click', () => {
      carousel.scrollTo({ left: i * carousel.clientWidth, behavior: 'smooth' });
    });
  });

  // update dots on scroll
  let scrollTimer = null;
  carousel.addEventListener('scroll', () => {
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const ix = Math.round(carousel.scrollLeft / carousel.clientWidth);
      qAll('.carousel-dot', dotsWrap).forEach((d, j) => d.style.background = j === ix ? 'var(--primary,#ff6f00)' : 'rgba(0,0,0,0.15)');
    }, 80);
  });

  // close handlers
  closeBtn && closeBtn.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (ev) => { if (ev.target === overlay) overlay.remove(); });
  const escHandler = (e) => { if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', escHandler); } };
  document.addEventListener('keydown', escHandler);

  // add / buy actions
  q('#modal-add', overlay).addEventListener('click', () => {
    const qty = Math.max(1, Number(q('#modal-qty', overlay)?.value || 1));
    addToCart(product.id, qty);
    overlay.remove();
    window.location.href = 'cart.html';
  });
  q('#modal-buy', overlay).addEventListener('click', () => {
    const qty = Math.max(1, Number(q('#modal-qty', overlay)?.value || 1));
    addToCart(product.id, qty);
    overlay.remove();
    window.location.href = 'checkout.html';
  });

  // ensure first image visible
  carousel.scrollLeft = 0;
}

/* ---------- CART page render ---------- */
function renderCartPage(){
  const panel = $('cart-items');
  if (!panel) return;
  const cart = loadCart();
  panel.innerHTML = '';

  if (!cart.length) {
    panel.innerHTML = '<p style="text-align:center;color:var(--muted,#888);padding:12px">Your cart is empty.</p>';
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
        <h4 style="margin:0">${p.title}</h4>
        <div class="cart-price">${formatCurrency(p.price)} × ${item.qty} = <strong>${formatCurrency(p.price * item.qty)}</strong></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
        <button class="remove-btn btn-sm">Remove</button>
      </div>
    `;
    const removeBtn = q('.remove-btn', row);
    removeBtn.addEventListener('click', () => {
      removeFromCart(item.id);
      renderCartPage();
    });
    panel.appendChild(row);
  });

  updateCartTotals(subtotal);
  setCheckoutEnabled(true);
}

/* ---------- totals & checkout state ---------- */
function updateCartTotals(subtotal){
  const shipping = 0;
  const setIf = (id, value) => { const e = $(id); if (e) e.textContent = value; };
  setIf('subtotal', formatCurrency(subtotal));
  setIf('shipping', shipping === 0 ? 'Free' : formatCurrency(shipping));
  setIf('total', formatCurrency(subtotal + shipping));
  setIf('subtotal-amt', formatCurrency(subtotal));
  setIf('shipping-amt', shipping === 0 ? 'Free' : formatCurrency(shipping));
  setIf('grand-amt', formatCurrency(subtotal + shipping));
}

function setCheckoutEnabled(enabled){
  const toCheckout = $('to-checkout');
  if (toCheckout) {
    if (!enabled) { toCheckout.classList.add('disabled'); toCheckout.style.pointerEvents = 'none'; toCheckout.setAttribute('aria-disabled','true'); }
    else { toCheckout.classList.remove('disabled'); toCheckout.style.pointerEvents = ''; toCheckout.removeAttribute('aria-disabled'); }
  }
  const place = $('place-order');
  if (place) {
    place.disabled = !enabled;
    if (!enabled) place.setAttribute('aria-disabled','true'); else place.removeAttribute('aria-disabled');
  }
}

/* ---------- CHECKOUT render + handlers ---------- */
function renderCheckoutPage(){
  const cart = loadCart();
  const subtotal = cart.reduce((s,it) => {
    const p = PRODUCTS.find(pr => pr.id === it.id) || { price: 0 };
    return s + (p.price * it.qty);
  }, 0);
  updateCartTotals(subtotal);

  const saved = safeParse(localStorage.getItem(STORAGE_KEYS.address), null);
  const form = $('address-form');
  const summary = $('address-summary');
  const savedText = $('saved-address-text');

  if (saved && saved.name) {
    if (form) form.style.display = 'none';
    if (summary) {
      summary.style.display = 'block';
      if (savedText) savedText.innerHTML = `<strong>${saved.name}</strong><br>${saved.street}, ${saved.city} - ${saved.pincode}<br>📞 ${saved.phone}`;
    }
  } else {
    if (form) form.style.display = '';
    if (summary) summary.style.display = 'none';
  }
}

function initCheckoutHandlers(){
  // init EmailJS if available
  if (window.emailjs && typeof emailjs.init === 'function') {
    try { emailjs.init(EMAILJS_PUBLIC_KEY); } catch(e) { console.warn('EmailJS init failed', e); }
  }

  // address form
  const form = $('address-form');
  if (form) {
    const saved = safeParse(localStorage.getItem(STORAGE_KEYS.address), null);
    if (saved) {
      try {
        if (form.elements['name']) form.elements['name'].value = saved.name || '';
        if (form.elements['phone']) form.elements['phone'].value = saved.phone || '';
        if (form.elements['street']) form.elements['street'].value = saved.street || '';
        if (form.elements['city']) form.elements['city'].value = saved.city || '';
        if (form.elements['pincode']) form.elements['pincode'].value = saved.pincode || '';
      } catch(e){}
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const data = {
        name: form.elements['name'].value.trim(),
        phone: form.elements['phone'].value.trim(),
        street: form.elements['street'].value.trim(),
        city: form.elements['city'].value.trim(),
        pincode: form.elements['pincode'].value.trim()
      };
      localStorage.setItem(STORAGE_KEYS.address, JSON.stringify(data));
      alert('Address saved');
      renderCheckoutPage();
    });
  }

  // edit / clear
  const editBtn = $('edit-address');
  if (editBtn) editBtn.addEventListener('click', () => { if ($('address-form')) $('address-form').style.display = ''; if ($('address-summary')) $('address-summary').style.display = 'none'; });
  const clearBtn = $('clear-address');
  if (clearBtn) clearBtn.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEYS.address);
    if ($('address-form')) { $('address-form').reset(); $('address-form').style.display = ''; }
    if ($('address-summary')) $('address-summary').style.display = 'none';
    alert('Saved address removed');
  });

  // place order (send email via EmailJS)
  const place = $('place-order');
  if (place) {
    place.addEventListener('click', async (e) => {
      e.preventDefault();
      const cart = loadCart();
      if (!cart.length) { alert('Your cart is empty. Please add items before placing an order.'); return; }
      const addr = safeParse(localStorage.getItem(STORAGE_KEYS.address), null);
      if (!addr || !addr.name) { alert('Please save your shipping address before placing order.'); return; }

      const itemsTxt = cart.map(it => {
        const p = PRODUCTS.find(pr => pr.id === it.id) || {};
        return `${p.title || it.id} × ${it.qty} = ${formatCurrency((p.price||0) * it.qty)}`;
      }).join('\n');

      const totalVal = cart.reduce((s,it) => { const p = PRODUCTS.find(pr => pr.id === it.id) || { price: 0 }; return s + p.price * it.qty; }, 0);

      const templateParams = {
        order_items: itemsTxt,
        order_total: formatCurrency(totalVal),
        customer_name: addr.name,
        customer_phone: addr.phone,
        customer_address: `${addr.street}, ${addr.city} - ${addr.pincode}`
      };

      try {
        if (!window.emailjs || typeof emailjs.send !== 'function') throw new Error('EmailJS is not available or not loaded');
        // correct usage: pass service id, template id and params
        await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, templateParams);
        // success: clear cart & navigate to success
        clearCart();
        window.location.href = 'order-success.html';
      } catch (err) {
        console.error('EmailJS error details:', err);
        const msg = (err && err.text) ? err.text : (err && err.message) ? err.message : 'Failed to send order confirmation. See console for details.';
        alert(msg);
      }
    });
  }
}

/* ---------- brand click: always go home (avoid wrong default) ---------- */
function initBrandLinks(){
  qAll('.brand').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault && e.preventDefault();
      window.location.href = 'index.html';
    });
  });
}

/* ---------- Initialization ---------- */
document.addEventListener('DOMContentLoaded', () => {
  try {
    updateCartBadge(loadCart());
    if ($('products-panel')) renderProductsPage();
    if ($('cart-items')) renderCartPage();
    if ($('address-form') || $('place-order')) {
      renderCheckoutPage();
      initCheckoutHandlers();
    }
    initBrandLinks();

    // keep UI in sync across tabs
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEYS.cart || e.key === STORAGE_KEYS.cartLegacy) {
        updateCartBadge(loadCart());
        if ($('cart-items')) renderCartPage();
        if ($('subtotal')) renderCheckoutPage();
      }
    });

    // local event
    window.addEventListener('neon:cart:updated', () => {
      updateCartBadge(loadCart());
      if ($('cart-items')) renderCartPage();
      if ($('subtotal')) renderCheckoutPage();
    });
  } catch (err) {
    console.error('Init error', err);
  }
});
