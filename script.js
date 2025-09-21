// script.js (complete)

// ===== CONFIG =====
const EMAILJS_SERVICE_ID = "service_al4zpdb";
const EMAILJS_TEMPLATE_ID = "template_vimeo5m";
const EMAILJS_PUBLIC_KEY = "CRkybtSL0tLoJJ71X";

// ----- FIREBASE (compat/CDN) -----
// Your Firebase config (you provided earlier). This file **assumes** you included
// the compat CDN scripts in index.html (firebase-app-compat.js and firebase-firestore-compat.js).
const firebaseConfig = {
  apiKey: "AIzaSyA3s-XIr-fTke9O4TdimgRTa7GiJBmZ5qU",
  authDomain: "neonzcrafts.firebaseapp.com",
  projectId: "neonzcrafts",
  storageBucket: "neonzcrafts.firebasestorage.app",
  messagingSenderId: "106178899434",
  appId: "1:106178899434:web:98c147b399657c1f559693",
  measurementId: "G-KFSKZW04YS"
};

let db = null;
try {
  if (typeof firebase !== "undefined" && firebase && firebase.initializeApp) {
    firebase.initializeApp(firebaseConfig);
    if (firebase.firestore) {
      db = firebase.firestore();
      console.info("Firestore initialized (compat)");
    } else {
      console.warn("Firestore not available on firebase object.");
    }
  } else {
    console.warn("Firebase not found. Firestore disabled. (If you want Firestore, add compat CDN scripts in index.html)");
  }
} catch (err) {
  console.error("Firebase init error:", err);
  db = null;
}

// ===== SIMPLE STORE SCRIPT =====

// Helper
const el = (id) => document.getElementById(id);

// ===== PRODUCTS =====
const PRODUCTS = [
  {
    id: "p1",
    title: "Educational Geometric Shape Sorting Toy",
    originalPrice: 399,
    price: 199,
    images: ["https://via.placeholder.com/420x300?text=Product"],
    description: "A fun Montessori toy to learn colors & shapes."
  }
];

// ===== CART =====
let cart = {};

function formatPrice(v) { return Number(v).toFixed(2); }
function getShortTitle(title, max = 40) {
  return title.length > max ? title.substring(0, max) + "..." : title;
}

function addToCart(id, qty = 1) {
  cart[id] = (cart[id] || 0) + qty;
  updateCartUI();
}

function cartItems() {
  return Object.entries(cart).map(([id, qty]) => ({
    ...PRODUCTS.find(p => p.id === id),
    qty
  }));
}

function cartTotal() {
  return cartItems().reduce((sum, i) => sum + i.price * i.qty, 0);
}

function updateCartUI() {
  if (el("cart-count"))
    el("cart-count").textContent = Object.values(cart).reduce((a, b) => a + b, 0);

  const itemsDiv = el("cart-items");
  if (!itemsDiv) return;

  itemsDiv.innerHTML = "";
  const items = cartItems();

  if (el("cart-total"))
    el("cart-total").textContent = formatPrice(cartTotal());

  if (items.length === 0) {
    itemsDiv.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  items.forEach(it => {
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <img src="${it.images[0]}" alt="${it.title}">
      <div style="flex:1">
        <div><strong>${getShortTitle(it.title)}</strong></div>
        <div class="price">₹${formatPrice(it.price)}</div>
      </div>
      <div class="cart-quantity-pill">
        <span class="qty">${it.qty}</span>
      </div>
    `;
    itemsDiv.appendChild(div);
  });
}

// ===== PRODUCTS LIST =====
function renderProducts() {
  const container = el("products");
  if (!container) return;

  const grid = document.createElement("div");
  grid.className = "products-grid";

  PRODUCTS.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${p.images[0]}" alt="${p.title}">
      <h3>${p.title}</h3>
      <p>${p.description}</p>
      <div class="price">
        <span class="original-price">₹${formatPrice(p.originalPrice)}</span>
        ₹${formatPrice(p.price)}
      </div>
      <button onclick="addToCart('${p.id}')">Add to Cart</button>
    `;
    grid.appendChild(card);
  });

  container.innerHTML = "<h2>Products</h2>";
  container.appendChild(grid);
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  updateCartUI();
});
];

