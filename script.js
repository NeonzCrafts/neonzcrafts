// ========== CONFIG ==========
// EmailJS config
const EMAILJS_SERVICE_ID = "service_al4zpdb";
const EMAILJS_TEMPLATE_ID = "template_vimeo5m";
const EMAILJS_PUBLIC_KEY = "CRkybtSL0tLoJJ71X";

// ===== FIREBASE CONFIG (YOUR PROJECT) =====
const firebaseConfig = {
  apiKey: "AIzaSyA3s-XIr-fTke9O4TdimgRTa7GiJBmZ5qU",
  authDomain: "neonzcrafts.firebaseapp.com",
  projectId: "neonzcrafts",
  storageBucket: "neonzcrafts.firebasestorage.app",
  messagingSenderId: "106178899434",
  appId: "1:106178899434:web:98c147b399657c1f559693",
  measurementId: "G-KFSKZW04YS"
};

// Initialize Firebase (compat build, works with CDN)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ========== STORE DATA ==========
const PRODUCTS = [
  {
    id: "p1",
    title:
      "Educational Geometric Shape Sorting & Stacking Toy (Montessori) — Color Shape Learning",
    originalPrice: 399,
    price: 199,
    images: ["./1000069559.jpg", "./1000069560.jpg", "./1000069561.jpg"],
    description:
      "A perfect educational toy for toddlers to learn colors, shapes, and improve motor skills. Made from safe, durable materials."
  }
];

// Sample reviews
let REVIEWS = [
  {
    name: "Priya S.",
    text: "The product quality is amazing! I am so happy with my purchase.",
    rating: 5
  },
  {
    name: "Amit V.",
    text: "Fast delivery and excellent customer service. Highly recommend!",
    rating: 5
  },
  {
    name: "Sneha R.",
    text: "A great buy. The product exceeded my expectations.",
    rating: 4
  }
];

const el = (id) => document.getElementById(id);
let cart = {};
let addresses = [],
  selectedAddressIndex = null;

// ====== ADDRESS STORAGE ======
function loadAddresses() {
  const savedAddresses = localStorage.getItem("addresses");
  if (savedAddresses) {
    try {
      addresses = JSON.parse(savedAddresses);
      const idx = localStorage.getItem("selectedAddressIndex");
      selectedAddressIndex = idx !== null ? parseInt(idx, 10) : null;
    } catch (e) {
      addresses = [];
      selectedAddressIndex = null;
    }
  }
  updateLoginState();
}

function saveAddresses() {
  localStorage.setItem("addresses", JSON.stringify(addresses));
  localStorage.setItem(
    "selectedAddressIndex",
    selectedAddressIndex !== null ? selectedAddressIndex : ""
  );
  updateLoginState();
}

function updateLoginState() {
  if (addresses.length > 0) {
    el("user-display").textContent = `Welcome, ${addresses[0].name}!`;
    el("user-display").classList.remove("hidden");
    el("login-btn").textContent = "Log Out";
  } else {
    el("user-display").textContent = "";
    el("user-display").classList.add("hidden");
    el("login-btn").textContent = "Log In";
  }
}

// ====== HELPERS ======
function formatPrice(v) {
  return Number(v).toFixed(2);
}
function getShortTitle(title, maxLength = 50) {
  return title.length > maxLength
    ? title.substring(0, maxLength) + "..."
    : title;
}

// ====== PRODUCT LIST ======
function renderProducts() {
  const container = el("products");
  const grid = document.createElement("div");
  grid.className = "products-grid";
  PRODUCTS.forEach((p) => {
    const card = document.createElement("div");
    card.className = "card";
    card.setAttribute("onclick", `showProductDetail('${p.id}')`);
    let priceDisplay = p.originalPrice
      ? `<span class="original-price">₹${formatPrice(
          p.originalPrice
        )}</span> ₹${formatPrice(p.price)} <span class="sale-tag">Sale</span>`
      : `₹${formatPrice(p.price)}`;
    card.innerHTML = `<img src="${p.images[0]}" alt="${p.title}"/><h3>${p.title}</h3><p>${p.description}</p><div class="price">${priceDisplay}</div>`;
    grid.appendChild(card);
  });
  container.innerHTML = "<h2>Products</h2>";
  container.appendChild(grid);
}

