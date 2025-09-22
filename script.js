/* ---------- CONFIG ---------- */
const EMAILJS_SERVICE = "service_al4zpdb";
const EMAILJS_TEMPLATE = "template_vimeo5m";
const EMAILJS_PUBLIC_KEY = "CRkybtSL0tLoJJ71X";

const STORAGE_KEYS = {
  cart: "neon_cart_v3",
  cartLegacy: "neon_cart_v2",
  address: "neon_address_v3"
};

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
function $(id){ return document.getElementById(id); }
function q(sel, ctx=document){ return ctx.querySelector(sel); }
function qAll(sel, ctx=document){ return Array.from((ctx||document).querySelectorAll(sel)); }
function safeParse(raw, fallback){ try { return JSON.parse(raw||'null') || fallback } catch { return fallback; } }
function formatCurrency(n){ return `₹${Number(n||0).toFixed(0)}`; }

/* ---------- CART STORAGE ---------- */
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
  window.dispatchEvent(new CustomEvent("neon:cart:updated", { detail: { cart } }));
}
function clearCart(){ saveCart([]); }

/* ---------- CART UI ---------- */
function updateCartBadge(cart){
  const cnt = (cart||[]).reduce((s,i)=>s+(i.qty||0),0);
  qAll("#cart-count").forEach(el=>{
    el.textContent=cnt;
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  });
}
function addToCart(id, qty=1){
  const cart=loadCart();
  const idx=cart.findIndex(i=>i.id===id);
  if(idx>=0) cart[idx].qty+=qty;
  else cart.push({id,qty});
  saveCart(cart);
}
function updateQty(id, delta){
  const cart=loadCart();
  const idx=cart.findIndex(i=>i.id===id);
  if(idx>=0){
    cart[idx].qty+=delta;
    if(cart[idx].qty<=0) cart.splice(idx,1);
    saveCart(cart);
    renderCartPage();
  }
}
function removeFromCart(id){
  saveCart(loadCart().filter(i=>i.id!==id));
  renderCartPage();
}

/* ---------- PRODUCT LIST ---------- */
function renderProductsPage(){
  const panel=$("products-panel");
  if(!panel) return;
  panel.innerHTML="";
  if (!PRODUCTS.length) {
    panel.innerHTML = `<p style="text-align:center;color:gray">No products available</p>`;
    return;
  }

  PRODUCTS.forEach(p=>{
    const card=document.createElement("article");
    card.className="product-card";
    card.innerHTML=`
      <div class="product-media"><img src="${p.images[0]}" alt="${p.title}"></div>
      <div class="product-body">
        <div class="product-title">${p.title}</div>
        <div class="price-row">
          ${p.originalPrice?`<div class="price-original">${formatCurrency(p.originalPrice)}</div>`:""}
          <div class="price-current">${formatCurrency(p.price)}</div>
        </div>
        <div class="product-actions">
          <button class="btn btn-primary btn-add">Add</button>
          <button class="btn btn-secondary btn-view">View</button>
        </div>
      </div>
    `;
    panel.appendChild(card);
    q(".btn-add",card).addEventListener("click",()=>{addToCart(p.id,1);window.location.href="cart.html";});
    const openModal=()=>openProductModal(p);
    q(".btn-view",card).addEventListener("click",openModal);
    q(".product-media",card).addEventListener("click",openModal);
  });
}