// default reviews
let REVIEWS = [
  { name: "Priya S.", text: "The product quality is amazing! I am so happy with my purchase.", rating: 5 },
  { name: "Amit V.", text: "Fast delivery and excellent customer service. Highly recommend!", rating: 5 },
  { name: "Sneha R.", text: "A great buy. The product exceeded my expectations.", rating: 4 }
];

// ===== HELPERS =====
const el = (id) => document.getElementById(id);
const placeholderImg = "https://via.placeholder.com/420x300?text=Product";

function formatPrice(v) { return Number(v).toFixed(2); }
function getShortTitle(title, maxLength = 50) { return title.length > maxLength ? title.substring(0, maxLength) + "..." : title; }

let cart = {};
let addresses = [];
let selectedAddressIndex = null;

// ===== ADDRESSES (localStorage) =====
function loadAddresses() {
  try {
    const raw = localStorage.getItem("addresses");
    if (raw) { addresses = JSON.parse(raw); }
    const idx = localStorage.getItem("selectedAddressIndex");
    selectedAddressIndex = (idx !== null && idx !== "") ? parseInt(idx, 10) : null;
  } catch (err) {
    console.warn("Error reading addresses from localStorage:", err);
    addresses = []; selectedAddressIndex = null;
  }
  updateLoginState();
}
function saveAddresses() {
  localStorage.setItem("addresses", JSON.stringify(addresses));
  localStorage.setItem("selectedAddressIndex", selectedAddressIndex !== null ? selectedAddressIndex : "");
  updateLoginState();
}
function updateLoginState() {
  const userDisplay = el("user-display");
  const loginBtn = el("login-btn");
  if (!userDisplay || !loginBtn) return;
  if (addresses.length > 0) {
    userDisplay.textContent = `Welcome, ${addresses[0].name}!`;
    userDisplay.classList.remove("hidden");
    loginBtn.textContent = "Log Out";
  } else {
    userDisplay.textContent = "";
    userDisplay.classList.add("hidden");
    loginBtn.textContent = "Log In";
  }
}

// ===== PRODUCTS UI =====
function renderProducts() {
  const container = el("products");
  if (!container) { console.error("#products element not found in HTML"); return; }
  const grid = document.createElement("div");
  grid.className = "products-grid";
  PRODUCTS.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";
    card.setAttribute("onclick", `showProductDetail('${p.id}')`);
    const imgSrc = p.images && p.images.length ? p.images[0] : placeholderImg;
    // img onerror fallback ensures display even if local file missing
    const imgHtml = `<img src="${imgSrc}" alt="${escapeHtml(p.title)}" onerror="this.onerror=null;this.src='${placeholderImg}';">`;
    const priceDisplay = p.originalPrice ? `<span class="original-price">₹${formatPrice(p.originalPrice)}</span> ₹${formatPrice(p.price)} <span class="sale-tag">Sale</span>` : `₹${formatPrice(p.price)}`;
    card.innerHTML = `${imgHtml}<h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.description)}</p><div class="price">${priceDisplay}</div>`;
    grid.appendChild(card);
  });
  container.innerHTML = "<h2>Products</h2>";
  container.appendChild(grid);
}

// simple HTML escaper for safety
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[s]));
}

