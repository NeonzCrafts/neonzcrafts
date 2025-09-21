// ========== CONFIG ==========
const EMAILJS_SERVICE_ID = "service_al4zpdb";
const EMAILJS_TEMPLATE_ID = "template_vimeo5m";
const EMAILJS_PUBLIC_KEY = "CRkybtSL0tLoJJ71X";

// Firebase (disabled by default)
const firebaseConfig = null;
let firebaseEnabled = false;
if (typeof firebase !== 'undefined' && firebaseConfig) {
  try {
    firebase.initializeApp(firebaseConfig);
    var db = firebase.firestore();
    firebaseEnabled = true;
  } catch (e) {
    console.warn("Firebase init error:", e);
  }
}

// ===== Products =====
const PRODUCTS = [
  {
    id: 'p1',
    title: 'Educational Geometric Shape Sorting & Stacking Toy',
    originalPrice: 399,
    price: 199,
    images: ["./1000069559.jpg", "./1000069560.jpg", "./1000069561.jpg"],
    description: 'A perfect educational toy for toddlers to learn colors, shapes, and motor skills.'
  }
];

let REVIEWS = [
  { name: 'Priya S.', text: 'Amazing quality!', rating: 5 },
  { name: 'Amit V.', text: 'Fast delivery, great service.', rating: 5 },
  { name: 'Sneha R.', text: 'Exceeded my expectations.', rating: 5 }
];

// ===== Data Storage =====
let cart = JSON.parse(localStorage.getItem('cart')) || {};

// ===== Helper Functions =====
const el = (id) => document.getElementById(id);

function formatPrice(price) {
  return `₹${price}`;
}

// ===== Product Rendering =====
function renderProducts() {
  const list = el('product-list');
  list.innerHTML = '';
  PRODUCTS.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${p.images[0]}" alt="${p.title}" class="product-image" onclick="showProductDetail('${p.id}')">
      <h3>${p.title}</h3>
      <div class="price-container">
        <span class="price">${formatPrice(p.price)}</span>
        <span class="original-price">${formatPrice(p.originalPrice)}</span>
      </div>
      <button class="primary-btn add-to-cart-btn" onclick="addToCart('${p.id}')">Add to Cart</button>
    `;
    list.appendChild(card);
  });
}

function showProductDetail(id) {
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return;

  const detailContent = el('product-detail-content');
  detailContent.innerHTML = `
    <div class="product-image-slider">
      ${product.images.map(img => `<img src="${img}" alt="${product.title}">`).join('')}
    </div>
    <div class="product-info">
      <h2>${product.title}</h2>
      <div class="price-container">
        <span class="price-detail">${formatPrice(product.price)}</span>
        <span class="original-price-detail">${formatPrice(product.originalPrice)}</span>
      </div>
      <p class="product-description">${product.description}</p>
      <button class="primary-btn add-to-cart-btn" onclick="addToCart('${product.id}')">Add to Cart</button>
    </div>
  `;
  el('product-detail').classList.remove('hidden');
  el('products').classList.add('hidden');
}

// ===== Cart Functions =====
function addToCart(id, quantity = 1) {
  if (cart[id]) {
    cart[id].qty += quantity;
  } else {
    const product = PRODUCTS.find(p => p.id === id);
    if (product) {
      cart[id] = { ...product, qty: quantity };
    }
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
  updateTotal();
  showCartPanel();
}

function removeFromCart(id) {
  delete cart[id];
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
  updateTotal();
}

function updateTotal() {
  const total = Object.values(cart).reduce((sum, item) => sum + item.price * item.qty, 0);
  el('cart-total').textContent = `Total: ${formatPrice(total)}`;
}

function updateCartUI() {
  const cartItemsContainer = el('cart-items');
  cartItemsContainer.innerHTML = '';
  el('cart-count').textContent = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
  Object.values(cart).forEach(item => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <img src="${item.images[0]}" alt="${item.title}" class="cart-item-img">
      <div class="cart-item-details">
        <h4>${item.title}</h4>
        <p>${formatPrice(item.price)} x ${item.qty}</p>
      </div>
      <div class="cart-item-controls">
        <button class="small" onclick="addToCart('${item.id}', -1)">-</button>
        <span>${item.qty}</span>
        <button class="small" onclick="addToCart('${item.id}',1)">+</button>
        <button class="small" onclick="removeFromCart('${item.id}')">x</button>
      </div>`;
    cartItemsContainer.appendChild(div);
  });
}

