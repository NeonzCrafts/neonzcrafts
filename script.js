const STORAGE_KEYS = { cart: 'neon_cart_v2', addresses: 'neon_addresses_v2' };

const PRODUCTS = [
  {
    id: 'p1',
    title: 'Educational Geometric Shape Toy',
    price: 299,
    originalPrice: 399,
    images: ['1000069559.jpg','1000069560.jpg','1000069561.jpg'],
    desc: 'Interactive and colorful shape toy to improve cognitive skills for toddlers.'
  }
];

function $(id){ return document.getElementById(id); }
function safeParse(raw,fallback){ try{ return JSON.parse(raw||'null')||fallback }catch{ return fallback } }

function loadCart(){ return safeParse(localStorage.getItem(STORAGE_KEYS.cart),[]); }
function saveCart(c){ localStorage.setItem(STORAGE_KEYS.cart,JSON.stringify(c)); updateCartBadge(c); }
function updateCartBadge(c){ const cnt=c.reduce((s,i)=>s+i.qty,0); document.querySelectorAll('#cart-count').forEach(el=>el.textContent=cnt); }
function addToCart(id,qty=1){ let c=loadCart(); const i=c.findIndex(x=>x.id===id); i>=0?c[i].qty+=qty:c.push({id,qty}); saveCart(c); }

function renderProductsPage(){
  const panel = $('products-panel');
  if (!panel) return;
  panel.innerHTML = '';
  const p = PRODUCTS[0];
  const card = document.createElement('article');
  card.className = 'product-card';
  card.innerHTML = `
    <div class="carousel-container">
      <div class="carousel-images">${p.images.map(src=>`<img src="${src}" alt="${p.title}">`).join('')}</div>
      <div class="carousel-dots">${p.images.map((_,i)=>`<div class="carousel-dot ${i===0?'active':''}" data-index="${i}"></div>`).join('')}</div>
    </div>
    <div class="product-body">
      <h3 class="product-title">${p.title}</h3>
      <div class="price-row">
        ${p.originalPrice?`<div class="price-original">₹${p.originalPrice}</div>`:''}
        <div class="price-current">₹${p.price}</div>
      </div>
      <p class="muted">${p.desc}</p>
    </div>`;
  panel.appendChild(card);

  card.addEventListener('click',()=>openProductModal(p));
}

function openProductModal(product){
  const modal=$('product-modal');
  const body=$('modal-body');
  modal.classList.remove('hidden');
  body.innerHTML=`
    <div class="modal-images">${product.images.map(src=>`<img src="${src}" alt="${product.title}">`).join('')}</div>
    <div class="modal-body-title">${product.title}</div>
    <div class="price-current">₹${product.price}</div>
    <p class="muted">${product.desc}</p>
    <div class="modal-actions">
      <button class="btn btn-primary" id="modal-add">Add to Cart</button>
      <button class="btn btn-secondary" id="modal-buy">Buy Now</button>
    </div>`;
  $('modal-add').addEventListener('click',()=>{ addToCart(product.id,1); alert('Added to cart'); });
  $('modal-buy').addEventListener('click',()=>buyNow(product.id));
  document.querySelector('.modal-close').onclick=()=>modal.classList.add('hidden');
  modal.onclick=(e)=>{ if(e.target===modal) modal.classList.add('hidden'); };
}

function renderCartPage(){
  const panel=$('cart-items');
  if (!panel) return;
  const cart=loadCart();
  panel.innerHTML='';
  if(cart.length===0){ panel.innerHTML='<p style="text-align:center;color:#aaa">Your cart is empty.</p>'; updateCartTotals(0); return; }
  let subtotal=0;
  cart.forEach(item=>{
    const p=PRODUCTS.find(pr=>pr.id===item.id);
    if(!p)return;
    subtotal+=p.price*item.qty;
    const row=document.createElement('div');
    row.className='cart-item';
    row.innerHTML=`
      <img src="${p.images[0]}" alt="${p.title}" class="cart-thumb">
      <div class="cart-details">
        <h4>${p.title}</h4>
        <div class="cart-price">₹${p.price} × ${item.qty} = <strong>₹${p.price*item.qty}</strong></div>
        <button class="btn btn-secondary btn-sm">Remove</button>
      </div>`;
    row.querySelector('button').addEventListener('click',()=>removeFromCart(item.id));
    panel.appendChild(row);
  });
  updateCartTotals(subtotal);
}