// ===== PRODUCT DETAIL =====
function showProductDetail(id) {
  const product = PRODUCTS.find(x => x.id === id);
  if (!product) { console.warn("Product not found:", id); return; }
  el("products").classList.add("hidden");
  el("product-detail").classList.remove("hidden");
  const contentDiv = el("product-detail-content");
  const galleryHtml = (product.images || []).map(imgUrl => `<img src="${imgUrl}" alt="thumb" onclick="changeMainImage('${imgUrl}')" onerror="this.onerror=null;this.src='${placeholderImg}';">`).join("");
  const priceDisplay = product.originalPrice ? `<span class="original-price">₹${formatPrice(product.originalPrice)}</span> ₹${formatPrice(product.price)} <span class="sale-tag">Sale</span>` : `₹${formatPrice(product.price)}`;
  contentDiv.innerHTML = `
    <div class="product-details-container">
      <div class="product-image-section">
        <img src="${product.images[0] || placeholderImg}" alt="${escapeHtml(product.title)}" id="main-product-image" onerror="this.onerror=null;this.src='${placeholderImg}';">
        <div class="thumbnail-gallery">${galleryHtml}</div>
      </div>
      <div class="product-info-section">
        <h2>${escapeHtml(product.title)}</h2>
        <div class="price">${priceDisplay}</div>
        <p>${escapeHtml(product.description)}</p>
        <div class="quantity-selector-pill">
          <button onclick="changeQtyOnDetail(-1)">-</button>
          <span id="detail-qty">1</span>
          <button onclick="changeQtyOnDetail(1)">+</button>
        </div>
        <button class="checkout-btn" onclick="addToCartAndCheckout('${product.id}')">BUY NOW</button>
        <button class="add-to-cart-btn small" onclick="addToCart('${product.id}', Number(el('detail-qty').textContent))">Add to cart</button>
      </div>
    </div>
  `;
  const firstThumb = contentDiv.querySelector(".thumbnail-gallery img");
  if (firstThumb) firstThumb.classList.add("active");
  renderReviews();
}
function changeMainImage(imgUrl) {
  const main = el("main-product-image");
  if (main) main.src = imgUrl;
  document.querySelectorAll("#product-detail-content .thumbnail-gallery img").forEach(img => img.classList.remove("active"));
  const thumbs = Array.from(document.querySelectorAll("#product-detail-content .thumbnail-gallery img"));
  const active = thumbs.find(t => t.getAttribute("src") === imgUrl || t.src === (new URL(imgUrl, location.href).href));
  if (active) active.classList.add("active");
}
function changeQtyOnDetail(delta) {
  const q = el("detail-qty");
  if (!q) return;
  let n = Number(q.textContent) || 1;
  n += delta;
  if (n < 1) n = 1;
  q.textContent = n;
}
function addToCartAndCheckout(id) {
  const qty = Number(el("detail-qty").textContent) || 1;
  addToCart(id, qty);
  if (el("view-cart")) el("view-cart").click();
}

// ===== CART =====
function addToCart(id, qty = 1) { cart[id] = (cart[id] || 0) + qty; updateCartUI(); }
function removeFromCart(id) { delete cart[id]; updateCartUI(); }
function changeQty(id, qty) { if (qty <= 0) removeFromCart(id); else { cart[id] = qty; updateCartUI(); } }
function cartItems() { return Object.entries(cart).map(([id, qty]) => ({ ...PRODUCTS.find(x => x.id === id), qty })); }
function cartTotal() { return cartItems().reduce((s, i) => s + (i.price || 0) * i.qty, 0); }

