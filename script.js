// ========== CONFIG ==========
const EMAILJS_SERVICE_ID = "service_al4zpdb";
const EMAILJS_TEMPLATE_ID = "template_vimeo5m";
const EMAILJS_PUBLIC_KEY = "CRkybtSL0tLoJJ71X";

// The products for your store
const PRODUCTS = [
  // Your product
  { 
    id:'p1', 
    title:'Educational Geometric Shape Sorting & Stacking Toys for 1 2 3 Year Old, Montessori Toys for Toddlers, Preschool Educational Color Shape Learning Toy Gift for Kids Girls Boys', 
    price:219, 
    image:'./51Vgahd2ZEL._AC_UF894,1000_QL80_FMwebp_.webp', 
    description:'A perfect educational toy for toddlers to learn colors, shapes, and improve motor skills. Made from safe, durable materials.' 
  }
];

// Sample reviews (You can edit these later)
const REVIEWS = [
  { name: 'Priya S.', text: 'The product quality is amazing! I am so happy with my purchase.', rating: 5 },
  { name: 'Amit V.', text: 'Fast delivery and excellent customer service. Highly recommend!', rating: 5 },
  { name: 'Sneha R.', text: 'A great buy. The product exceeded my expectations.', rating: 4 }
];

const el = id=>document.getElementById(id);
let cart = {};
let addresses=[], selectedAddressIndex=null;

function formatPrice(v){ return Number(v).toFixed(2); }

// ====== Product rendering ======
function renderProducts(){
  const container=el('products');
  const grid=document.createElement('div'); grid.className='products-grid';
  PRODUCTS.forEach(p=>{
    const card=document.createElement('div'); card.className='card';
    card.innerHTML=`<img src="${p.image}" alt="${p.title}"/><h3>${p.title}</h3><p>${p.description}</p><div class="price">₹${formatPrice(p.price)}</div><div style="margin-top:8px"><button class="small" data-id="${p.id}" onclick="showProductDetail('${p.id}')">View Details</button></div>`;
    grid.appendChild(card);
  });
  container.innerHTML='<h2>Products</h2>'; container.appendChild(grid);
}

// ====== Product Detail Page ======
function showProductDetail(id){
    const product = PRODUCTS.find(p=>p.id===id);
    if (!product) return;

    el('products').classList.add('hidden');
    el('product-detail').classList.remove('hidden');

    const contentDiv = el('product-detail-content');
    contentDiv.innerHTML = `
      <div class="product-details-container">
        <div class="product-image-section">
          <img src="${product.image}" alt="${product.title}">
        </div>
        <div class="product-info-section">
          <h2>${product.title}</h2>
          <div class="price">₹${formatPrice(product.price)}</div>
          <p>${product.description}</p>
          <div class="quantity-selector">
            <button class="small" onclick="changeQtyOnDetail(-1)">-</button>
            <input type="number" id="detail-qty" value="1" min="1">
            <button class="small" onclick="changeQtyOnDetail(1)">+</button>
          </div>
          <button class="checkout-btn" onclick="addToCartAndCheckout('${product.id}')">BUY NOW</button>
          <button class="add-to-cart-btn" onclick="addToCart('${product.id}', Number(el('detail-qty').value))">Add to cart</button>
        </div>
      </div>
    `;
}

function changeQtyOnDetail(change){
    const qtyInput = el('detail-qty');
    let currentQty = Number(qtyInput.value);
    currentQty += change;
    if (currentQty < 1) currentQty = 1;
    qtyInput.value = currentQty;
}

function addToCartAndCheckout(id){
  const qty = Number(el('detail-qty').value);
  addToCart(id, qty);
  el('view-cart').click();
}

// ====== Cart logic ======
function addToCart(id,qty=1){ cart[id]=(cart[id]||0)+qty; updateCartUI(); }
function removeFromCart(id){ delete cart[id]; updateCartUI(); }
function changeQty(id,qty){ qty<=0?removeFromCart(id):(cart[id]=qty, updateCartUI()); }
function cartItems(){ return Object.entries(cart).map(([id,qty])=>({...PRODUCTS.find(x=>x.id===id), qty})); }
function cartTotal(){ return cartItems().reduce((s,i)=>s + i.price*i.qty,0); }

function updateCartUI(){
  el('cart-count').textContent=Object.values(cart).reduce((a,b)=>a+b,0);
  const itemsDiv=el('cart-items'); itemsDiv.innerHTML='';
  const items=cartItems();
  if(items.length===0){ itemsDiv.innerHTML='<p>Your cart is empty.</p>'; }
  else{
    items.forEach(it=>{
      const div=document.createElement('div'); div.className='cart-item';
      div.innerHTML=`<img src="${it.image}" alt="${it.title}"><div style="flex:1"><div><strong>${it.title}</strong></div><div>₹${formatPrice(it.price)} × <span class="qty">${it.qty}</span></div><div class="cart-qty"><button class="small dec" data-id="${it.id}">-</button><button class="small inc" data-id="${it.id}">+</button><button class="small rem" data-id="${it.id}">Remove</button></div></div>`;
      itemsDiv.appendChild(div);
    });
    itemsDiv.querySelectorAll('.inc').forEach(b=>b.onclick=e=>changeQty(e.currentTarget.dataset.id,cart[e.currentTarget.dataset.id]+1));
    itemsDiv.querySelectorAll('.dec').forEach(b=>b.onclick=e=>changeQty(e.currentTarget.dataset.id,cart[e.currentTarget.dataset.id]-1));
    itemsDiv.querySelectorAll('.rem').forEach(b=>b.onclick=e=>removeFromCart(e.currentTarget.dataset.id));
  }
}

