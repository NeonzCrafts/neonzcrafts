// ========== CONFIG ==========
const EMAILJS_SERVICE_ID = "service_al4zpdb";
const EMAILJS_TEMPLATE_ID = "template_vimeo5m";
const EMAILJS_PUBLIC_KEY = "CRkybtSL0tLoJJ71X";

// Sample product list
const PRODUCTS = [
  { id:'p1', title:'Wireless Earbuds', price:799, image:'https://via.placeholder.com/400x300?text=Earbuds', description:'Lightweight earbuds with good battery life.' },
  { id:'p2', title:'Phone Stand', price:249, image:'https://via.placeholder.com/400x300?text=Phone+Stand', description:'Adjustable phone stand for desk.' }
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
    card.innerHTML=`<img src="${p.image}" alt="${p.title}"/><h3>${p.title}</h3><p>${p.description}</p><div class="price">₹${formatPrice(p.price)}</div><div style="margin-top:8px"><button class="small" data-id="${p.id}">Add to cart</button></div>`;
    grid.appendChild(card);
  });
  container.innerHTML='<h2>Products</h2>'; container.appendChild(grid);
  container.querySelectorAll('button[data-id]').forEach(b=>{
    b.addEventListener('click',e=>addToCart(e.currentTarget.dataset.id,1));
  });
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
  el('products').classList.add('hidden'); el('cart').classList.add('hidden'); el('checkout-form').classList.remove('hidden');
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

// Add new address
el('add-address-btn').onclick=()=>{
  const name=prompt("Full Name"); if(!name)return;
  const phone=prompt("Phone Number"); if(!phone)return;
  const pincode=prompt("Pincode"); if(!pincode)return;
  const city=prompt("City"); if(!city)return;
  const street=prompt("Street / Area"); if(!street)return;
  const landmark=prompt("Landmark / Notes");
  addresses.push({name,phone,pincode,city,street,landmark});
  selectedAddressIndex=addresses.length-1; renderAddresses();
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
  const message=`New COD Order:\n\nName: ${addr.name}\nPhone: ${addr.phone}\nAddress:\n${addr.street}, ${addr.landmark}, ${addr.city}, ${addr.pincode}\n\nItems:\n${items}\n\nTotal: ₹${formatPrice(cartTotal())}`;
  emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    customer_name: addr.name,
    customer_phone: addr.phone,
    customer_address:`${addr.street}, ${addr.landmark}, ${addr.city}, ${addr.pincode}`,
    order_summary: items,
    order_total: formatPrice(cartTotal()),
    full_message: message
  }, EMAILJS_PUBLIC_KEY)
  .then(()=>{ alert("Order placed successfully! You'll be contacted soon."); cart={}; updateCartUI(); addresses=[]; selectedAddressIndex=null; hideCheckoutForm(); })
  .catch(err=>{ console.error(err); alert("Error sending order. Check EmailJS setup."); });
};

// Navigation
document.addEventListener('DOMContentLoaded',()=>{
  renderProducts(); updateCartUI();
  el('view-products').onclick=()=>{ el('products').classList.remove('hidden'); el('cart').classList.add('hidden'); };
  el('view-cart').onclick=()=>{ el('products').classList.add('hidden'); el('cart').classList.remove('hidden'); };
  el('checkout-btn').onclick=showCheckoutForm;
  el('cancel-checkout').onclick=hideCheckoutForm;
});