function updateCartUI() {
  const count = Object.values(cart).reduce((a,b) => a + b, 0);
  if (el("cart-count")) el("cart-count").textContent = count;
  if (!el("cart-items")) return;
  const itemsDiv = el("cart-items"); itemsDiv.innerHTML = "";
  const items = cartItems();
  if (el("cart-total")) el("cart-total").textContent = formatPrice(cartTotal());
  if (items.length === 0) {
    itemsDiv.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }
  items.forEach(it => {
    const div = document.createElement("div"); div.className = "cart-item";
    div.innerHTML = `
      <img src="${it.images && it.images[0] ? it.images[0] : placeholderImg}" alt="${escapeHtml(it.title)}" onerror="this.onerror=null;this.src='${placeholderImg}';">
      <div style="flex:1">
        <div><strong>${escapeHtml(getShortTitle(it.title))}</strong></div>
        <div class="price">₹${formatPrice(it.price)}</div>
      </div>
      <div class="cart-quantity-pill">
        <button class="small dec" data-id="${it.id}">-</button>
        <span class="qty">${it.qty}</span>
        <button class="small inc" data-id="${it.id}">+</button>
        <button class="remove-from-cart-btn" data-id="${it.id}"><span class="material-symbols-outlined">delete</span></button>
      </div>
    `;
    itemsDiv.appendChild(div);
  });
  itemsDiv.querySelectorAll(".inc").forEach(b => b.onclick = e => changeQty(e.currentTarget.dataset.id, cart[e.currentTarget.dataset.id] + 1));
  itemsDiv.querySelectorAll(".dec").forEach(b => b.onclick = e => changeQty(e.currentTarget.dataset.id, cart[e.currentTarget.dataset.id] - 1));
  itemsDiv.querySelectorAll(".remove-from-cart-btn").forEach(b => b.onclick = e => removeFromCart(e.currentTarget.dataset.id));
}

// ===== CHECKOUT & ADDRESSES UI =====
function renderAddresses() {
  const container = el("addresses-container");
  if (!container) return;
  container.innerHTML = "";
  addresses.forEach((addr, idx) => {
    const div = document.createElement("div"); div.className = "address-card";
    div.innerHTML = `
      <input type="radio" name="selected-address" ${selectedAddressIndex === idx ? "checked" : ""} data-idx="${idx}">
      <label><strong>${escapeHtml(addr.name)}</strong></label>
      <div>${escapeHtml(addr.phone)}</div>
      <div>${escapeHtml(addr.pincode)}, ${escapeHtml(addr.city)}</div>
      <div>${escapeHtml(addr.street)}</div>
      <div>${escapeHtml(addr.landmark || "")}</div>
      <button class="small remove-address" data-idx="${idx}">Remove</button>
    `;
    container.appendChild(div);
  });

  container.querySelectorAll('input[name="selected-address"]').forEach(r => r.onchange = e => {
    const idx = parseInt(e.currentTarget.dataset.idx, 10);
    selectedAddressIndex = isNaN(idx) ? null : idx;
    saveAddresses();
  });

  container.querySelectorAll(".remove-address").forEach(b => b.onclick = e => {
    const idx = parseInt(e.currentTarget.dataset.idx, 10);
    if (isNaN(idx)) return;
    addresses.splice(idx, 1);
    if (selectedAddressIndex !== null && selectedAddressIndex >= addresses.length) selectedAddressIndex = addresses.length - 1;
    if (addresses.length === 0) selectedAddressIndex = null;
    saveAddresses();
    renderAddresses();
  });
}

if (el("add-address-btn")) el("add-address-btn").onclick = () => el("new-address-form").classList.remove("hidden");
if (el("cancel-address-btn")) el("cancel-address-btn").onclick = () => el("new-address-form").classList.add("hidden");

if (el("new-address-form")) el("new-address-form").onsubmit = e => {
  e.preventDefault();
  const name = el("address-name").value.trim();
  const phone = el("address-phone").value.trim();
  const pincode = el("address-pincode").value.trim();
  const city = el("address-city").value.trim();
  const street = el("address-street").value.trim();
  const landmark = el("address-landmark").value.trim();
  addresses.push({ name, phone, pincode, city, street, landmark });
  selectedAddressIndex = addresses.length - 1;
  renderAddresses();
  el("new-address-form").classList.add("hidden");
  e.target.reset();
  saveAddresses();
};

