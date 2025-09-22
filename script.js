/* ---------- CONFIG (kept your EmailJS values) ---------- */
const EMAILJS_SERVICE = "service_al4zpdb";
const EMAILJS_TEMPLATE = "template_vimeo5m";
const EMAILJS_PUBLIC_KEY = "CRkybtSL0tLoJJ71X";

const STORAGE_KEYS = {
  cart: "neon_cart_v4",
  cartLegacy: "neon_cart_v2",
  address: "neon_address_v3"
};

/* ---------- DEMO PRODUCTS (re-usable images) ---------- */
const PRODUCTS = [
  {
    id: "p1",
    title: "Educational Geometric Shape Toy — Classic",
    price: 299,
    originalPrice: 399,
    images: ["1000069559.jpg","1000069560.jpg","1000069561.jpg"],
    desc: "Interactive and colorful shape toy to improve cognitive skills for toddlers."
  },
  {
    id: "p2",
    title: "Geometric Sorting Board — Set",
    price: 349,
    originalPrice: 499,
    images: ["1000069560.jpg","1000069561.jpg","1000069559.jpg"],
    desc: "A compact sorting board with multiple shapes. Great for early learning."
  },
  {
    id: "p3",
    title: "Stack & Count Shapes — Pack",
    price: 199,
    originalPrice: 249,
    images: ["1000069559.jpg","1000069561.jpg","1000069560.jpg"],
    desc: "Small stackable shapes that teach counting and colors."
  }
];

/* ---------- HELPERS ---------- */
function $(id){ return document.getElementById(id); }
function q(sel, ctx=document){ return (ctx||document).querySelector(sel); }
function qAll(sel, ctx=document){ return Array.from((ctx||document).querySelectorAll(sel)); }
function safeParse(raw, fallback){ try { return JSON.parse(raw||'null') || fallback } catch { return fallback; } }
function formatCurrency(n){ return `₹${Number(n||0).toFixed(0)}`; }
function calcDiscountPercent(p){ if(!p.originalPrice) return null; return Math.round(((p.originalPrice - p.price)/p.originalPrice)*100); }

/* ---------- STORAGE ---------- */
function loadCart(){
  const raw = localStorage.getItem(STORAGE_KEYS.cart);
  if (raw) return safeParse(raw, []);
  const old = localStorage.getItem(STORAGE_KEYS.cartLegacy);
  if (old) {
    const parsed = safeParse(old, []);
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(parsed));
    return parsed;
  }
  return [];
}
function saveCart(cart){
  localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
  updateCartBadge(cart);
  // notify other listeners (if any)
  window.dispatchEvent(new CustomEvent("neon:cart:updated", { detail: { cart } }));
}
function clearCart(){ saveCart([]); }

/* ---------- CART UI ---------- */
function updateCartBadge(cart){
  const cnt = (cart||[]).reduce((s,i)=>s+(i.qty||0),0);
  qAll("#cart-count").forEach(el=>{
    el.textContent = cnt;
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  });
}

/* ---------- CART OPERATIONS ---------- */
function addToCart(id, qty=1){
  const cart = loadCart();
  const idx = cart.findIndex(i=>i.id===id);
  if(idx>=0) cart[idx].qty += qty;
  else cart.push({ id, qty });
  saveCart(cart);
}

function updateQty(id, delta){
  const cart = loadCart();
  const idx = cart.findIndex(i=>i.id===id);
  if(idx >= 0){
    cart[idx].qty += delta;
    if(cart[idx].qty <= 0) cart.splice(idx,1);
    saveCart(cart);
    renderCartPage();
    renderCheckoutPage();
  }
}

function removeFromCart(id){
  const cart = loadCart().filter(i=>i.id!==id);
  saveCart(cart);
  renderCartPage();
  renderCheckoutPage();
}

