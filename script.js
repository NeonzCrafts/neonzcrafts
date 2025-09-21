/* app script for NeonzCrafts
   - manages product rendering, modal, cart, checkout and EmailJS sending
   - requires EmailJS SDK (included on all pages)
*/

/* ---------- CONFIG ---------- */
const STORAGE_KEYS = { cart: 'neon_cart_v3', address: 'neon_address_v3' };

// single sample product (three images)
const PRODUCTS = [
  {
    id: 'p1',
    title: 'Educational Geometric Shape Toy',
    price: 299,
    originalPrice: 399,
    images: ['1000069559.jpg', '1000069560.jpg', '1000069561.jpg'],
    desc: 'Interactive and colorful shape toy to improve cognitive skills for toddlers.'
  }
];

// EmailJS config (user supplied)
const EMAILJS_SERVICE = 'service_al4zpdb';
const EMAILJS_TEMPLATE = 'template_vimeo5m';
const EMAILJS_PUBLIC_KEY = 'CRkybtSL0tLoJJ71X';

/* ---------- small helpers ---------- */
function $(id) { return document.getElementById(id); }
function safeParse(raw, fallback) { try { return JSON.parse(raw || 'null') || fallback } catch { return fallback } }

/* ---------- cart storage ---------- */
function loadCart() { return safeParse(localStorage.getItem(STORAGE_KEYS.cart), []); }
function saveCart(c) { localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(c)); updateCartBadge(c); }
function updateCartBadge(c) {
  const cnt = Array.isArray(c) ? c.reduce((s, i) => s + (i.qty || 0), 0) : 0;
  document.querySelectorAll('#cart-count').forEach(el => el.textContent = cnt);
}

/* add to cart; optionally navigate after add */
function addToCart(id, qty = 1, navigate = false, openCart = false) {
  const cart = loadCart();
  const idx = cart.findIndex(x => x.id === id);
  if (idx >= 0) cart[idx].qty = (cart[idx].qty || 0) + Number(qty);
  else cart.push({ id, qty: Number(qty) });
  saveCart(cart);
  if (openCart) window.location.href = 'cart.html';
  else if (navigate) window.location.href = navigate;
}

/* remove item and re-render */
function removeFromCart(id) {
  let cart = loadCart();
  cart = cart.filter(c => c.id !== id);
  saveCart(cart);
  renderCartPage();
  renderCheckoutPage();
}

