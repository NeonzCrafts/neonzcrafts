/* script.js — full client JS: products, cart, modal, checkout, EmailJS */
/* ---------- CONFIG (kept your EmailJS values) ---------- */
const EMAILJS_SERVICE = "service_al4zpdb";
const EMAILJS_TEMPLATE = "template_vimeo5m";
const EMAILJS_PUBLIC_KEY = "CRkybtSL0tLoJJ71X";

const STORAGE_KEYS = {
  cart: "neon_cart_v3",
  address: "neon_address_v3"
};

/* ---------- PRODUCTS ---------- */
const PRODUCTS = [
  {
    id: "p1",
    title: "Educational Geometric Shape Toy",
    price: 299,
    originalPrice: 399,
    images: ["1000069559.jpg","1000069560.jpg","1000069561.jpg"],
    desc: "Interactive and colorful shape toy to improve cognitive skills for toddlers."
  }
];

/* ---------- HELPERS ---------- */
const $ = id => document.getElementById(id);
const q = (sel, ctx=document) => ctx.querySelector(sel);
const qAll = (sel, ctx=document) => Array.from((ctx||document).querySelectorAll(sel));
const safeParse = (r, f) => { try { return JSON.parse(r||'null')||f } catch { return f } };
const formatCurrency = n => `₹${Number(n||0).toFixed(0)}`;

