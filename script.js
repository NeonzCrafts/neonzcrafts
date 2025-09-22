/* ---------- CONFIG ---------- */
const EMAILJS_SERVICE = "service_al4zpdb";
const EMAILJS_TEMPLATE = "template_vimeo5m";
const EMAILJS_PUBLIC_KEY = "CRkybtSL0tLoJJ71X";

const STORAGE_KEYS = {
  cart: "neon_cart_v3",
  cartLegacy: "neon_cart_v2",
  address: "neon_address_v3",
  pendingOrders: "neon_orders_pending_v1"
};

/* ---------- PRODUCTS (demo) ---------- */
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
    title: "Stacking Rings for Toddlers",
    price: 249,
    originalPrice: 349,
    images: ["1000069560.jpg","1000069561.jpg"],
    desc: "Classic stacking rings — bright colors and safe edges."
  },
  {
    id: "p3",
    title: "Counting Shapes Pack",
    price: 199,
    originalPrice: 249,
    images: ["1000069561.jpg","1000069559.jpg"],
    desc: "Stackable shapes that teach counting and colors."
  }
];

/* ---------- HELPERS ---------- */
function $(id){ return document.getElementById(id); }
function q(sel, ctx=document){ return ctx.querySelector(sel); }
function qAll(sel, ctx=document){ return Array.from((ctx||document).querySelectorAll(sel)); }
function safeParse(raw, fallback){ try { return JSON.parse(raw||'null') || fallback } catch { return fallback; } }
function formatCurrency(n){ return `₹${Number(n||0).toFixed(0)}`; }
function pct(off, orig, cur) {
  if(!orig || orig <= cur) return "";
  const p = Math.round(((orig - cur) / orig) * 100);
  return `-${p}%`;
}

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

/* ---------- UI - Cart Badge ---------- */
function updateCartBadge(cart){
  const cnt = (cart||[]).reduce((s,i)=>s+(i.qty||0),0);
  qAll("#cart-count").forEach(el=>{
    el.textContent=cnt;
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  });
}

/* ---------- CART MUTATIONS ---------- */
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
    renderCheckoutPage();
  }
}
function removeFromCart(id){
  saveCart(loadCart().filter(i=>i.id!==id));
  renderCartPage();
  renderCheckoutPage();
}

