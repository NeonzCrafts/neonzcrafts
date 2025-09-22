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
  qAll("#cart-count").forEach(el => el.textContent = cnt);
}
function addToCart(id, qty=1){
  const cart = loadCart();
  const idx = cart.findIndex(i=>i.id===id);
  if (idx>=0) cart[idx].qty += qty;
  else cart.push({id, qty});
  saveCart(cart);
}
function removeFromCart(id){
  saveCart(loadCart().filter(i=>i.id!==id));
}

/* ---------- PRODUCT LIST ---------- */
function renderProductsPage(){
  const panel = $("products-panel");
  if (!panel) return;
  panel.innerHTML = "";
  PRODUCTS.forEach(p=>{
    const card=document.createElement("article");
    card.className="product-card";
    card.innerHTML=`
      <div class="product-media" role="button">
        <img src="${p.images[0]}" alt="${p.title}">
      </div>
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

    q(".btn-add", card).addEventListener("click",()=>{
      addToCart(p.id,1);
      window.location.href="cart.html";
    });
    const openModal=()=>openProductModal(p);
    q(".btn-view", card).addEventListener("click",openModal);
    q(".product-media", card).addEventListener("click",openModal);
  });
}

/* ---------- PRODUCT MODAL ---------- */
function openProductModal(p){
  const overlay=document.createElement("div");
  overlay.className="modal-overlay";
  overlay.innerHTML=`
    <div class="modal-dialog">
      <div class="modal-header">
        <h2>${p.title}</h2>
        <button class="modal-close">×</button>
      </div>
      <div class="carousel-container">
        <div class="carousel-images" style="display:flex;overflow-x:auto;scroll-snap-type:x mandatory">
          ${p.images.map(src=>`<img src="${src}" style="min-width:100%;scroll-snap-align:center;">`).join("")}
        </div>
        <div class="carousel-dots"></div>
      </div>
      <div class="modal-info">
        <div class="modal-price">${formatCurrency(p.price)}</div>
        <p>${p.desc}</p>
        <input id="modal-qty" type="number" value="1" min="1">
        <button class="btn btn-primary" id="modal-add">Add to Cart</button>
        <button class="btn btn-secondary" id="modal-buy">Buy Now</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  q(".modal-close",overlay).addEventListener("click",()=>overlay.remove());
  overlay.addEventListener("click",e=>{if(e.target===overlay)overlay.remove();});
  q("#modal-add",overlay).addEventListener("click",()=>{
    addToCart(p.id,Number(q("#modal-qty",overlay).value)||1);
    overlay.remove(); window.location.href="cart.html";
  });
  q("#modal-buy",overlay).addEventListener("click",()=>{
    addToCart(p.id,Number(q("#modal-qty",overlay).value)||1);
    overlay.remove(); window.location.href="checkout.html";
  });
}

/* ---------- CART PAGE ---------- */
function renderCartPage(){
  const panel=$("cart-items");
  if(!panel) return;
  const cart=loadCart(); panel.innerHTML="";
  if(!cart.length){ panel.innerHTML="<p>Your cart is empty.</p>"; updateCartTotals(0); setCheckoutEnabled(false); return; }
  let subtotal=0;
  cart.forEach(item=>{
    const p=PRODUCTS.find(pr=>pr.id===item.id); if(!p)return;
    subtotal+=p.price*item.qty;
    const row=document.createElement("div");
    row.className="cart-item";
    row.innerHTML=`
      <img src="${p.images[0]}" class="cart-thumb">
      <div class="cart-details"><h4>${p.title}</h4>
      <div>${formatCurrency(p.price)} × ${item.qty} = <strong>${formatCurrency(p.price*item.qty)}</strong></div></div>
      <button class="remove-btn btn-sm">Remove</button>
    `;
    q(".remove-btn",row).addEventListener("click",()=>{removeFromCart(item.id);renderCartPage();});
    panel.appendChild(row);
  });
  updateCartTotals(subtotal); setCheckoutEnabled(true);
}

function updateCartBadge(cart){
  const cnt = (cart||[]).reduce((s,i)=>s+(i.qty||0),0);
  qAll("#cart-count").forEach(el => {
    el.textContent = cnt;
    el.classList.remove("bump");
    void el.offsetWidth; // 🔄 restart animation
    el.classList.add("bump");
  });
}

/* ---------- CHECKOUT ---------- */
function updateCartTotals(subtotal){
  const shipping=0;
  const set=(id,val)=>{$(id)&&($(id).textContent=val);};
  set("subtotal-amt",formatCurrency(subtotal));
  set("shipping-amt",shipping===0?"Free":formatCurrency(shipping));
  set("grand-amt",formatCurrency(subtotal+shipping));
}

function renderCheckoutPage(){
  const cart=loadCart();
  const subtotal=cart.reduce((s,it)=>{
    const p=PRODUCTS.find(pr=>pr.id===it.id)||{price:0};
    return s+p.price*it.qty;
  },0);
  updateCartTotals(subtotal);

  const saved=safeParse(localStorage.getItem(STORAGE_KEYS.address),null);
  const form=$("address-form"), summary=$("address-summary"), savedText=$("saved-address-text");
  if(saved && saved.name){
    form.style.display="none"; summary.style.display="block";
    savedText.innerHTML=`<strong>${saved.name}</strong><br>${saved.street}, ${saved.city} - ${saved.pincode}<br>📞 ${saved.phone}`;
  } else { form.style.display=""; summary.style.display="none"; }
}

function initCheckoutHandlers(){
  if(window.emailjs) try{emailjs.init(EMAILJS_PUBLIC_KEY);}catch(e){console.warn("EmailJS init error",e);}
  const form=$("address-form");
  if(form){
    const saved=safeParse(localStorage.getItem(STORAGE_KEYS.address),null);
    if(saved){["name","phone","street","city","pincode"].forEach(f=>form.elements[f].value=saved[f]||"");}
    form.addEventListener("submit",e=>{
      e.preventDefault();
      const data={name:form.name.value.trim(),phone:form.phone.value.trim(),street:form.street.value.trim(),city:form.city.value.trim(),pincode:form.pincode.value.trim()};
      localStorage.setItem(STORAGE_KEYS.address,JSON.stringify(data));
      alert("Address saved"); renderCheckoutPage();
    });
  }
  $("edit-address")?.addEventListener("click",()=>{ $("address-form").style.display=""; $("address-summary").style.display="none"; });
  $("clear-address")?.addEventListener("click",()=>{ localStorage.removeItem(STORAGE_KEYS.address); $("address-form").reset(); $("address-form").style.display=""; $("address-summary").style.display="none"; });
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
          const p = PRODUCTS.find(pr=>pr.id===it.id)||{};
          return `${p.title} × ${it.qty} = ${formatCurrency((p.price||0)*it.qty)}`;
        }).join("\n"),
        order_total: formatCurrency(cart.reduce((s,it)=>{
          const p=PRODUCTS.find(pr=>pr.id===it.id)||{price:0};
          return s+p.price*it.qty;
        },0)),
        customer_name: addr.name,
        customer_phone: addr.phone,
        customer_address: `${addr.street}, ${addr.city} - ${addr.pincode}`
      });

      clearCart();
      window.location.href = "order-success.html";
    } catch (err) {
      console.error("EmailJS error", err);
      alert("Failed to send order confirmation. Please try again.");
      btn.disabled = false;
      btn.textContent = "Place Order";
      btn.style.opacity = "1";
    }
  });
}

/* ---------- INIT ON DOM READY ---------- */
document.addEventListener("DOMContentLoaded",()=>{
  updateCartBadge(loadCart());
  renderProductsPage();
  renderCartPage();
  renderCheckoutPage();
  initCheckoutHandlers();
});