/* ---------- PRODUCT RENDER & modal ---------- */
function renderProductsPage() {
  const panel = $('products-panel');
  if (!panel) return;
  panel.innerHTML = '';
  PRODUCTS.forEach((p) => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-media">
        <div class="carousel-images" data-count="${p.images.length}">
          ${p.images.map(src => `<img src="${src}" alt="${p.title}">`).join('')}
        </div>
      </div>
      <div class="product-body">
        <div class="product-title">${p.title}</div>
        <div class="price-row">
          ${p.originalPrice ? `<div class="price-original">₹${p.originalPrice}</div>` : ''}
          <div class="price-current">₹${p.price}</div>
        </div>
        <div class="product-actions">
          <button class="btn btn-primary btn-add">Add to Cart</button>
          <button class="btn btn-secondary btn-view">View</button>
        </div>
      </div>
    `;
    // open modal on view or clicking title/image area
    card.querySelector('.btn-view').addEventListener('click', () => openProductModal(p));
    card.querySelector('.product-media').addEventListener('click', () => openProductModal(p));

    // add to cart quick action: open cart after add
    card.querySelector('.btn-add').addEventListener('click', () => {
      addToCart(p.id, 1, false, true); // open cart
    });

    // small carousel auto-size setup
    panel.appendChild(card);
    setupCardCarousel(card);
  });
}

/* small helper to make card carousel work (only translate) */
function setupCardCarousel(card) {
  const container = card.querySelector('.carousel-images');
  if (!container) return;
  const imgs = container.querySelectorAll('img');
  if (imgs.length <= 1) return;
  let idx = 0;
  // set width: container is flex row by default via CSS
  container.style.display = 'flex';
  container.style.transition = 'transform 0.35s ease';
  // simple auto-rotate every 3.5s
  const auto = setInterval(() => {
    idx = (idx + 1) % imgs.length;
    container.style.transform = `translateX(-${idx * 100}%)`;
  }, 3500);
  // stop on hover/touch
  card.addEventListener('mouseenter', () => clearInterval(auto));
}

/* modal creation and behavior */
function openProductModal(product) {
  // create overlay
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `
    <div class="modal-dialog" tabindex="-1">
      <button class="modal-close" aria-label="Close">&times;</button>
      <h2 style="margin-top:0">${product.title}</h2>
      <div class="modal-media">
        <div class="carousel-images" id="modal-carousel" style="display:flex;transition:transform 0.35s ease;">
          ${product.images.map(src => `<img class="modal-img" src="${src}" alt="${product.title}">`).join('')}
        </div>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:8px" id="modal-dots"></div>
      </div>
      <p class="muted" style="margin-top:12px">${product.desc}</p>
      <div style="margin-top:10px;color:var(--primary);font-weight:800">₹${product.price}</div>
      <div class="modal-actions">
        <input id="modal-qty" type="number" min="1" value="1" style="width:76px;padding:10px;border-radius:8px;border:1px solid rgba(0,0,0,0.06)">
        <button class="btn btn-primary" id="modal-add">Add to Cart</button>
        <button class="btn btn-secondary" id="modal-buy">Buy Now</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const dialog = modal.querySelector('.modal-dialog');
  const closeBtn = modal.querySelector('.modal-close');
  const carousel = modal.querySelector('#modal-carousel');
  const dotsWrap = modal.querySelector('#modal-dots');
  const imgs = carousel.querySelectorAll('img');
  let idx = 0;

  // dots
  imgs.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    d.style.width = '10px';
    d.style.height = '10px';
    d.style.borderRadius = '50%';
    d.style.background = i === 0 ? 'var(--primary)' : 'rgba(0,0,0,0.2)';
    d.style.cursor = 'pointer';
    d.dataset.index = i;
    d.addEventListener('click', () => showSlide(Number(d.dataset.index)));
    dotsWrap.appendChild(d);
  });

  function showSlide(i) {
    idx = i;
    carousel.style.transform = `translateX(-${idx * 100}%)`;
    dotsWrap.querySelectorAll('div').forEach((el, j) => el.style.background = j === idx ? 'var(--primary)' : 'rgba(0,0,0,0.2)');
  }

  // close events
  closeBtn.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', esc); } });

  // add handlers
  modal.querySelector('#modal-add').addEventListener('click', () => {
    const q = Math.max(1, Number(modal.querySelector('#modal-qty').value || 1));
    addToCart(product.id, q, false, true); // open cart
    modal.remove();
  });
  modal.querySelector('#modal-buy').addEventListener('click', () => {
    const q = Math.max(1, Number(modal.querySelector('#modal-qty').value || 1));
    addToCart(product.id, q);
    modal.remove();
    window.location.href = 'checkout.html';
  });

  // responsive: swipe support - simple touch
  let startX = 0;
  carousel.addEventListener('touchstart', (e) => startX = e.changedTouches[0].clientX);
  carousel.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (dx > 40) showSlide(Math.max(0, idx - 1));
    if (dx < -40) showSlide(Math.min(imgs.length - 1, idx + 1));
  });

  // auto size adjust (each image full width)
  showSlide(0);
}

