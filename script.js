// ========== INITIALIZATION ==========
document.addEventListener("DOMContentLoaded", () => {
  // Start with homepage
  showPanel("products");
  renderProducts();
});

// ========== PRODUCT DATA ==========
const products = [
  { id: 1, name: "Handmade Lamp", price: 499, image: "images/lamp.jpg" },
  { id: 2, name: "Crafted Mug", price: 299, image: "images/mug.jpg" },
  { id: 3, name: "Wooden Frame", price: 399, image: "images/frame.jpg" }
];

// ========== RENDER PRODUCTS ==========
function renderProducts() {
  const grid = document.getElementById("products-grid");
  if (!grid) return;
  grid.innerHTML = "";

  products.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p class="price">₹${p.price}</p>
      <button class="add-btn" data-id="${p.id}">Add to Cart</button>
    `;
    grid.appendChild(card);
  });

  // Attach add-to-cart events
  document.querySelectorAll(".add-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id);
      addToCart(id);
    });
  });
}

// ========== NAVIGATION ==========
function showPanel(panelId) {
  document.querySelectorAll(".panel").forEach(p => p.classList.add("hidden"));
  document.getElementById(panelId).classList.remove("hidden");

  // Show "About" only when on homepage (products)
  if (panelId === "products") {
    document.getElementById("about").classList.remove("hidden");
  } else {
    document.getElementById("about").classList.add("hidden");
  }
}

// Navigation buttons
document.getElementById("view-products").addEventListener("click", () => {
  showPanel("products");
});
document.getElementById("view-cart").addEventListener("click", () => {
  showPanel("cart");
});

// ========== CART ==========
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  document.getElementById("cart-count").textContent = cart.length;
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  cart.push(product);
  saveCart();
  renderCart();
}

function renderCart() {
  const container = document.getElementById("cart-items");
  if (!container) return;

  container.innerHTML = "";
  if (cart.length === 0) {
    container.innerHTML = "<p>Your cart is empty</p>";
  } else {
    cart.forEach((item, index) => {
      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `
        <img src="${item.image}" alt="${item.name}">
        <div>
          <h4>${item.name}</h4>
          <p>₹${item.price}</p>
          <button class="small remove-btn" data-index="${index}">Remove</button>
        </div>
      `;
      container.appendChild(div);
    });

    // Remove buttons
    document.querySelectorAll(".remove-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.index);
        cart.splice(idx, 1);
        saveCart();
        renderCart();
      });
    });
  }

  // Update total
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  document.getElementById("cart-total").textContent = total.toFixed(2);
}

// Initial cart load
renderCart();
updateCartCount();

// ========== CHECKOUT ==========
document.getElementById("checkout-btn").addEventListener("click", () => {
  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }
  showPanel("checkout-form");
  renderOrderSummary();
});

document.getElementById("back-to-products-from-cart").addEventListener("click", () => {
  showPanel("products");
});

function renderOrderSummary() {
  const summary = document.getElementById("order-summary");
  if (!summary) return;

  summary.innerHTML = "";
  cart.forEach(item => {
    const div = document.createElement("div");
    div.className = "order-summary-item";
    div.innerHTML = `<span>${item.name}</span><span>₹${item.price}</span>`;
    summary.appendChild(div);
  });

  const total = cart.reduce((sum, item) => sum + item.price, 0);
  const totalDiv = document.createElement("div");
  totalDiv.className = "order-summary-total";
  totalDiv.innerHTML = `<strong>Total:</strong><strong>₹${total.toFixed(2)}</strong>`;
  summary.appendChild(totalDiv);
}

document.getElementById("place-order-btn").addEventListener("click", () => {
  if (cart.length === 0) {
    alert("Cart is empty!");
    return;
  }

  // Clear cart after order
  cart = [];
  saveCart();
  renderCart();

  // Show success message
  document.getElementById("order-success").classList.remove("hidden");
  setTimeout(() => {
    document.getElementById("order-success").classList.add("hidden");
    showPanel("products");
  }, 3000);
});

document.getElementById("cancel-checkout").addEventListener("click", () => {
  showPanel("cart");
});

// ========== LOCATION POPUP ==========
const locationPopup = document.getElementById("location-popup");
const locationText = document.getElementById("location-text");

document.getElementById("change-location-btn").addEventListener("click", () => {
  locationPopup.classList.remove("hidden");
});

document.getElementById("close-location-popup").addEventListener("click", () => {
  locationPopup.classList.add("hidden");
});

document.getElementById("pincode-submit").addEventListener("click", () => {
  const pincode = document.getElementById("pincode-input").value.trim();
  if (/^[0-9]{6}$/.test(pincode)) {
    locationText.textContent = `Delivering to ${pincode}`;
    document.getElementById("delivery-info").textContent = "Delivery available in 2-5 days";
    locationPopup.classList.add("hidden");
  } else {
    alert("Please enter a valid 6-digit pincode.");
  }
});

document.getElementById("use-current-location").addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        locationText.textContent = `Lat: ${latitude.toFixed(2)}, Lng: ${longitude.toFixed(2)}`;
        document.getElementById("delivery-info").textContent = "Delivery available in your area";
        locationPopup.classList.add("hidden");
      },
      err => {
        alert("Unable to fetch location.");
      }
    );
  } else {
    alert("Geolocation not supported.");
  }
});

// ========== REVIEWS ==========
const reviewsContainer = document.getElementById("reviews-container");
const toggleReviewBtn = document.getElementById("toggle-review-form-btn");
const reviewForm = document.getElementById("add-review-form");
const cancelReviewBtn = document.getElementById("cancel-review-btn");

toggleReviewBtn.addEventListener("click", () => {
  reviewForm.classList.remove("hidden");
  toggleReviewBtn.classList.add("hidden");
});

cancelReviewBtn.addEventListener("click", () => {
  reviewForm.classList.add("hidden");
  toggleReviewBtn.classList.remove("hidden");
});

reviewForm.addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("review-name").value.trim();
  const text = document.getElementById("review-text").value.trim();
  const rating = document.querySelector("input[name='rating']:checked").value;

  if (!name || !text) return;

  const reviewCard = document.createElement("div");
  reviewCard.className = "review-card";
  reviewCard.innerHTML = `
    <div class="review-header">
      <span><strong>${name}</strong></span>
      <span class="stars">${"★".repeat(rating)}${"☆".repeat(5 - rating)}</span>
    </div>
    <p>${text}</p>
  `;
  reviewsContainer.appendChild(reviewCard);

  // Reset form
  reviewForm.reset();
  reviewForm.classList.add("hidden");
  toggleReviewBtn.classList.remove("hidden");
});

// ========== MISC ==========
document.getElementById("back-to-products").addEventListener("click", () => {
  showPanel("products");
});