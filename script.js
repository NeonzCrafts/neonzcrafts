// ========== CONFIG ==========
const EMAILJS_SERVICE_ID = "service_al4zpdb";
const EMAILJS_TEMPLATE_ID = "template_vimeo5m";
const EMAILJS_PUBLIC_KEY = "CRkybtSL0tLoJJ71X";

// Sample product list
const PRODUCTS = [
  // Your product with a test image
  { 
    id:'p3', 
    title:'Educational Geometric Shape Sorting & Stacking Toys for 1 2 3 Year Old, Montessori Toys for Toddlers, Preschool Educational Color Shape Learning Toy Gift for Kids Girls Boys', 
    price:219, 
    image:'https://via.placeholder.com/400x300?text=Your+Product', 
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
      <div class="product-details-
      