/* ---------- PRODUCT MODAL ---------- */
function openProductModal(p){
  const overlay=document.createElement("div");
  overlay.className="modal-overlay";
  overlay.innerHTML=`
    <div class="modal-dialog">
      <div class="modal-header"><h2>${p.title}</h2><button class="modal-close">×</button></div>
      <div class="carousel-container">
        <div class="carousel-images" style="display:flex;overflow-x:auto;scroll-snap-type:x mandatory">
          ${p.images.map(src=>`<img src="${src}" style="min-width:100%;scroll-snap-align:center;">`).join("")}
        </div>
      </div>
      <div class="modal-info">
        <div class="modal-price">${formatCurrency(p.price)}</div>
        <p>${p.desc}</p>
        <div class="qty-stepper" style="display:flex;gap:10px;align-items:center;justify-content:center;margin:10px 0;">
          <button id="qty-minus" style="padding:6px 10px;font-size:18px;border-radius:6px;">−</button>
          <span id="qty-value" style="min-width:24px;text-align:center;font-weight:bold;">1</span>
          <button id="qty-plus" style="padding:6px 10px;font-size:18px;border-radius:6px;">+</button>
        </div>
        <div style="display:flex;gap:10px;justify-content:center;margin-top:10px;">
          <button class="btn btn-primary" id="modal-add">Add to Cart</button>
          <button class="btn btn-secondary" id="modal-buy">Buy Now</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  q(".modal-close",overlay).addEventListener("click",()=>overlay.remove());
  overlay.addEventListener("click",e=>{if(e.target===overlay)overlay.remove();});

  let qty=1;
  const qtyValue=q("#qty-value",overlay);
  q("#qty-minus",overlay).addEventListener("click",()=>{if(qty>1){qty--;qtyValue.textContent=qty;}});
  q("#qty-plus",overlay).addEventListener("click",()=>{qty++;qtyValue.textContent=qty;});
  q("#modal-add",overlay).addEventListener("click",()=>{addToCart(p.id,qty);overlay.remove();window.location.href="cart.html";});
  q("#modal-buy",overlay).addEventListener("click",()=>{addToCart(p.id,qty);overlay.remove();window.location.href="checkout.html";});
}

/* ---------- CART PAGE ---------- */
function renderCartPage(){
  const panel=$("cart-items");
  if(!panel) return;
  const cart=loadCart();panel.innerHTML="";
  if(!cart.length){panel.innerHTML="<p>Your cart is empty.</p>";updateCartTotals(0);return;}
  let subtotal=0;
  cart.forEach(item=>{
    const p=PRODUCTS.find(pr=>pr.id===item.id);if(!p)return;
    subtotal+=p.price*item.qty;
    const row=document.createElement("div");
    row.className="cart-item";
    row.innerHTML=`
      <img src="${p.images[0]}" class="cart-thumb">
      <div class="cart-details">
        <h4>${p.title}</h4>
        <div class="qty-controls" style="display:flex;gap:8px;align-items:center;margin:6px 0;">
          <button class="qty-btn minus">−</button>
          <span>${item.qty}</span>
          <button class="qty-btn plus">+</button>
        </div>
        <div><strong>${formatCurrency(p.price*item.qty)}</strong></div>
      </div>
      <button class="remove-btn btn-sm">Remove</button>
    `;
    q(".minus",row).addEventListener("click",()=>updateQty(item.id,-1));
    q(".plus",row).addEventListener("click",()=>updateQty(item.id,1));
    q(".remove-btn",row).addEventListener("click",()=>removeFromCart(item.id));
    panel.appendChild(row);
  });
  updateCartTotals(subtotal);
}

function updateCartTotals(subtotal){
  const shipping=0;
  const set=(id,val)=>{$(id)&&($(id).textContent=val);};
  set("subtotal-amt",formatCurrency(subtotal));
  set("shipping-amt","Free");
  set("grand-amt",formatCurrency(subtotal));
}

/* ---------- CHECKOUT ---------- */
function renderCheckoutPage() {
  const cart = loadCart();
  const subtotal = cart.reduce((s, it) => {
    const p = PRODUCTS.find(pr => pr.id === it.id) || { price: 0 };
    return s + p.price * it.qty;
  }, 0);
  updateCartTotals(subtotal);

  // ✅ Show product list dynamically
  const productPanel = $("checkout-products");
  if (productPanel) {
    productPanel.innerHTML = "";
    if (!cart.length) {
      productPanel.innerHTML = "<p>Your cart is empty.</p>";
    } else {
      cart.forEach(item => {
        const p = PRODUCTS.find(pr => pr.id === item.id);
        if (!p) return;
        const row = document.createElement("div");
        row.className = "checkout-item";
        row.innerHTML = `
          <img src="${p.images[0]}" class="checkout-thumb">
          <div class="checkout-info">
            <div class="checkout-title">${p.title}</div>
            <div class="checkout-meta">Qty: ${item.qty}</div>
          </div>
          <div class="checkout-price">${formatCurrency(p.price * item.qty)}</div>
        `;
        productPanel.appendChild(row);
      });
    }
  }

  // ✅ Address Handling
  const saved = safeParse(localStorage.getItem(STORAGE_KEYS.address), null);
  const form = $("address-form"),
        summary = $("address-summary"),
        savedText = $("saved-address-text");
  if (saved && saved.name) {
    form.style.display = "none";
    summary.style.display = "block";
    savedText.innerHTML = `<strong>${saved.name}</strong><br>${saved.street}, ${saved.city} - ${saved.pincode}<br>📞 ${saved.phone}`;
  } else {
    form.style.display = "";
    summary.style.display = "none";
  }
}

  $("place-order")?.addEventListener("click", async () => {
    const btn = $("place-order");
    const cart = loadCart();
    if (!cart.length) return alert("Your cart is empty.");
    const addr = safeParse(localStorage.getItem(STORAGE_KEYS.address), null);
    if (!addr) return alert("Please save your shipping address.");

    btn.disabled = true;
    btn.textContent = "Placing...";
    btn.style.opacity = "0.7";

    try {
      await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
        order_items: cart.map(it => {
          const p = PRODUCTS.find(pr => pr.id === it.id) || {};
          return `${p.title} × ${it.qty} = ${formatCurrency((p.price || 0) * it.qty)}`;
        }).join("\n"),
        order_total: formatCurrency(cart.reduce((s, it) => {
          const p = PRODUCTS.find(pr => pr.id === it.id) || { price: 0 };
          return s + p.price * it.qty;
        }, 0)),
        customer_name: addr.name,
        customer_phone: addr.phone,
        customer_address: `${addr.street}, ${addr.city} - ${addr.pincode}`
      });

      clearCart();
      alert("✅ Order placed successfully!");
      window.location.href = "order-success.html";
    } catch (err) {
      alert("Failed to send order confirmation. Please try again.");
      btn.disabled = false;
      btn.textContent = "Place Order";
      btn.style.opacity = "1";
    }
  });
}

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded",()=>{
  updateCartBadge(loadCart());
  renderProductsPage();
  renderCartPage();
  renderCheckoutPage();
  initCheckoutHandlers();
});