// ====== Checkout ======
function showCheckoutForm(){
  if(Object.keys(cart).length===0){ alert("Your cart is empty!"); return; }
  el('products').classList.add('hidden'); el('cart').classList.add('hidden'); el('product-detail').classList.add('hidden'); el('checkout-form').classList.remove('hidden');
  el('new-address-form').classList.add('hidden'); // Hide form on load
  renderAddresses(); renderOrderSummary();
}
function hideCheckoutForm(){ el('checkout-form').classList.add('hidden'); el('products').classList.remove('hidden'); }

// Render addresses
function renderAddresses(){
  const container=el('addresses-container'); container.innerHTML='';
  addresses.forEach((addr,idx)=>{
    const div=document.createElement('div'); div.className='address-card';
    div.innerHTML=`<input type="radio" name="selected-address" ${selectedAddressIndex===idx?'checked':''} data-idx="${idx}"><label><strong>${addr.name}</strong></label><div>${addr.phone}</div><div>${addr.pincode}, ${addr.city}</div><div>${addr.street}</div><div>${addr.landmark}</div><button class="small remove-address" data-idx="${idx}">Remove</button>`;
    container.appendChild(div);
  });
  container.querySelectorAll('input[name="selected-address"]').forEach(r=>r.onchange=e=>selectedAddressIndex=parseInt(e.currentTarget.dataset.idx));
  container.querySelectorAll('.remove-address').forEach(b=>b.onclick=e=>{ addresses.splice(parseInt(e.currentTarget.dataset.idx),1); if(selectedAddressIndex!==null && selectedAddressIndex>=addresses.length) selectedAddressIndex=addresses.length-1; renderAddresses(); });
}

// Add new address (using the form)
el('add-address-btn').onclick=()=>{ el('new-address-form').classList.remove('hidden'); };
el('cancel-address-btn').onclick=()=>{ el('new-address-form').classList.add('hidden'); };

el('new-address-form').onsubmit=e=>{
  e.preventDefault();
  const name=el('address-name').value;
  const phone=el('address-phone').value;
  const pincode=el('address-pincode').value;
  const city=el('address-city').value;
  const street=el('address-street').value;
  const landmark=el('address-landmark').value;
  
  addresses.push({name,phone,pincode,city,street,landmark});
  selectedAddressIndex=addresses.length-1; 
  renderAddresses(); 
  el('new-address-form').classList.add('hidden');
  e.target.reset(); // Clear the form
};

// Render order summary
function renderOrderSummary(){
  const summaryDiv=el('order-summary');
  const items=cartItems().map(i=>`${i.title} × ${i.qty} = ₹${formatPrice(i.price*i.qty)}`).join('<br>');
  summaryDiv.innerHTML=`${items}<hr><strong>Total: ₹${formatPrice(cartTotal())}</strong>`;
}

// Place order via EmailJS
el('place-order-btn').onclick=()=>{
  if(selectedAddressIndex===null){ alert("Select an address before placing order!"); return; }
  const addr=addresses[selectedAddressIndex];
  const items=cartItems().map(i=>`${i.title} × ${i.qty} = ₹${formatPrice(i.price*i.qty)}`).join('\n');
  const notes = el('order-notes').value || 'No special instructions.';
  const message=`New COD Order:\n\nName: ${addr.name}\nPhone: ${addr.phone}\nAddress:\n${addr.street}, ${addr.landmark}, ${addr.city}, ${addr.pincode}\n\nItems:\n${items}\n\nTotal: ₹${formatPrice(cartTotal())}\n\nSpecial Instructions:\n${notes}`;
  emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    customer_name: addr.name,
    customer_phone: addr.phone,
    customer_address:`${addr.street}, ${addr.landmark}, ${addr.city}, ${addr.pincode}`,
    order_summary: items,
    order_total: formatPrice(cartTotal()),
    full_message: message,
    special_notes: notes
  }, EMAILJS_PUBLIC_KEY)
  .then(()=>{ alert("Order placed successfully! You'll be contacted soon."); cart={}; updateCartUI(); addresses=[]; selectedAddressIndex=null; hideCheckoutForm(); })
  .catch(err=>{ console.error(err); alert("Error sending order. Check EmailJS setup."); });
};

// ====== Review Rendering ======
function renderReviews() {
  const container = el('reviews-container');
  container.innerHTML = '';
  REVIEWS.forEach(review => {
    const div = document.createElement('div');
    div.className = 'review-card';
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
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

// Navigation
document.addEventListener('DOMContentLoaded',()=>{
  renderProducts(); updateCartUI(); renderReviews();
  el('view-products').onclick=()=>{ el('products').classList.remove('hidden'); el('cart').classList.add('hidden'); el('product-detail').classList.add('hidden'); el('checkout-form').classList.add('hidden'); };
  el('view-cart').onclick=()=>{ el('products').classList.add('hidden'); el('cart').classList.remove('hidden'); el('product-detail').classList.add('hidden'); el('checkout-form').classList.add('hidden'); };
  el('back-to-products').onclick=()=>{ el('product-detail').classList.add('hidden'); el('products').classList.remove('hidden'); };
  el('checkout-btn').onclick=showCheckoutForm;
  el('cancel-checkout').onclick=hideCheckoutForm;
});