function updateCartTotals(subtotal){
  if($('subtotal')) $('subtotal').textContent=`₹${subtotal}`;
  if($('shipping')) $('shipping').textContent='Free';
  if($('total')) $('total').textContent=`₹${subtotal}`;
}

function removeFromCart(id){
  let cart=loadCart();
  cart=cart.filter(c=>c.id!==id);
  saveCart(cart);
  renderCartPage();
}

function renderCheckoutPage(){
  const cart=loadCart();
  let subtotal=0;
  cart.forEach(item=>{ const p=PRODUCTS.find(pr=>pr.id===item.id); if(p) subtotal+=p.price*item.qty; });
  updateCartTotals(subtotal);
}

function buyNow(id){
  saveCart([{id,qty:1}]);
  window.location.href='checkout.html';
}

function editAddress(){
  localStorage.removeItem('neon_address');
  location.reload();
}

async function sendOrderEmail(savedAddress, cart, subtotal){
  try{
    const cartHTML=cart.map(item=>{
      const p=PRODUCTS.find(pr=>pr.id===item.id);
      return `<div>${p.title} × ${item.qty} = ₹${p.price*item.qty}</div>`;
    }).join('');
    await emailjs.send("service_al4zpdb","template_vimeo5m",{
      name:savedAddress.name,
      phone:savedAddress.phone,
      street:savedAddress.street,
      city:savedAddress.city,
      pincode:savedAddress.pincode,
      cart:cartHTML,
      total:subtotal
    });
    return true;
  }catch(err){ console.error("EmailJS failed:",err); return false; }
}

document.addEventListener('DOMContentLoaded',()=>{
  updateCartBadge(loadCart());
  renderProductsPage();
  renderCartPage();
  renderCheckoutPage();

  const form=$('address-form');
  if(form){
    form.addEventListener('submit',e=>{
      e.preventDefault();
      if(!form.checkValidity()){ form.reportValidity(); return; }
      const addressData={ name:form.name.value.trim(), phone:form.phone.value.trim(), street:form.street.value.trim(), city:form.city.value.trim(), pincode:form.pincode.value.trim() };
      localStorage.setItem('neon_address',JSON.stringify(addressData));
      $('saved-address-text').textContent=`${addressData.name}, ${addressData.street}, ${addressData.city} - ${addressData.pincode} (📞 ${addressData.phone})`;
      form.classList.add('hidden');
      $('saved-address').classList.remove('hidden');
    });
    const saved=localStorage.getItem('neon_address');
    if(saved){
      const a=JSON.parse(saved);
      $('saved-address-text').textContent=`${a.name}, ${a.street}, ${a.city} - ${a.pincode} (📞 ${a.phone})`;
      form.classList.add('hidden');
      $('saved-address').classList.remove('hidden');
    }
  }

  const placeOrderBtn=$('place-order');
  if(placeOrderBtn){
    placeOrderBtn.addEventListener('click',async e=>{
      e.preventDefault();
      const cart=loadCart();
      if(cart.length===0) return alert('Your cart is empty!');
      const saved=localStorage.getItem('neon_address');
      if(!saved) return alert('Please save your shipping address.');
      const addr=JSON.parse(saved);
      const subtotal=cart.reduce((sum,item)=>{const p=PRODUCTS.find(pr=>pr.id===item.id); return p?sum+p.price*item.qty:sum;},0);
      const success=await sendOrderEmail(addr,cart,subtotal);
      if(success){
        localStorage.removeItem(STORAGE_KEYS.cart);
        updateCartBadge([]);
        window.location.href='order-success.html';
      } else alert("Failed to send order.");
    });
  }

  const themeToggle=$('theme-toggle');
  if(themeToggle){
    const savedTheme=localStorage.getItem('theme');
    if(savedTheme) document.documentElement.dataset.theme=savedTheme;
    themeToggle.addEventListener('click',()=>{
      const current=document.documentElement.dataset.theme==='dark'?'light':'dark';
      document.documentElement.dataset.theme=current;
      localStorage.setItem('theme',current);
    });
  }
});