// ====== PRODUCT DETAIL ======
function showProductDetail(id) {
  const product = PRODUCTS.find((x) => x.id === id);
  if (!product) return;
  el("products").classList.add("hidden");
  el("product-detail").classList.remove("hidden");
  const contentDiv = el("product-detail-content");

  const galleryHtml = product.images
    .map(
      (imgUrl) =>
        `<img src="${imgUrl}" alt="Product thumbnail" onclick="changeMainImage('${imgUrl}')">`
    )
    .join("");
  let priceDisplay = product.originalPrice
    ? `<span class="original-price">₹${formatPrice(
        product.originalPrice
      )}</span> ₹${formatPrice(product.price)} <span class="sale-tag">Sale</span>`
    : `₹${formatPrice(product.price)}`;

  contentDiv.innerHTML = `
    <div class="product-details-container">
      <div class="product-image-section">
        <img src="${product.images[0]}" alt="${product.title}" id="main-product-image">
        <div class="thumbnail-gallery">${galleryHtml}</div>
      </div>
      <div class="product-info-section">
        <h2>${product.title}</h2>
        <div class="price">${priceDisplay}</div>
        <p>${product.description}</p>
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
  const thumbs = document.querySelectorAll(
    "#product-detail-content .thumbnail-gallery img"
  );
  thumbs.forEach((t) => t.classList.remove("active"));
  const active = Array.from(thumbs).find(
    (t) =>
      t.getAttribute("src") === imgUrl ||
      t.src === new URL(imgUrl, location.href).href
  );
  if (active) active.classList.add("active");
}

function changeQtyOnDetail(change) {
  const qtySpan = el("detail-qty");
  let currentQty = Number(qtySpan.textContent);
  currentQty += change;
  if (currentQty < 1) currentQty = 1;
  qtySpan.textContent = currentQty;
}

function addToCartAndCheckout(id) {
  const qty = Number(el("detail-qty").textContent);
  addToCart(id, qty);
  el("view-cart").click();
}

// ====== CART ======
function addToCart(id, qty = 1) {
  cart[id] = (cart[id] || 0) + qty;
  updateCartUI();
}
function removeFromCart(id) {
  delete cart[id];
  updateCartUI();
}
function changeQty(id, qty) {
  if (qty <= 0) removeFromCart(id);
  else {
    cart[id] = qty;
    updateCartUI();
  }
}
function cartItems() {
  return Object.entries(cart).map(([id, qty]) => ({
    ...PRODUCTS.find((x) => x.id === id),
    qty
  }));
}
function cartTotal() {
  return cartItems().reduce((s, i) => s + i.price * i.qty, 0);
}

function updateCartUI() {
  el("cart-count").textContent = Object.values(cart).reduce((a, b) => a + b, 0);
  const itemsDiv = el("cart-items");
  itemsDiv.innerHTML = "";
  const items = cartItems();
  el("cart-total").textContent = formatPrice(cartTotal());
  if (items.length === 0) {
    itemsDiv.innerHTML = "<p>Your cart is empty.</p>";
  } else {
    items.forEach((it) => {
      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `
        <img src="${it.images[0]}" alt="${it.title}">
        <div style="flex:1">
          <div><strong>${getShortTitle(it.title)}</strong></div>
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
    itemsDiv
      .querySelectorAll(".inc")
      .forEach(
        (b) =>
          (b.onclick = (e) =>
            changeQty(e.currentTarget.dataset.id, cart[e.currentTarget.dataset.id] + 1))
      );
    itemsDiv
      .querySelectorAll(".dec")
      .forEach(
        (b) =>
          (b.onclick = (e) =>
            changeQty(e.currentTarget.dataset.id, cart[e.currentTarget.dataset.id] - 1))
      );
    itemsDiv
      .querySelectorAll(".remove-from-cart-btn")
      .forEach(
        (b) => (b.onclick = (e) => removeFromCart(e.currentTarget.dataset.id))
      );
  }
}

// ====== CHECKOUT ======
function showCheckoutForm() {
  if (Object.keys(cart).length === 0) {
    alert("Your cart is empty!");
    return;
  }
  el("products").classList.add("hidden");
  el("cart").classList.add("hidden");
  el("product-detail").classList.add("hidden");
  el("checkout-form").classList.remove("hidden");
  el("new-address-form").classList.add("hidden");
  renderAddresses();
  renderOrderSummary();
}
function hideCheckoutForm() {
  el("checkout-form").classList.add("hidden");
  el("products").classList.remove("hidden");
}

function renderAddresses() {
  const container = el("addresses-container");
  container.innerHTML = "";
  addresses.forEach((addr, idx) => {
    const div = document.createElement("div");
    div.className = "address-card";
    div.innerHTML = `
      <input type="radio" name="selected-address" ${
        selectedAddressIndex === idx ? "checked" : ""
      } data-idx="${idx}">
      <label><strong>${addr.name}</strong></label>
      <div>${addr.phone}</div>
      <div>${addr.pincode}, ${addr.city}</div>
      <div>${addr.street}</div>
      <div>${addr.landmark || ""}</div>
      <button class="small remove-address" data-idx="${idx}">Remove</button>
    `;
    container.appendChild(div);
  });
  container
    .querySelectorAll('input[name="selected-address"]')
    .forEach(
      (r) =>
        (r.onchange = (e) => {
          selectedAddressIndex = parseInt(e.currentTarget.dataset.idx, 10);
          saveAddresses();
        })
    );
  container.querySelectorAll(".remove-address").forEach(
    (b) =>
      (b.onclick = (e) => {
        const idx = parseInt(e.currentTarget.dataset.idx, 10);
        if (!isNaN(idx)) {
          addresses.splice(idx, 1);
          if (
            selectedAddressIndex !== null &&
            selectedAddressIndex >= addresses.length
          )
            selectedAddressIndex = addresses.length - 1;
          if (addresses.length === 0) selectedAddressIndex = null;
          saveAddresses();
          renderAddresses();
        }
      })
  );
}

