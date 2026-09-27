
const PRODUCTS_API = "https://dummyjson.com/products?limit=0";
const BATCH_SIZE = 8;

// ---------- 1. AUTH GUARD ----------
const firstName = localStorage.getItem("firstName");

if (!firstName) {
    window.location.href = "login.html";
}

// ---------- 2. NAVBAR ----------
const welcomeText = document.getElementById("welcome-text");
const logoutBtn = document.getElementById("logout-btn");

if (welcomeText && firstName) {
    welcomeText.textContent = `Halo, ${firstName}`;
}

logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("firstName");
    window.location.href = "login.html";
});

// ---------- 3. STATE ----------
let allProducts = [];   // seluruh produk hasil fetch
let currentList = [];   // list aktif yang sedang ditampilkan (setelah search/filter/sort)
let displayedCount = BATCH_SIZE;

// ---------- 4. DOM REFERENCES ----------
const productGrid = document.getElementById("product-grid");
const globalError = document.getElementById("global-error");
const emptyState = document.getElementById("empty-state");
const resultInfo = document.getElementById("result-info");
const loadMoreBtn = document.getElementById("load-more-btn");
const categoryFilter = document.getElementById("category-filter");

const modal = document.getElementById("product-modal");
const modalClose = document.getElementById("modal-close");
const modalImg = document.getElementById("modal-img");
const modalCategory = document.getElementById("modal-category");
const modalTitle = document.getElementById("modal-title");
const modalBrand = document.getElementById("modal-brand");
const modalPrice = document.getElementById("modal-price");
const modalRating = document.getElementById("modal-rating");
const modalStock = document.getElementById("modal-stock");
const modalDesc = document.getElementById("modal-desc");
const modalAddCart = document.getElementById("modal-add-cart");

// ---------- 5. FETCH PRODUCTS ----------
async function loadProducts() {
    try {
        const response = await fetch(PRODUCTS_API);

        if (!response.ok) {
            throw new Error("Gagal mengambil data produk");
        }

        const data = await response.json();
        allProducts = data.products || [];
        currentList = allProducts;

        populateCategoryFilter(allProducts);
        renderGrid();

    } catch (error) {
        globalError.classList.remove("hidden");
        productGrid.innerHTML = "";
        loadMoreBtn.classList.add("hidden");
        console.error(error);
    }
}

function populateCategoryFilter(products) {
    if (!categoryFilter) return;

    const categories = [...new Set(products.map((p) => p.category))];

    categories.forEach((cat) => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        categoryFilter.appendChild(option);
    });
}

// ---------- 6. RENDER CARD GRID ----------
function renderGrid() {
    productGrid.innerHTML = "";

    const itemsToShow = currentList.slice(0, displayedCount);

    if (currentList.length === 0) {
        emptyState.classList.remove("hidden");
        resultInfo.textContent = "";
        loadMoreBtn.classList.add("hidden");
        return;
    }

    emptyState.classList.add("hidden");

    itemsToShow.forEach((product) => {
        productGrid.appendChild(buildProductCard(product));
    });

    resultInfo.textContent =
        `Menampilkan ${itemsToShow.length} dari ${currentList.length} produk`;

    // sembunyikan tombol load more jika semua sudah tampil
    if (displayedCount >= currentList.length) {
        loadMoreBtn.classList.add("hidden");
    } else {
        loadMoreBtn.classList.remove("hidden");
    }
}

function buildProductCard(product) {
    const card = document.createElement("article");
    card.className = "product-card";
    card.dataset.id = product.id;

    const discountBadge = product.discountPercentage
        ? `<span class="discount-badge">-${Math.round(product.discountPercentage)}%</span>`
        : "";

    card.innerHTML = `
        <div class="product-thumb-wrap">
            ${discountBadge}
            <img src="${product.thumbnail}" alt="${product.title}" loading="lazy">
        </div>
        <div class="product-info">
            <span class="product-category">${product.category}</span>
            <h3 class="product-name">${product.title}</h3>
            <div class="product-price-row">
                <span class="product-price">$${product.price}</span>
                <span class="product-rating">★ ${product.rating}</span>
            </div>
            <button class="add-cart-btn" data-action="add-cart" data-id="${product.id}">
                Tambah ke Keranjang
            </button>
        </div>
    `;

    return card;
}

// ---------- 7. LOAD MORE (PAGINATION) ----------
loadMoreBtn.addEventListener("click", () => {
    displayedCount += BATCH_SIZE;
    renderGrid();
});

// ---------- 8. MODAL DETAIL PRODUK (EVENT DELEGATION) ----------
// Satu listener terpasang di parent (#product-grid), menangani
// klik pada semua kartu produk, termasuk yang dirender ulang nantinya.
productGrid.addEventListener("click", (e) => {

    // Tombol "Tambah ke Keranjang" di dalam kartu tidak boleh membuka modal
    const addCartBtn = e.target.closest('[data-action="add-cart"]');
    if (addCartBtn) {
        e.stopPropagation();
        handleAddToCart(addCartBtn.dataset.id);
        return;
    }

    const card = e.target.closest(".product-card");
    if (!card) return;

    openModal(card.dataset.id);
});

function openModal(id) {
    const product = allProducts.find((p) => String(p.id) === String(id));
    if (!product) return;

    modalImg.src = product.thumbnail;
    modalImg.alt = product.title;
    modalCategory.textContent = product.category;
    modalTitle.textContent = product.title;
    modalBrand.textContent = product.brand ? `Brand: ${product.brand}` : "";
    modalPrice.textContent = `$${product.price}`;
    modalRating.textContent = `★ ${product.rating}`;
    modalStock.textContent = `Stok tersedia: ${product.stock}`;
    modalDesc.textContent = product.description;

    modalAddCart.dataset.id = product.id;

    modal.classList.remove("hidden");
}

function closeModal() {
    modal.classList.add("hidden");
}

modalClose.addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
});

modalAddCart.addEventListener("click", () => {
    handleAddToCart(modalAddCart.dataset.id);
});

// ---------- 9. ADD TO CART BRIDGE ----------
// CRUD keranjang sebenarnya diimplementasikan Anggota 3 di interaktif.js
// lewat window.Cart. katalog.js hanya memanggil interface tersebut.
function handleAddToCart(id) {
    const product = allProducts.find((p) => String(p.id) === String(id));
    if (!product) return;

    if (window.Cart && typeof window.Cart.addToCart === "function") {
        window.Cart.addToCart(product);
    } else {
        console.warn("Modul keranjang (interaktif.js) belum tersedia.");
    }
}

// ---------- 10. PUBLIC INTERFACE UNTUK interaktif.js ----------
window.Katalog = {
    getAllProducts: () => allProducts,
    setActiveList: (list) => {
        currentList = list;
        displayedCount = BATCH_SIZE;
        renderGrid();
    },
};

// ---------- 11. INIT ----------
loadProducts();