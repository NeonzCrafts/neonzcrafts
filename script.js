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
function updateCartBadge(c){ const cnt = c.reduce((s,i)=>s+i.qty,0); document.querySelectorAll('#cart-count').forEach(el=>el.textContent=cnt); }
function addToCart(id,qty=1){ let c = loadCart(); const i = c.findIndex(x=>x.id===id); i>=0?c[i].qty+=qty:c.push({id,qty}); saveCart(c); }

// ---------- RENDER PRODUCTS ----------
function renderProductsPage(){
  const panel = $('products-panel');
  if (!panel) return;
  panel.innerHTML = '';
  const p = PRODUCTS[0];
  const card = document.createElement('article');
  card.className = 'product-card';
  card.style = "background:var(--card);padding:12px;border-radius:var(--radius);box-shadow:var(--shadow);text-align:center;";
  card.innerHTML = `
    <img src="${p.images[0]}" alt="${p.title}" style="max-width:100%;border-radius:8px;">
    <h3 style="margin:10px 0;font-size:1.1rem;">${p.title}</h3>
    <p style="color:var(--muted);font-size:0.9rem;">${p.desc}</p>
    <div style="font-weight:bold;font-size:1.1rem;color:var(--primary);margin:4px 0;">₹${p.price}</div>
    ${p.originalPrice ? `<div style="text-decoration:line-through;color:var(--muted);font-size:0.85rem;">₹${p.originalPrice}</div>`:''}
    <div style="margin-top:8px;display:flex;gap:8px;justify-content:center;">
      <input type="number" min="1" value="1" class="mini-qty" style="width:60px;padding:6px;border-radius:8px;border:1px solid #ccc;">
      <button class="btn btn-primary add-js">Add to Cart</button>
    </div>`;
  panel.appendChild(card);
  card.querySelector('.add-js').addEventListener('click', () => {
    const qty = Number(card.querySelector('.mini-qty').value) || 1;
    addToCart(p.id, qty);
    alert('✅ Added to cart');
  });
}

// ---------- CART PAGE ----------
function renderCartPage(){
  const panel = $('cart-items');
  if (!panel) return;
  const cart = loadCart();
  panel.innerHTML = '';
  if (cart.length === 0) {
    panel.innerHTML = '<p style="text-align:center;color:var(--muted);margin:1rem;">Your cart is empty.</p>';
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
    row.style = "display:flex;align-items:center;gap:10px;background:var(--card);padding:8px;border-radius:8px;box-shadow:var(--shadow);margin-bottom:8px;";
    row.innerHTML = `
      <img src="${p.images[0]}" style="width:60px;height:60px;border-radius:6px;object-fit:cover;">
      <div style="flex:1;">
        <div>${p.title}</div>
        <div style="font-size:0.9rem;color:var(--muted);">₹${p.price} × ${item.qty} = <strong>₹${p.price * item.qty}</strong></div>
      </div>
      <button class="btn btn-secondary remove-btn">✖</button>
    `;
    row.querySelector('.remove-btn').addEventListener('click', () => removeFromCart(item.id));
    panel.appendChild(row);
  });
  updateCartTotals(subtotal);
}

function updateCartTotals(subtotal){
  if ($('subtotal')) $('subtotal').textContent = `₹${subtotal}`;
  if ($('shipping')) $('shipping').textContent = `Free`;
  if ($('total')) $('total').textContent = `₹${subtotal}`;
}

function removeFromCart(id){
  let cart = loadCart();
  cart = cart.filter(c => c.id !== id);
  saveCart(cart);
  renderCartPage();
}

// ---------- CHECKOUT ----------
function renderCheckoutPage(){
  const subtotalEl = $('subtotal'); const shippingEl = $('shipping'); const totalEl = $('total');
  if (!subtotalEl) return;
  const cart = loadCart();
  let subtotal = 0;
  cart.forEach(item => { const p = PRODUCTS.find(pr=>pr.id===item.id); if (p) subtotal += p.price*item.qty; });
  subtotalEl.textContent = `₹${subtotal}`; shippingEl.textContent = "Free"; totalEl.textContent = `₹${subtotal}`;
}

function buildCartHTML(cart){
  return cart.map(item => {
    const p = PRODUCTS.find(pr => pr.id === item.id);
    if (!p) return '';
    return `<div style="display:flex;justify-content:space-between;">
              <span>${p.title} × ${item.qty}</span>
              <strong>₹${p.price * item.qty}</strong>
            </div>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge(loadCart());
  renderProductsPage();
  renderCartPage();
  renderCheckoutPage();

  const form = document.getElementById('address-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const data = {
        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
        street: form.street.value.trim(),
        city: form.city.value.trim(),
        pincode: form.pincode.value.trim(),
      };
      localStorage.setItem('neon_address', JSON.stringify(data));
      alert('✅ Address saved!');
    });
    const saved = localStorage.getItem('neon_address');
    if (saved) {
      try {
        const addr = JSON.parse(saved);
        form.name.value = addr.name || '';
        form.phone.value = addr.phone || '';
        form.street.value = addr.street || '';
        form.city.value = addr.city || '';
        form.pincode.value = addr.pincode || '';
      } catch {}
    }
  }

  const placeOrderBtn = document.getElementById('place-order');
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const cart = loadCart();
      if (cart.length === 0) return alert('Your cart is empty!');
      const savedAddress = JSON.parse(localStorage.getItem('neon_address') || '{}');
      if (!savedAddress.name) return alert('Please save your address first.');
      const subtotal = cart.reduce((sum, item) => {
        const p = PRODUCTS.find(pr => pr.id === item.id);
        return p ? sum + p.price * item.qty : sum;
      }, 0);
      try {
        await emailjs.send("service_al4zpdb", "template_vimeo5m", {
          name: savedAddress.name,
          phone: savedAddress.phone,
          street: savedAddress.street,
          city: savedAddress.city,
          pincode: savedAddress.pincode,
          cart: buildCartHTML(cart),
          total: subtotal
        });
        alert("✅ Order sent successfully!");
        localStorage.removeItem(STORAGE_KEYS.cart);
        updateCartBadge([]);
        window.location.href = 'order-success.html';
      } catch (err) {
        console.error(err);
        alert("❌ Failed to send order. Check console.");
      }
    });
  }
});