// add new address form
el("add-address-btn").onclick = () =>
  el("new-address-form").classList.remove("hidden");
el("cancel-address-btn").onclick = () =>
  el("new-address-form").classList.add("hidden");
el("new-address-form").onsubmit = (e) => {
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

// login/logout simulation
function toggleLogin() {
  if (addresses.length > 0) {
    localStorage.removeItem("addresses");
    localStorage.removeItem("selectedAddressIndex");
    addresses = [];
    selectedAddressIndex = null;
    alert("You have been logged out.");
    updateLoginState();
  } else {
    el("add-address-btn").click();
  }
}
el("login-btn").onclick = toggleLogin;

// order summary
function renderOrderSummary() {
  const summaryDiv = el("order-summary");
  const items = cartItems()
    .map(
      (i) =>
        `${getShortTitle(i.title)} × ${i.qty} = ₹${formatPrice(i.price * i.qty)}`
    )
    .join("<br>");
  summaryDiv.innerHTML = `${items}<hr><strong>Total: ₹${formatPrice(
    cartTotal()
  )}</strong>`;
}

// ====== PLACE ORDER ======
el("place-order-btn").onclick = async () => {
  if (selectedAddressIndex === null) {
    alert("Select an address before placing order!");
    return;
  }
  if (Object.keys(cart).length === 0) {
    alert("Your cart is empty!");
    return;
  }

  const addr = addresses[selectedAddressIndex];
  const items = cartItems().map((i) => ({
    id: i.id,
    title: getShortTitle(i.title, 80),
    qty: i.qty,
    unitPrice: formatPrice(i.price),
    total: formatPrice(i.price * i.qty)
  }));
  const notes = el("order-notes").value || "No special instructions.";
  const orderObj = {
    createdAt: new Date().toISOString(),
    customer: {
      name: addr.name,
      phone: addr.phone,
      pincode: addr.pincode,
      city: addr.city,
      street: addr.street,
      landmark: addr.landmark || ""
    },
    items,
    total: formatPrice(cartTotal()),
    paymentMethod: "COD",
    notes
  };

  try {
    await db.collection("orders").add(orderObj);
    showSuccessAndReset();
    return;
  } catch (err) {
    console.error("Firestore save error:", err);
  }

  // fallback: emailjs
  try {
    const itemsText = items
      .map((it) => `${it.title} × ${it.qty} = ₹${it.total}`)
      .join("\n");
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        customer_name: addr.name,
        customer_phone: addr.phone,
        customer_address: `${addr.street}, ${addr.landmark || ""}, ${addr.city}, ${addr.pincode}`,
        order_summary: itemsText,
        order_total: formatPrice(cartTotal()),
        full_message: `Order from ${addr.name}\n${itemsText}\nTotal: ₹${formatPrice(
          cartTotal()
        )}\nNotes: ${notes}`,
        special_notes: notes
      },
      EMAILJS_PUBLIC_KEY
    );
    showSuccessAndReset();
  } catch (err) {
    console.error(err);
    alert("Order failed. Try again.");
  }
};

function showSuccessAndReset() {
  el("order-success").classList.remove("hidden");
  setTimeout(() => {
    el("order-success").classList.add("hidden");
    cart = {};
    updateCartUI();
    el("checkout-form").classList.add("hidden");
    el("products").classList.remove("hidden");
    el("order-notes").value = "";
  }, 2200);
}

// ====== REVIEWS ======
function renderReviews() {
  const container = el("reviews-container");
  container.innerHTML = "";
  const savedReviews = localStorage.getItem("reviews");
  if (savedReviews) {
    try {
      REVIEWS = JSON.parse(savedReviews);
    } catch {}
  }
  REVIEWS.forEach((review) => {
    const div = document.createElement("div");
    div.className = "review-card";
    const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
    div.innerHTML = `
      <div class="review-header">
        <strong>${review.name}</strong>
        <span class="stars">${stars}</span>
      </div>
      <p>"${review.text}"</p>
    `;
    container.appendChild(div);
  });
}

el("toggle-review-form-btn").onclick = () => {
  const form = el("add-review-form");
  const button = el("toggle-review-form-btn");
  if (form.classList.contains("hidden")) {
    form.classList.remove("hidden");
    button.textContent = "Cancel";
  } else {
    form.classList.add("hidden");
    button.textContent = "+ Add a Review";
  }
};

el("cancel-review

// ===== INITIALIZE =====
window.onload = () => {
  loadAddresses();
  renderProducts();
  updateCartUI();
};