/* ---------- STORAGE ---------- */
function loadCart(){
  return safeParse(localStorage.getItem(STORAGE_KEYS.cart), []);
}
function saveCart(cart){
  localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
  updateCartBadge(cart);
  window.dispatchEvent(new CustomEvent("neon:cart:updated",{detail:{cart}}));
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

/* add / update */
function addToCart(id, qty=1){
  const cart = loadCart();
  const idx = cart.findIndex(i => i.id===id);
  if(idx>=0) cart[idx].qty += qty;
  else cart.push({id, qty});
  saveCart(cart);
}
function setQty(id, qty){
  const cart = loadCart();
  const idx = cart.findIndex(i=>i.id===id);
  if(idx>=0){
    cart[idx].qty = qty;
    if(cart[idx].qty <= 0) cart.splice(idx,1);
    saveCart(cart);
  }
}
function updateQty(id, delta){
  const cart = loadCart();
  const idx = cart.findIndex(i=>i.id===id);
  if(idx>=0){
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

/* ---------- PRODUCTS RENDER ---------- */
function renderProductsPage(){
  const panel = $("products-panel"); if(!panel) return;
  panel.innerHTML = "";
  if(!PRODUCTS.length){ panel.innerHTML = `<p class="center muted">No products available</p>`; return; }
  PRODUCTS.forEach(p=>{
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-media"><img src="${p.images[0]}" alt="${p.title}"></div>
      <div class="product-body">
        <div class="product-title">${p.title}</div>
        <div class="price-row">
          ${p.originalPrice?`<div class="price-original">${formatCurrency(p.originalPrice)}</div>`:""}
          <div class="price-current">${formatCurrency(p.price)}</div>
        </div>
        <div class="action-row">
          <button class="btn btn-primary btn-add">Add</button>
          <button class="btn btn-outline btn-view">View</button>
        </div>
      </div>
    `;
    panel.appendChild(card);
    q(".btn-add", card).addEventListener("click", ()=> { addToCart(p.id,1); location.href="cart.html"; });
    const openModal = ()=> openProductModal(p);
    q(".btn-view", card).addEventListener("click", openModal);
    q(".product-media", card).addEventListener("click", openModal);
  });
}

/* ---------- PRODUCT MODAL ---------- */
function openProductModal(p){
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-dialog" role="dialog" aria-modal="true" aria-label="${p.title}">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:6px">
        <strong style="font-size:1.15rem">${p.title}</strong>
        <button class="icon-btn modal-close" aria-label="Close">✕</button>
      </div>
      <div class="modal-body">
        <div class="modal-gallery">
          ${p.images.map(src=>`<img src="${src}" alt="${p.title}" />`).join("")}
        </div>
        <div class="modal-info">
          <div style="font-weight:800; margin-bottom:8px">${formatCurrency(p.price)}</div>
          <div class="small muted" style="margin-bottom:14px">${p.desc}</div>
          <div class="qty-stepper" style="margin-bottom:14px">
            <div class="stepper">
              <button class="qty-minus">−</button>
              <div class="qty" id="modal-qty">1</div>
              <button class="qty-plus">+</button>
            </div>
          </div>
          <div style="display:flex; gap:10px">
            <button class="btn btn-primary" id="modal-add">Add to Cart</button>
            <button class="btn btn-outline" id="modal-buy">Buy Now</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // close handlers
  q(".modal-close", overlay).addEventListener("click", ()=> overlay.remove());
  overlay.addEventListener("click", (e)=> { if(e.target === overlay) overlay.remove(); });

  // qty logic
  let qty = 1;
  q(".qty-minus", overlay).addEventListener("click", ()=> { if(qty>1) { qty--; $("modal-qty").textContent = qty; } });
  q(".qty-plus", overlay).addEventListener("click", ()=> { qty++; $("modal-qty").textContent = qty; });

  q("#modal-add", overlay).addEventListener("click", ()=> { addToCart(p.id, qty); overlay.remove(); location.href="cart.html"; });
  q("#modal-buy", overlay).addEventListener("click", ()=> { addToCart(p.id, qty); overlay.remove(); location.href="checkout.html"; });

  // Make gallery images horizontally scrollable on small screens
  // (they are stacked and constrained by CSS)
}

/* ---------- CART PAGE ---------- */
function renderCartPage(){
  const panel = $("cart-items"); if(!panel) return;
  const cart = loadCart(); panel.innerHTML = "";
  if(!cart.length){ panel.innerHTML = "<p class='muted'>Your cart is empty.</p>"; updateCartTotals(0); return; }
  let subtotal = 0;
  cart.forEach(item=>{
    const p = PRODUCTS.find(r=>r.id===item.id); if(!p) return;
    subtotal += p.price * item.qty;
    const row = document.createElement("div"); row.className = "cart-item";
    row.innerHTML = `
      <img src="${p.images[0]}" class="cart-thumb" alt="${p.title}">
      <div class="cart-details">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px">
          <div><strong>${p.title}</strong><div class="small muted">${formatCurrency(p.price)}</div></div>
          <div style="text-align:right"><strong>${formatCurrency(p.price * item.qty)}</strong></div>
        </div>
        <div class="qty-controls">
          <div class="stepper">
            <button class="minus">−</button>
            <div class="qty">${item.qty}</div>
            <button class="plus">+</button>
          </div>
          <button class="btn btn-outline" style="margin-left:10px" data-remove="${p.id}">Remove</button>
        </div>
      </div>
    `;
    q(".minus", row).addEventListener("click", ()=> updateQty(item.id, -1));
    q(".plus", row).addEventListener("click", ()=> updateQty(item.id, 1));
    q("[data-remove]", row).addEventListener("click", ()=> removeFromCart(p.id));
    panel.appendChild(row);
  });
  updateCartTotals(subtotal);
}

/* totals area */
function updateCartTotals(subtotal){
  const set = (id, val) => { const el=$(`#${id}`); if(el) el.textContent = val; };
  set("subtotal-amt", formatCurrency(subtotal));
  set("shipping-amt", subtotal === 0 ? "Free" : "Free");
  set("grand-amt", formatCurrency(subtotal));
}

/* ---------- CHECKOUT ---------- */
function renderCheckoutPage(){
  // product list in checkout
  const productPanel = $("checkout-products");
  const cart = loadCart();
  if(productPanel){
    productPanel.innerHTML = "";
    if(!cart.length) productPanel.innerHTML = "<p class='muted'>No items in cart.</p>";
    else {
      cart.forEach(it => {
        const p = PRODUCTS.find(pr=>pr.id===it.id); if(!p) return;
        const row = document.createElement("div"); row.className = "checkout-item";
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

  // totals
  const subtotal = cart.reduce((s,it)=> {
    const p = PRODUCTS.find(pr=>pr.id===it.id) || {price:0};
    return s + p.price * it.qty;
  }, 0);
  updateCartTotals(subtotal);

  // address saved handling
  const saved = safeParse(localStorage.getItem(STORAGE_KEYS.address), null);
  const form = $("address-form"), summary = $("address-summary"), savedText = $("saved-address-text");
  if(form && summary && savedText){
    if(saved && saved.name){
      form.style.display = "none";
      summary.style.display = "block";
      savedText.innerHTML = `<strong>${saved.name}</strong><br>${saved.street}, ${saved.city} - ${saved.pincode}<br>📞 ${saved.phone}`;
    } else {
      form.style.display = "";
      summary.style.display = "none";
    }
  }
}

/* initialize checkout handlers */
function initCheckoutHandlers(){
  // init emailjs if present
  if(window.emailjs) try{ emailjs.init(EMAILJS_PUBLIC_KEY); } catch(e){ console.warn(e); }

  const form = $("address-form");
  if(form){
    const saved = safeParse(localStorage.getItem(STORAGE_KEYS.address), null);
    if(saved){
      ["name","phone","street","city","pincode"].forEach(f => { if(form.elements[f]) form.elements[f].value = saved[f] || ""; });
    }
    form.addEventListener("submit", e => {
      e.preventDefault();
      const data = {
        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
        street: form.street.value.trim(),
        city: form.city.value.trim(),
        pincode: form.pincode.value.trim()
      };
      localStorage.setItem(STORAGE_KEYS.address, JSON.stringify(data));
      renderCheckoutPage();
    });
  }

  $("edit-address")?.addEventListener("click", ()=>{
    const form = $("address-form"), summary = $("address-summary");
    if(form && summary){ form.style.display = ""; summary.style.display = "none"; }
  });

  $("clear-address")?.addEventListener("click", ()=>{
    localStorage.removeItem(STORAGE_KEYS.address);
    const form = $("address-form"), summary = $("address-summary");
    if(form){ form.reset(); form.style.display=""; }
    if(summary) summary.style.display = "none";
  });

  $("place-order")?.addEventListener("click", async ()=>{
    const btn = $("place-order");
    const cart = loadCart();
    if(!cart.length) return alert("Your cart is empty.");
    const addr = safeParse(localStorage.getItem(STORAGE_KEYS.address), null);
    if(!addr) return alert("Please save your shipping address.");

    btn.disabled = true; btn.textContent = "Placing..."; btn.style.opacity = "0.7";
    try{
      // prepare payload
      const orderItems = cart.map(it => {
        const p = PRODUCTS.find(pr=>pr.id===it.id) || {};
        return `${p.title} × ${it.qty} = ${formatCurrency((p.price||0)*it.qty)}`;
      }).join("\n");

      const orderTotal = cart.reduce((s,it) => {
        const p = PRODUCTS.find(pr=>pr.id===it.id) || {price:0};
        return s + p.price * it.qty;
      }, 0);

      await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
        order_items: orderItems,
        order_total: formatCurrency(orderTotal),
        customer_name: addr.name,
        customer_phone: addr.phone,
        customer_address: `${addr.street}, ${addr.city} - ${addr.pincode}`
      });

      clearCart();
      location.href = "order-success.html";
    } catch(err){
      console.error("EmailJS error:", err);
      alert("Failed to send order confirmation. Please try again.");
      btn.disabled = false; btn.textContent = "Place Order"; btn.style.opacity = "1";
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