// login/logout address-based
if (el("login-btn")) el("login-btn").onclick = () => {
  if (addresses.length > 0) {
    localStorage.removeItem("addresses");
    localStorage.removeItem("selectedAddressIndex");
    addresses = []; selectedAddressIndex = null;
    alert("You have been logged out.");
    updateLoginState();
  } else {
    if (el("add-address-btn")) el("add-address-btn").click();
  }
};

// ===== ORDER SUMMARY =====
function renderOrderSummary() {
  const summaryDiv = el("order-summary");
  if (!summaryDiv) return;
  const items = cartItems().map(i => `${getShortTitle(i.title)} × ${i.qty} = ₹${formatPrice(i.price * i.qty)}`).join("<br>");
  summaryDiv.innerHTML = `${items}<hr><strong>Total: ₹${formatPrice(cartTotal())}</strong>`;
}

// ===== PLACE ORDER =====
async function placeOrder() {
  if (selectedAddressIndex === null) { alert("Select an address before placing order!"); return; }
  if (Object.keys(cart).length === 0) { alert("Your cart is empty!"); return; }

  const addr = addresses[selectedAddressIndex];
  const items = cartItems().map(i => ({ id: i.id, title: getShortTitle(i.title, 80), qty: i.qty, unitPrice: formatPrice(i.price), total: formatPrice(i.price * i.qty) }));
  const notes = (el("order-notes") && el("order-notes").value) ? el("order-notes").value : "No special instructions.";
  const orderObj = {
    createdAt: new Date().toISOString(),
    customer: { name: addr.name, phone: addr.phone, pincode: addr.pincode, city: addr.city, street: addr.street, landmark: addr.landmark || "" },
    items,
    total: formatPrice(cartTotal()),
    paymentMethod: "COD",
    notes
  };

  // try Firestore if available
  if (db) {
    try {
      await db.collection("orders").add(orderObj);
      showSuccessAndReset();
      console.info("Order saved to Firestore.");
      return;
    } catch (err) {
      console.error("Firestore save error:", err);
    }
  }

  // fallback: EmailJS
  if (typeof emailjs !== "undefined" && emailjs.send) {
    try {
      const itemsText = items.map(it => `${it.title} × ${it.qty} = ₹${it.total}`).join("\n");
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        customer_name: addr.name,
        customer_phone: addr.phone,
        customer_address: `${addr.street}, ${addr.landmark || ""}, ${addr.city}, ${addr.pincode}`,
        order_summary: itemsText,
        order_total: formatPrice(cartTotal()),
        full_message: `Order from ${addr.name}\n${itemsText}\nTotal: ₹${formatPrice(cartTotal())}\nNotes: ${notes}`,
        special_notes: notes
      }, EMAILJS_PUBLIC_KEY);
      showSuccessAndReset();
      console.info("Order sent via EmailJS.");
      return;
    } catch (err) {
      console.error("EmailJS send error:", err);
      alert("Error sending order. Check EmailJS setup.");
      return;
    }
  }

  alert("Could not place order: no backend available (Firestore or EmailJS).");
}

if (el("place-order-btn")) el("place-order-btn").onclick = placeOrder;

function showSuccessAndReset() {
  const overlay = el("order-success");
  if (overlay) overlay.classList.remove("hidden");
  setTimeout(() => {
    if (overlay) overlay.classList.add("hidden");
    cart = {}; updateCartUI();
    if (el("checkout-form")) el("checkout-form").classList.add("hidden");
    if (el("products")) el("products").classList.remove("hidden");
    if (el("order-notes")) el("order-notes").value = "";
  }, 2200);
}

// ===== REVIEWS =====
function renderReviews() {
  const container = el("reviews-container");
  if (!container) return;
  container.innerHTML = "";
  const saved = localStorage.getItem("reviews");
  if (saved) { try { REVIEWS = JSON.parse(saved); } catch(e) { /* ignore */ } }
  REVIEWS.forEach(r => {
    const d = document.createElement("div"); d.className = "review-card";
    const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
    d.innerHTML = `<div class="review-header"><strong>${escapeHtml(r.name)}</strong><span class="stars">${stars}</span></div><p>"${escapeHtml(r.text)}"</p>`;
    container.appendChild(d);
  });
}