/* ---------- RENDER PRODUCTS (index.html) ---------- */
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
      <div class="product-media">
        ${p.originalPrice ? `<div class="discount-badge">${pct(p.originalPrice,p.originalPrice,p.price)}</div>` : ""}
        <img src="${p.images[0]}" alt="${p.title}">
      </div>
      <div class="product-body">
        <div class="product-title">${p.title}</div>
        <div class="price-row">
          ${p.originalPrice?`<div class="price-original">${formatCurrency(p.originalPrice)}</div>`:""}
          <div class="price-current">${formatCurrency(p.price)}</div>
        </div>
        <div class="product-actions">
          <button class="btn btn-primary add-btn" data-id="${p.id}">Add</button>
          <button class="btn btn-secondary view-btn" data-id="${p.id}">View</button>
        </div>
      </div>
    `;
    panel.appendChild(card);
  });

  // delegated clicks for add & view
  panel.addEventListener('click', e=>{
    const add = e.target.closest('.add-btn');
    if(add){ addToCart(add.dataset.id,1); window.location.href = "cart.html"; return; }
    const view = e.target.closest('.view-btn');
    if(view){ const p = PRODUCTS.find(x=>x.id===view.dataset.id); if(p) openProductModal(p); return; }
    const media = e.target.closest('.product-media img');
    if(media){ // open product by clicking image
      const parentCard = e.target.closest('.product-card');
      const idBtn = parentCard && parentCard.querySelector('.view-btn');
      if(idBtn) { const p = PRODUCTS.find(x=>x.id===idBtn.dataset.id); if(p) openProductModal(p); }
    }
  });
}

/* ---------- PRODUCT MODAL (horizontal carousel + drag) ---------- */
function openProductModal(p){
  const overlay=document.createElement("div");
  overlay.className="modal-overlay";
  overlay.innerHTML=`
    <div class="modal-dialog" role="dialog" aria-modal="true">
      <div class="modal-header">
        <div style="font-weight:700;font-size:1.1rem">${p.title}</div>
        <button class="modal-close" aria-label="Close">×</button>
      </div>

      <div class="carousel-container">
        <div class="carousel-images" style="scroll-snap-type:x mandatory; -webkit-overflow-scrolling:touch;">
          ${p.images.map(src=>`<img src="${src}" alt="${p.title}" class="modal-image">`).join("")}
        </div>
      </div>

      <div class="modal-info">
        <div class="modal-price">${formatCurrency(p.price)}</div>
        <p>${p.desc}</p>

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

  // close handlers
  q(".modal-close",overlay).addEventListener("click",()=>overlay.remove());
  overlay.addEventListener("click",e=>{ if(e.target===overlay) overlay.remove(); });

  // limit image sizes via CSS (styles.css) ensures they won't overflow

  // quantity logic
  let qty=1;
  const qtyValue=q("#qty-value",overlay);
  q("#qty-minus",overlay).addEventListener("click",()=>{ if(qty>1){ qty--; qtyValue.textContent=qty; }});
  q("#qty-plus",overlay).addEventListener("click",()=>{ qty++; qtyValue.textContent=qty; });

  q("#modal-add",overlay).addEventListener("click",()=>{ addToCart(p.id,qty); overlay.remove(); window.location.href="cart.html"; });
  q("#modal-buy",overlay).addEventListener("click",()=>{ addToCart(p.id,qty); overlay.remove(); window.location.href="checkout.html"; });

  // horizontal dragging for carousel (mouse + touch)
  const carousel = q(".carousel-images", overlay);
  if(carousel){
    carousel.style.cursor = "grab";
    let isDown = false, startX = 0, scrollLeft = 0;
    const onDown = (pageX) => { isDown=true; carousel.classList.add('dragging'); startX = pageX - carousel.offsetLeft; scrollLeft = carousel.scrollLeft; carousel.style.cursor='grabbing'; };
    const onMove = (pageX) => { if(!isDown) return; const x = pageX - carousel.offsetLeft; const walk = (x - startX) * 1.5; carousel.scrollLeft = scrollLeft - walk; };
    const onUp = ()=>{ isDown=false; carousel.classList.remove('dragging'); carousel.style.cursor='grab'; };

    // mouse
    carousel.addEventListener('mousedown', e => onDown(e.pageX));
    window.addEventListener('mousemove', e => onMove(e.pageX));
    window.addEventListener('mouseup', onUp);

    // touch
    carousel.addEventListener('touchstart', e => onDown(e.touches[0].pageX), {passive: true});
    carousel.addEventListener('touchmove', e => { onMove(e.touches[0].pageX); }, {passive:false});
    carousel.addEventListener('touchend', onUp);
  }
}

/* ---------- CART PAGE ---------- */
function renderCartPage(){
  const panel=$("cart-items");
  if(!panel) return;
  const cart=loadCart();
  panel.innerHTML="";
  if(!cart.length){
    panel.innerHTML="<p>Your cart is empty.</p>";
    updateCartTotals(0);
    return;
  }
  let subtotal=0;
  cart.forEach(item=>{
    const p=PRODUCTS.find(pr=>pr.id===item.id); if(!p) return;
    subtotal+=p.price*item.qty;
    const row=document.createElement("div");
    row.className="cart-item";
    row.dataset.id = item.id;
    row.innerHTML=`
      <img src="${p.images[0]}" class="cart-thumb" alt="${p.title}">
      <div style="flex:1;">
        <div style="font-weight:600">${p.title}</div>
        <div style="color:#666;margin:6px 0;">Qty: ${item.qty}</div>
        <div style="font-weight:700">${formatCurrency(p.price * item.qty)}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
        <div style="display:flex;gap:8px;">
          <button class="qty-btn minus" aria-label="minus">−</button>
          <div style="min-width:26px;text-align:center">${item.qty}</div>
          <button class="qty-btn plus" aria-label="plus">+</button>
        </div>
        <button class="remove-btn" aria-label="remove">Remove</button>
      </div>
    `;
    panel.appendChild(row);
  });
  updateCartTotals(subtotal);
}