/* ---------- CART PAGE RENDER ---------- */
function renderCartPage() {
  const panel = $('cart-items');
  if (!panel) return;
  const cart = loadCart();
  panel.innerHTML = '';

  if (!cart.length) {
    panel.innerHTML = '<p style="text-align:center;margin:1rem 0;color:var(--muted)">Your cart is empty.</p>';
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
        <h4 style="margin:0">${p.title}</h4>
        <div class="cart-price">₹${p.price} × ${item.qty} = <strong>₹${p.price * item.qty}</strong></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
        <button class="remove-btn btn-sm">Remove</button>
      </div>
    `;
    row.querySelector('.remove-btn').addEventListener('click', () => {
      removeFromCart(item.id);
    });
    panel.appendChild(row);
  });

  updateCartTotals(subtotal);
}

/* update totals (used by cart and checkout) */
function updateCartTotals(subtotal) {
  const shipping = 0; // always free
  if ($('subtotal')) $('subtotal').textContent = `₹${subtotal}`;
  if ($('shipping')) $('shipping').textContent = (shipping === 0 ? 'Free' : `₹${shipping}`);
  if ($('total')) $('total').textContent = `₹${subtotal + shipping}`;
  // disable checkout link on cart page if empty
  const toCheckout = $('to-checkout');
  const cart = loadCart();
  if (toCheckout) {
    if (!cart.length) {
      toCheckout.classList.add('btn-secondary');
      toCheckout.classList.remove('btn-primary');
      toCheckout.setAttribute('aria-disabled', 'true');
      toCheckout.style.pointerEvents = 'none';
    } else {
      toCheckout.classList.remove('btn-secondary');
      toCheckout.classList.add('btn-primary');
      toCheckout.removeAttribute('aria-disabled');
      toCheckout.style.pointerEvents = '';
    }
  }
}

/* ---------- CHECKOUT PAGE ---------- */
function renderCheckoutPage() {
  const subtotalEl = $('subtotal');
  const shippingEl = $('shipping');
  const totalEl = $('total');
  if (!subtotalEl || !totalEl) return;

  const cart = loadCart();
  if (!cart.length) {
    subtotalEl.textContent = '₹0';
    shippingEl.textContent = 'Free';
    totalEl.textContent = '₹0';
  } else {
    let subtotal = 0;
    cart.forEach(item => {
      const p = PRODUCTS.find(pr => pr.id === item.id);
      if (p) subtotal += p.price * item.qty;
    });
    subtotalEl.textContent = `₹${subtotal}`;
    shippingEl.textContent = 'Free';
    totalEl.textContent = `₹${subtotal}`;
  }

  // address form / summary
  const saved = safeParse(localStorage.getItem(STORAGE_KEYS.address), null);
  const form = $('address-form');
  const summary = $('address-summary');
  const savedText = $('saved-address-text');
  if (saved && saved.name) {
    // show compact summary
    if (form) form.style.display = 'none';
    if (summary) {
      summary.style.display = 'block';
      savedText.innerHTML = `<strong>${saved.name}</strong><br>${saved.street}, ${saved.city} - ${saved.pincode}<br>📞 ${saved.phone}`;
    }
  } else {
    if (form) form.style.display = '';
    if (summary) summary.style.display = 'none';
  }
}

/* ---------- ADDRESS form & place-order ---------- */
function initCheckoutHandlers() {
  // emailjs init (if available)
  try { if (window.emailjs) emailjs.init(EMAILJS_PUBLIC_KEY); } catch(e){ console.warn('EmailJS init failed', e); }

  const form = $('address-form');
  const summary = $('address-summary');
  const savedText = $('saved-address-text');

  if (form) {
    // auto-fill if exists
    const saved = safeParse(localStorage.getItem(STORAGE_KEYS.address), null);
    if (saved) {
      try {
        form.elements['name'].value = saved.name || '';
        form.elements['phone'].value = saved.phone || '';
        form.elements['street'].value = saved.street || '';
        form.elements['city'].value = saved.city || '';
        form.elements['pincode'].value = saved.pincode || '';
      } catch {}
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const addressData = {
        name: form.elements['name'].value.trim(),
        phone: form.elements['phone'].value.trim(),
        street: form.elements['street'].value.trim(),
        city: form.elements['city'].value.trim(),
        pincode: form.elements['pincode'].value.trim()
      };
      localStorage.setItem(STORAGE_KEYS.address, JSON.stringify(addressData));
      alert('Address saved');
      renderCheckoutPage();
    });
  }

  // Edit / clear actions
  const editBtn = $('edit-address');
  const clearBtn = $('clear-address');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      if (form) form.style.display = '';
      if (summary) summary.style.display = 'none';
    });
  }
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEYS.address);
      if (form) {
        form.reset();
        form.style.display = '';
      }
      if (summary) summary.style.display = 'none';
      alert('Saved address removed.');
    });
  }

  // place order
  const place = $('place-order');
  if (place) {
    place.addEventListener('click', async (e) => {
      e.preventDefault();
      const cart = loadCart();
      if (!cart.length) { alert('Your cart is empty. Please add items before placing an order.'); return; }
      const address = safeParse(localStorage.getItem(STORAGE_KEYS.address), null);
      if (!address || !address.name) { alert('Please save your shipping address before placing order.'); return; }

      // Prepare order summary
      const items = cart.map(item => {
        const p = PRODUCTS.find(pr => pr.id === item.id) || {};
        return `${p.title || item.id} x ${item.qty} = ₹${(p.price || 0) * item.qty}`;
      }).join('\n');

      const subtotal = cart.reduce((s, it) => {
        const p = PRODUCTS.find(pr => pr.id === it.id) || { price: 0 };
        return s + (p.price * it.qty);
      }, 0);

      // EmailJS params
      const templateParams = {
        order_items: items,
        order_total: `₹${subtotal}`,
        customer_name: address.name,
        customer_phone: address.phone,
        customer_address: `${address.street}, ${address.city} - ${address.pincode}`
      };

      try {
        if (!window.emailjs) throw new Error('EmailJS not loaded');
        // send
        await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, templateParams);
        // on success - clear cart and go to success page
        localStorage.removeItem(STORAGE_KEYS.cart);
        updateCartBadge([]);
        alert('Order placed — confirmation sent.');
        window.location.href = 'order-success.html';
      } catch (err) {
        console.error('Email send failed', err);
        alert('Failed to send order email. Order not completed. Please try again later.');
      }
    });
  }
}

/* ---------- INITIALIZE ON DOM CONTENT LOADED ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // initialize EmailJS if available
  try { if (window.emailjs) emailjs.init(EMAILJS_PUBLIC_KEY); } catch (e) {}

  updateCartBadge(loadCart());
  renderProductsPage();
  renderCartPage();
  renderCheckoutPage();
  initCheckoutHandlers();
  // keep UI totals in sync
  const cart = loadCart();
  const subtotal = cart.reduce((s, it) => {
    const p = PRODUCTS.find(pr => pr.id === it.id) || { price: 0 };
    return s + (p.price * it.qty);
  }, 0);
  updateCartTotals(subtotal);
});
