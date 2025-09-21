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
  const panel=$('products-panel'); if(!panel)return;
  panel.innerHTML='';
  const p=PRODUCTS[0];
  const card=document.createElement('article'); card.className='product-card';
  card.innerHTML=`
    <div class="carousel-container">
      <div class="carousel-images">
        ${p.images.map(src=>`<img src="${src}" alt="${p.title}">`).join('')}
      </div>
      <div class="carousel-dots">
        ${p.images.map((_,i)=>`<div class="carousel-dot ${i===0?'active':''}" data-index="${i}"></div>`).join('')}
      </div>
    </div>
    <div class="product-body">
      <h3 class="product-title">${p.title}</h3>
      <div class="price-row">
        ${p.originalPrice?`<div class="price-original">₹${p.originalPrice}</div>`:''}
        <div class="price-current">₹${p.price}</div>
      </div>
      <p class="muted" style="text-align:center">${p.desc}</p>
      <div style="margin-top:8px;display:flex;gap:8px;align-items:center;">
        <input type="number" min="1" value="1" class="mini-qty" style="width:72px;padding:8px;border-radius:8px;border:1px solid #eee">
        <button class="btn btn-primary add-js">Add to Cart</button>
      </div>
    </div>`;
  panel.appendChild(card);

  // Carousel logic
  const imgContainer=card.querySelector('.carousel-images');
  const dots=card.querySelectorAll('.carousel-dot');
  let idx=0;
  function showSlide(i){
    idx=i;
    imgContainer.style.transform=`translateX(-${idx*100}%)`;
    dots.forEach((d,di)=>d.classList.toggle('active',di===idx));
  }
  dots.forEach(d=>d.addEventListener('click',()=>showSlide(Number(d.dataset.index))));

  const qty=card.querySelector('.mini-qty'),btn=card.querySelector('.add-js');
  btn.addEventListener('click',()=>{ addToCart(p.id,Number(qty.value)||1); alert('Added to cart'); });
}

document.addEventListener('DOMContentLoaded',()=>{
  updateCartBadge(loadCart());
  if($('products-panel')) renderProductsPage();
});