/* ---------- UPDATE TOTALS (used by cart & checkout) ---------- */
function updateCartTotals(subtotal){
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

  // product list in checkout
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
        row.dataset.id = item.id;
        row.innerHTML = `
          <img src="${p.images[0]}" class="checkout-thumb" alt="${p.title}">
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

  const saved = safeParse(localStorage.getItem(STORAGE_KEYS.address), null);
  const form = $("address-form"),
        summary = $("address-summary"),
        savedText = $("saved-address-text");
  if (form && summary && savedText) {
    if (saved && saved.name) {
      form.style.display = "none"; summary.style.display = "block";
      savedText.innerHTML = `<strong>${saved.name}</strong><br>${saved.street}, ${saved.city} - ${saved.pincode}<br>📞 ${saved.phone}`;
    } else {
      form.style.display = ""; summary.style.display = "none";
    }
  }
}

/* ---------- HANDLERS & DELEGATION ---------- */
function initHandlers(){
  // EmailJS init (if loaded)
  if(window.emailjs){
    try{ emailjs.init(EMAILJS_PUBLIC_KEY); }catch(e){ console.warn("EmailJS init", e); }
  }

  // Cart item clicks (delegated) - works after re-render
  const cartPanel = $("cart-items");
  if(cartPanel){
    cartPanel.addEventListener('click', (e)=>{
      const row = e.target.closest('.cart-item');
      if(!row) return;
      const id = row.dataset.id;
      if(e.target.closest('.qty-btn.minus')){ updateQty(id,-1); }
      else if(e.target.closest('.qty-btn.plus')){ updateQty(id,1); }
      else if(e.target.classList.contains('remove-btn')){ removeFromCart(id); }
    });
  }

  // Delegated clicks for checkout product thumbnails (open modal)
  const checkoutPanel = $("checkout-products");
  if(checkoutPanel){
    checkoutPanel.addEventListener('click', e=>{
      const row = e.target.closest('.checkout-item');
      if(!row) return;
      const id = row.dataset.id;
      const p = PRODUCTS.find(pr => pr.id === id);
      if(p) openProductModal(p);
    });
  }

  // Address form submission
  const form = $("address-form");
  if(form){
    const saved = safeParse(localStorage.getItem(STORAGE_KEYS.address), null);
    if (saved) ["name","phone","street","city","pincode"].forEach(f => form.elements[f] && (form.elements[f].value = saved[f] || ""));
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
      // instant update
      renderCheckoutPage();
    });
  }

  // delegated for edit / clear address (works even if buttons are added later)
  document.addEventListener('click', e=>{
    if(e.target && e.target.id === "edit-address"){
      const f = $("address-form"); if(f) { f.style.display = "block"; $("address-summary") && ($("address-summary").style.display = "none"); }
    }
    if(e.target && e.target.id === "clear-address"){
      localStorage.removeItem(STORAGE_KEYS.address);
      const f = $("address-form"); if(f) { f.reset(); f.style.display="block"; }
      $("address-summary") && ($("address-summary").style.display = "none");
    }
  });

  // Place order handling (robust)
  document.addEventListener('click', async (e)=>{
    if(!(e.target && e.target.id === "place-order")) return;
    const btn = $("place-order");
    const cart = loadCart();
    if (!cart.length) return alert("Your cart is empty.");
    const addr = safeParse(localStorage.getItem(STORAGE_KEYS.address), null);
    if (!addr) return alert("Please save your shipping address.");

    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = "Placing...";
    btn.style.opacity = "0.7";

    const order_items = cart.map(it=>{
      const p = PRODUCTS.find(pr=>pr.id===it.id)||{};
      return `${p.title} × ${it.qty} = ${formatCurrency((p.price||0)*it.qty)}`;
    }).join("\n");
    const order_total = formatCurrency(cart.reduce((s,it)=> s + ((PRODUCTS.find(pr=>pr.id===it.id)||{price:0}).price * it.qty), 0));

    // Try EmailJS; on failure fallback to saving order locally (so you don't lose it)
    let emailOk = false;
    try{
      if(window.emailjs && emailjs.send){
        await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
          order_items, order_total, customer_name: addr.name, customer_phone: addr.phone, customer_address: `${addr.street}, ${addr.city} - ${addr.pincode}`
        });
        emailOk = true;
      } else {
        console.warn("EmailJS not available on page.");
      }
    }catch(err){
      console.warn("EmailJS send failed:", err);
    }

    if(!emailOk){
      // save pending order to localStorage so you can pick up later
      const pending = safeParse(localStorage.getItem(STORAGE_KEYS.pendingOrders), []);
      pending.push({
        id: "o_"+Date.now(),
        items: cart,
        total: order_total,
        address: addr,
        createdAt: new Date().toISOString(),
        emailSent: false
      });
      localStorage.setItem(STORAGE_KEYS.pendingOrders, JSON.stringify(pending));
      // Notify user but proceed
      alert("Order saved locally (email failed). We'll keep a copy and still complete checkout.");
    }

    // finalize order: clear cart and go to success page
    clearCart();
    window.location.href = "order-success.html";
  });
}

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", ()=>{
  updateCartBadge(loadCart());
  renderProductsPage();
  renderCartPage();
  renderCheckoutPage();
  initHandlers();
});
