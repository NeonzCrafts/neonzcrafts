const STORAGE_KEYS = { cart: 'neon_cart_v2' };

const PRODUCTS = [
  {
    id: 'p1',
    title: 'Educational Geometric Shape Toy',
    price: 299,
    originalPrice: 399,
    images: ['1000069559.jpg','1000069560.jpg','1000069561.jpg'],
    desc: 'Interactive and colorful shape toy to improve cognitive skills for toddlers.'
  }
  {
    id: 'p2',
    title: 'Educational Geometric Shape Toy',
    price: 199,
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

function addToCart(id,qty=1){
  let c=loadCart();
  const i=c.findIndex(x=>x.id===id);
  i>=0 ? c[i].qty+=qty : c.push({id,qty});
  saveCart(c);
  window.location.href='cart.html';
}

function renderProductsPage(){
  const panel=$('products-panel');
  if(!panel) return;
  panel.innerHTML='';
  PRODUCTS.forEach(p=>{
    const card=document.createElement('article');
    card.className='product-card';
    card.innerHTML=`
      <img src="${p.images[0]}" alt="${p.title}">
      <div class="product-body">
        <h3 class="product-title">${p.title}</h3>
        <div class="price-row">
          ${p.originalPrice?`<div class="price-original">₹${p.originalPrice}</div>`:''}
          <div class="price-current">₹${p.price}</div>
        </div>
      </div>`;
    card.addEventListener('click',()=>openProductModal(p));
    panel.appendChild(card);
  });
}

function openProductModal(product){
  const modal=$('product-modal');
  const body=$('modal-body');
  modal.classList.remove('hidden');
  body.innerHTML=`
    <h3>${product.title}</h3>
    <img src="${product.images[0]}" style="width:100%;border-radius:8px;">
    <p>${product.desc}</p>
    <div class="price-current">₹${product.price}</div>
    <button class="btn btn-primary full-width" id="modal-add">Add to Cart</button>
    <button class="btn btn-secondary full-width" id="modal-buy">Buy Now</button>`;
  $('modal-add').onclick=()=>addToCart(product.id,1);
  $('modal-buy').onclick=()=>{ saveCart([{id:product.id,qty:1}]); window.location.href='checkout.html'; };
  document.querySelector('.modal-close').onclick=()=>modal.classList.add('hidden');
}

function renderCartPage(){
  const panel=$('cart-items');
  if(!panel) return;
  const cart=loadCart();
  panel.innerHTML='';
  if(cart.length===0){
    panel.innerHTML='<p style="text-align:center;color:#aaa">Your cart is empty.</p>';
    disableCheckout();
    return;
  }
  let subtotal=0;
  cart.forEach(item=>{
    const p=PRODUCTS.find(pr=>pr.id===item.id);
    if(!p)return;
    subtotal+=p.price*item.qty;
    const row=document.createElement('div');
    row.className='cart-item';
    row.innerHTML=`
      <img src="${p.images[0]}" class="cart-thumb">
      <div class="cart-details">
        <h4>${p.title}</h4>
        <div class="cart-price">₹${p.price} × ${item.qty} = <strong>₹${p.price*item.qty}</strong></div>
        <button class="btn btn-secondary btn-sm">Remove</button>
      </div>`;
    row.querySelector('button').onclick=()=>removeFromCart(item.id);
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

function disableCheckout(){
  const btn=document.querySelector('#checkout-btn');
  if(btn){
    btn.disabled=true;
    btn.onclick=()=>alert('Please add item first!');
  }
}

document.addEventListener('DOMContentLoaded',()=>{
  updateCartBadge(loadCart());
  renderProductsPage();
  renderCartPage();
});