// ===== Order Placement =====
el('place-order-btn').onclick = (e) => {
  e.preventDefault();
  const form = el('order-form');
  if (!form.checkValidity()) {
    alert('Please fill out all required fields.');
    return;
  }

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  
  if (Object.keys(cart).length === 0) {
    alert('Your cart is empty. Please add items to place an order.');
    return;
  }

  const orderDetails = Object.values(cart).map(item => `${item.title} (${item.qty}x)`).join(', ');
  const orderTotal = Object.values(cart).reduce((sum, item) => sum + item.price * item.qty, 0);

  const emailParams = {
    ...data,
    order_details: orderDetails,
    order_total: formatPrice(orderTotal),
  };

  emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailParams)
    .then((response) => {
      console.log('SUCCESS!', response.status, response.text);
      localStorage.removeItem('cart');
      cart = {};
      updateCartUI();
      updateTotal();
      showSuccessOverlay();
      form.reset();
    }, (error) => {
      console.log('FAILED...', error);
      alert('Order failed. Please try again.');
    });
};

function showSuccessOverlay() {
  el('order-success').classList.remove('hidden');
  setTimeout(() => {
    el('order-success').classList.add('hidden');
    el('products').classList.remove('hidden');
    el('checkout-form').classList.add('hidden');
  }, 5000);
}

// ===== Reviews =====
function renderReviews(){
  const c = el('reviews-container');
  if (c) {
    c.innerHTML = '';
    REVIEWS.forEach(r => {
      const div = document.createElement('div');
      div.className = 'review-card';
      const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
      div.innerHTML = `<div class="review-header"><strong>${r.name}</strong><span class="stars">${stars}</span></div><p>"${r.text}"</p>`;
      c.appendChild(div);
    });
  }
}

// ===== Navigation & Init =====
document.addEventListener('DOMContentLoaded', () => {
  if (typeof emailjs !== 'undefined' && emailjs.init) {
    try {
      emailjs.init(EMAILJS_PUBLIC_KEY);
    } catch(e) {
      console.warn('EmailJS init error', e);
    }
  }

  renderProducts();
  updateCartUI();
  updateTotal();
  renderReviews();

  // Navigation Event Listeners
  el('view-products').onclick = () => {
    el('products').classList.remove('hidden');
    el('cart').classList.add('hidden');
    el('product-detail').classList.add('hidden');
    el('checkout-form').classList.add('hidden');
  };

  el('view-cart').onclick = () => {
    el('products').classList.add('hidden');
    el('cart').classList.remove('hidden');
    el('product-detail').classList.add('hidden');
    el('checkout-form').classList.add('hidden');
  };
    
  el('back-to-products').onclick = () => {
    el('products').classList.remove('hidden');
    el('cart').classList.add('hidden');
    el('product-detail').classList.add('hidden');
    el('checkout-form').classList.add('hidden');
  };
    
  el('checkout-btn').onclick = () => {
    el('products').classList.add('hidden');
    el('cart').classList.add('hidden');
    el('product-detail').classList.add('hidden');
    el('checkout-form').classList.remove('hidden');
  };
    
  el('cancel-checkout').onclick = () => {
    el('products').classList.add('hidden');
    el('cart').classList.remove('hidden');
    el('product-detail').classList.add('hidden');
    el('checkout-form').classList.add('hidden');
  };
    
  el('back-to-products-detail').onclick = () => {
    el('products').classList.remove('hidden');
    el('cart').classList.add('hidden');
    el('product-detail').classList.add('hidden');
    el('checkout-form').classList.add('hidden');
  };
});