if (el("toggle-review-form-btn")) el("toggle-review-form-btn").onclick = () => {
  const form = el("add-review-form"); const btn = el("toggle-review-form-btn");
  if (!form) return;
  if (form.classList.contains("hidden")) { form.classList.remove("hidden"); btn.textContent = "Cancel"; }
  else { form.classList.add("hidden"); btn.textContent = "+ Add a Review"; }
};
if (el("cancel-review-btn")) el("cancel-review-btn").onclick = () => { if (el("add-review-form")) el("add-review-form").classList.add("hidden"); if (el("toggle-review-form-btn")) el("toggle-review-form-btn").textContent = "+ Add a Review"; };

if (el("add-review-form")) el("add-review-form").onsubmit = e => {
  e.preventDefault();
  const name = (el("review-name") && el("review-name").value) ? el("review-name").value : "Anonymous";
  const text = (el("review-text") && el("review-text").value) ? el("review-text").value : "";
  const ratingInput = el("add-review-form").querySelector('input[name="rating"]:checked');
  const rating = ratingInput ? parseInt(ratingInput.value, 10) : 5;
  REVIEWS.push({ name, text, rating });
  localStorage.setItem("reviews", JSON.stringify(REVIEWS));
  renderReviews();
  if (el("add-review-form")) { el("add-review-form").classList.add("hidden"); el("add-review-form").reset(); }
  if (el("toggle-review-form-btn")) el("toggle-review-form-btn").textContent = "+ Add a Review";
};

// ===== NAV / INIT =====
if (el("view-products")) el("view-products").onclick = () => { if (el("products")) el("products").classList.remove("hidden"); if (el("cart")) el("cart").classList.add("hidden"); if (el("product-detail")) el("product-detail").classList.add("hidden"); if (el("checkout-form")) el("checkout-form").classList.add("hidden"); };
if (el("view-cart")) el("view-cart").onclick = () => { if (el("products")) el("products").classList.add("hidden"); if (el("cart")) el("cart").classList.remove("hidden"); if (el("product-detail")) el("product-detail").classList.add("hidden"); if (el("checkout-form")) el("checkout-form").classList.add("hidden"); };
if (el("back-to-products")) el("back-to-products").onclick = () => { if (el("product-detail")) el("product-detail").classList.add("hidden"); if (el("products")) el("products").classList.remove("hidden"); };
if (el("checkout-btn")) el("checkout-btn").onclick = () => { if (Object.keys(cart).length === 0) { alert("Your cart is empty!"); } else { if (el("products")) el("products").classList.add("hidden"); if (el("cart")) el("cart").classList.add("hidden"); if (el("product-detail")) el("product-detail").classList.add("hidden"); if (el("checkout-form")) el("checkout-form").classList.remove("hidden"); if (el("new-address-form")) el("new-address-form").classList.add("hidden"); renderAddresses(); renderOrderSummary(); } };
if (el("cancel-checkout")) el("cancel-checkout").onclick = () => { if (el("checkout-form")) el("checkout-form").classList.add("hidden"); if (el("products")) el("products").classList.remove("hidden"); };

// DOM ready initialization
document.addEventListener("DOMContentLoaded", () => {
  // init emailjs if available
  try {
    if (typeof emailjs !== "undefined" && emailjs.init) { emailjs.init(EMAILJS_PUBLIC_KEY); console.info("EmailJS initialized"); }
  } catch (err) { console.warn("EmailJS init error:", err); }

  loadAddresses();
  renderProducts();
  updateCartUI();
  renderReviews();

  // Helpful console tip
  console.info("App initialized. If you still can't see products: open Console (F12) and look for errors.");
});