/* ---------- PRODUCTS LIST ---------- */
function renderProductsPage(){
  const panel = $("products-panel");
  if(!panel) return;
  panel.innerHTML = "";
  if(!PRODUCTS.length){
    panel.innerHTML = `<p style="text-align:center;color:var(--muted)">No products available</p>`;
    return;
  }
  PRODUCTS.forEach(p=>{
    const card = document.createElement("article");
    card.className = "product-card";
    const discount = calcDiscountPercent(p);
    card.innerHTML = `
      <div class="product-media" aria-hidden="true">
        <img src="${p.images[0]}" alt="${p.title}">
        ${discount ? `<span class="discount-badge">-${discount}%</span>` : ""}
      </div>
      <div class="product-body">
        <div class="product-title">${p.title}</div>
        <div class="price-row">
          ${p.originalPrice ? `<div class="price-original">${formatCurrency(p.originalPrice)}</div>` : ""}
          <div class="price-current">${formatCurrency(p.price)}</div>
        </div>
        <div class="product-actions">
          <button class="btn btn-primary btn-add">Add</button>
          <button class="btn btn-secondary btn-view">View</button>
        </div>
      </div>
    `;
    panel.appendChild(card);
    q(".btn-add", card).addEventListener("click", ()=>{
      addToCart(p.id, 1);
      // show cart for mobile users
      window.location.href = "cart.html";
    });
    const openModal = ()=> openProductModal(p);
    q(".btn-view", card).addEventListener("click", openModal);
    q(".product-media img", card).addEventListener("click", openModal);
  });
}

/* ---------- PRODUCT MODAL (carousel horizontal + arrows) ---------- */
function openProductModal(p){
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-dialog" role="dialog" aria-modal="true" aria-label="${p.title}">
      <div class="modal-header">
        <h2>${p.title}</h2>
        <button class="modal-close" aria-label="Close">×</button>
      </div>

      <div class="carousel-wrap">
        <button class="carousel-arrow left" aria-label="Previous">‹</button>
        <div class="carousel-images">
          ${p.images.map(src=>`<img src="${src}" alt="${p.title}">`).join("")}
        </div>
        <button class="carousel-arrow right" aria-label="Next">›</button>
      </div>

      <div class="modal-info">
        <div class="modal-price">${formatCurrency(p.price)} ${p.originalPrice?`<span class="modal-original">${formatCurrency(p.originalPrice)}</span>`:""}</div>
        <p class="modal-desc">${p.desc}</p>

        <div class="qty-stepper">
          <button id="qty-minus">−</button>
          <span id="qty-value">1</span>
          <button id="qty-plus">+</button>
        </div>

        <div class="modal-actions">
          <button class="btn btn-primary" id="modal-add">Add to Cart</button>
          <button class="btn btn-secondary" id="modal-buy">Buy Now</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Close handlers
  q(".modal-close", overlay).addEventListener("click", ()=>overlay.remove());
  overlay.addEventListener("click", e => { if(e.target === overlay) overlay.remove(); });

  // carousel logic
  const container = q(".carousel-images", overlay);
  const imgs = Array.from(container.querySelectorAll("img"));
  let idx = 0;
  function showIndex(i){
    idx = Math.max(0, Math.min(i, imgs.length - 1));
    imgs[idx].scrollIntoView({behavior:"smooth", inline:"center", block:"nearest"});
  }
  q(".carousel-arrow.left", overlay).addEventListener("click", ()=> showIndex(idx-1));
  q(".carousel-arrow.right", overlay).addEventListener("click", ()=> showIndex(idx+1));

  // make images snap to center on scroll: update idx
  container.addEventListener("scroll", ()=>{
    // find closest image to center
    const center = container.scrollLeft + (container.clientWidth/2);
    let best = 0; let bestDiff = Infinity;
    imgs.forEach((im, i)=>{
      const rect = im.offsetLeft + im.offsetWidth/2;
      const diff = Math.abs(center - rect);
      if(diff < bestDiff){ bestDiff = diff; best = i; }
    });
    idx = best;
  });

  // qty
  let qty = 1;
  const qtyValue = q("#qty-value", overlay);
  q("#qty-minus", overlay).addEventListener("click", ()=>{ if(qty>1){ qty--; qtyValue.textContent = qty; } });
  q("#qty-plus", overlay).addEventListener("click", ()=>{ qty++; qtyValue.textContent = qty; });

  // actions
  q("#modal-add", overlay).addEventListener("click", ()=>{
    addToCart(p.id, qty);
    overlay.remove();
    window.location.href = "cart.html";
  });
  q("#modal-buy", overlay).addEventListener("click", ()=>{
    addToCart(p.id, qty);
    overlay.remove();
    window.location.href = "checkout.html";
  });

  // init view
  setTimeout(()=> showIndex(0), 50);
}

