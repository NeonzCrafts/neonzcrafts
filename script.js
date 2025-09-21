function goHome() {
  window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const PRODUCTS = [
    { id: "p1", title: "Educational Toy", price: 199, originalPrice: 399, image: "1000069559.jpg", "1000069561.jpg", "1000069560.jpg",},
  ];

  let cart = JSON.parse(localStorage.getItem("cart") || "[]");

  function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
    const cartCount = document.getElementById("cart-count");
    if (cartCount) cartCount.textContent = cart.length;
  }

  // Product rendering (only on index.html)
  const productsPanel = document.getElementById("products-panel");
  if (productsPanel) {
    productsPanel.innerHTML = PRODUCTS.map(p => `
      <div class="product-card">
        <img src="${p.image}" onerror="this.src='https://via.placeholder.com/250?text=No+Image'">
        <h3>${p.title}</h3>
        <div><span class="price">₹${p.price}</span> ${p.originalPrice ? `<span class="old-price">₹${p.originalPrice}</span>` : ""}</div>
        <button class="btn-primary" onclick="addToCart('${p.id}')">Add to Cart</button>
      </div>
    `).join("");
  }

  window.addToCart = function (id) {
    cart.push(id);
    saveCart();
    alert("Added to cart!");
  };

  // Cart rendering (only on cart.html)
  const cartItemsDiv = document.getElementById("cart-items");
  if (cartItemsDiv) {
    if (cart.length === 0) {
      cartItemsDiv.innerHTML = "<p>Your cart is empty.</p>";
    } else {
      cartItemsDiv.innerHTML = cart.map(id => {
        const p = PRODUCTS.find(x => x.id === id);
        return `<div>${p.title} - ₹${p.price}</div>`;
      }).join("");
    }
  }

  // Order summary rendering (only on checkout.html)
  const orderSummary = document.getElementById("order-summary");
  if (orderSummary) {
    if (cart.length === 0) {
      orderSummary.innerHTML = "<p>Your cart is empty.</p>";
    } else {
      orderSummary.innerHTML = cart.map(id => {
        const p = PRODUCTS.find(x => x.id === id);
        return `<div>${p.title} - ₹${p.price}</div>`;
      }).join("");
    }
  }

  const addressForm = document.getElementById("address-form");
  if (addressForm) {
    addressForm.addEventListener("submit", (e) => {
      e.preventDefault();
      alert("Address saved successfully!");
    });
  }

  const placeOrderBtn = document.getElementById("place-order");
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener("click", () => {
      if (cart.length === 0) {
        alert("Cart is empty!");
        return;
      }
      cart = [];
      saveCart();
      window.location.href = "order-success.html";
    });
  }

  saveCart();
});