/* ---------- CART PAGE ---------- */
function renderCartPage(){
  const panel = $("cart-items");
  if(!panel) return;
  const cart = loadCart();
  panel.innerHTML = "";
  if(!cart.length){
    panel.innerHTML = `<p class="empty">Your cart is empty.</p>`;
    updateCartTotals(0);
    return;
  }
  let subtotal = 0;
  cart.forEach(item=>{
    const p = PRODUCTS.find(pr=>pr.id === item.id);
    if(!p) return;
    subtotal += p.price * item.qty;
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <img class="cart-thumb" src="${p.images[0]}" alt="${p.title}">
      <div class="cart-details">
        <div class="cart-title">${p.title}</div>
        <div class="cart-meta">${formatCurrency(p.price)} each</div>
        <div class="qty-controls">
          <button class="qty-btn minus" aria-label="Decrease">−</button>
          <span class="qty-value">${item.qty}</span>
          <button class="qty-btn plus" aria-label="Increase">+</button>
        </div>
      </div>
      <div class="cart-right">
        <div class="cart-lineprice">${formatCurrency(p.price * item.qty)}</div>
        <button class="remove-btn">Remove</button>
      </div>
    `;
    q(".minus", row).addEventListener("click", ()=> updateQty(item.id, -1));
    q(".plus", row).addEventListener("click", ()=> updateQty(item.id, 1));
    q(".remove-btn", row).addEventListener("click", ()=> removeFromCart(item.id));
    q(".cart-thumb", row).addEventListener("click", ()=> openProductModal(p));
    panel.appendChild(row);
  });
  updateCartTotals(subtotal);
}

/* ---------- TOTALS ---------- */
function updateCartTotals(subtotal){
  // subtotal, shipping, grand on pages using these ids
  const shipping = 0;
  if($("subtotal-amt")) $("subtotal-amt").textContent = formatCurrency(subtotal);
  if($("shipping-amt")) $("shipping-amt").textContent = (shipping === 0 ? "Free" : formatCurrency(shipping));
  if($("grand-amt")) $("grand-amt").textContent = formatCurrency(subtotal + shipping);

  // some pages use "subtotal" / "total" plain ids (older) — safe set:
  if($("subtotal")) $("subtotal").textContent = formatCurrency(subtotal);
  if($("total")) $("total").textContent = formatCurrency(subtotal + shipping);
}

/* ---------- CHECKOUT ---------- */
function renderCheckoutPage(){
  const cart = loadCart();
  const subtotal = cart.reduce((s,it)=>{
    const p = PRODUCTS.find(pr => pr.id===it.id) || {price:0};
    return s + (p.price * it.qty);
  }, 0);
  updateCartTotals(subtotal);

  // product list on checkout
  const productPanel = $("checkout-products");
  if(productPanel){
    productPanel.innerHTML = "";
    if(!cart.length){
      productPanel.innerHTML = `<p class="empty">Your cart is empty.</p>`;
    } else {
      cart.forEach(it=>{
        const p = PRODUCTS.find(pr=>pr.id===it.id);
        if(!p) return;
        const row = document.createElement("div");
        row.className = "checkout-item";
        row.innerHTML = `
          <img src="${p.images[0]}" class="checkout-thumb" alt="${p.title}">
          <div class="checkout-info">
            <div class="checkout-title">${p.title}</div>
            <div class="checkout-meta">Qty: ${it.qty}</div>
          </div>
          <div class="checkout-price">${formatCurrency(p.price * it.qty)}</div>
        `;
        row.querySelector(".checkout-thumb").addEventListener("click", ()=> openProductModal(p));
        productPanel.appendChild(row);
      });
    }
  }

  // Address UI
  const saved = safeParse(localStorage.getItem(STORAGE_KEYS.address), null);
  const form = $("address-form"), summary = $("address-summary"), savedText = $("saved-address-text");
  if(form){
    if(saved){
      ["name","phone","street","city","pincode"].forEach(f => { if(form.elements[f]) form.elements[f].value = saved[f] || ""; });
    }
  }
  if(saved && saved.name){
    if(form) form.style.display = "none";
    if(summary) { summary.style.display = "block"; savedText.innerHTML = `<strong>${saved.name}</strong><br>${saved.street}, ${saved.city} - ${saved.pincode}<br>📞 ${saved.phone}`; }
  } else {
    if(form) form.style.display = "";
    if(summary) summary.style.display = "none";
  }
}

function initCheckoutHandlers(){
  if(window.emailjs) try{ emailjs.init(EMAILJS_PUBLIC_KEY); }catch(e){ console.warn("EmailJS init", e); }

  const form = $("address-form");
  if(form){
    form.addEventListener("submit", e=>{
      e.preventDefault();
      const data = {
        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
        street: form.street.value.trim(),
        city: form.city.value.trim(),
        pincode: form.pincode.value.trim()
      };
      localStorage.setItem(STORAGE_KEYS.address, JSON.stringify(data));
      // update UI immediately
      renderCheckoutPage();
    });
  }

  $("edit-address")?.addEventListener("click", ()=>{
    if($("address-form")) $("address-form").style.display = "";
    if($("address-summary")) $("address-summary").style.display = "none";
  });

  $("clear-address")?.addEventListener("click", ()=>{
    localStorage.removeItem(STORAGE_KEYS.address);
    if($("address-form")) $("address-form").reset();
    renderCheckoutPage();
  });

  $("place-order")?.addEventListener("click", async ()=>{
    const btn = $("place-order");
    const cart = loadCart();
    if(!cart.length) return alert("Your cart is empty.");
    const addr = safeParse(localStorage.getItem(STORAGE_KEYS.address), null);
    if(!addr) return alert("Please save your shipping address.");
    btn.disabled = true;
    btn.textContent = "Placing...";
    btn.style.opacity = "0.7";
    try {
      // prepare items text
      const orderItemsText = cart.map(it=>{
        const p = PRODUCTS.find(pr => pr.id === it.id) || {};
        return `${p.title} × ${it.qty} = ${formatCurrency((p.price||0) * it.qty)}`;
      }).join("\n");
      const total = cart.reduce((s,it)=> {
        const p = PRODUCTS.find(pr=>pr.id===it.id) || {price:0};
        return s + p.price * it.qty;
      }, 0);
      await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
        order_items: orderItemsText,
        order_total: formatCurrency(total),
        customer_name: addr.name,
        customer_phone: addr.phone,
        customer_address: `${addr.street}, ${addr.city} - ${addr.pincode}`
      });
      clearCart();
      window.location.href = "order-success.html";
    } catch(err) {
      console.error("EmailJS send error:", err);
      alert("Failed to send order confirmation. Please try again.");
      btn.disabled = false;
      btn.textContent = "Place Order";
      btn.style.opacity = "1";
    }
  });
}

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", ()=>{
  updateCartBadge(loadCart());
  renderProductsPage();
  renderCartPage();
  renderCheckoutPage();
  initCheckoutHandlers();
});

/* keep badge updated if any other tab changes cart */
window.addEventListener("neon:cart:updated", (e)=> updateCartBadge(e.detail.cart));
window.addEventListener("storage", (e)=> { if(e.key === STORAGE_KEYS.cart) updateCartBadge(loadCart()); });
