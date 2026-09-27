// KONFIGURASI & SELEKTOR DOM
const STORAGE_KEY_CART = "miniShopeeCart";

const searchInput = document.getElementById("search-input");
const sortControl = document.getElementById("sort-control");
const cartBtn = document.getElementById("cart-btn");

let cartTotalText = document.getElementById("cart-total-text");
if (cartBtn && !cartTotalText) {
    cartTotalText = document.createElement("span");
    cartTotalText.id = "cart-total-text";
    cartTotalText.style.marginLeft = "4px";
    const badge = document.getElementById("cart-badge");
    cartBtn.insertBefore(cartTotalText, badge);
}

// PENCARIAN REAL-TIME (DEBOUNCE & CLOSURES)
function createDebounce(callback, delay = 350) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            callback.apply(this, args);
        }, delay);
    };
}

// FILTER & SORTING
function applyFilterAndSort() {
    if (!window.Katalog || typeof window.Katalog.getAllProducts !== "function") {
        return;
    }

    const masterProducts = window.Katalog.getAllProducts();
    const keyword = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const selectedCategory = categoryFilter ? categoryFilter.value : "all";
    const selectedSort = sortControl ? sortControl.value : "default";

    let filtered = masterProducts
        .filter((product) => {
            if (!keyword) return true;
            const matchTitle = product.title.toLowerCase().includes(keyword);
            const matchCategory = product.category.toLowerCase().includes(keyword);
            return matchTitle || matchCategory;
        })
        .filter((product) => {
            if (selectedCategory === "all" || !selectedCategory) return true;
            return product.category.toLowerCase() === selectedCategory.toLowerCase();
        });

    if (selectedSort === "price-asc") {
        filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (selectedSort === "price-desc") {
        filtered = [...filtered].sort((a, b) => b.price - a.price);
    } else if (selectedSort === "rating-desc") {
        filtered = [...filtered].sort((a, b) => b.rating - a.rating);
    }

    window.Katalog.setActiveList(filtered);
}

// KERANJANG BELANJA SEDERHANA 
function getCart() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_CART);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveCart(cartArray) {
    if (cartArray.length === 0) {
        localStorage.removeItem(STORAGE_KEY_CART);
    } else {
        localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cartArray));
    }
    updateCartUI();
}

function addToCart(product) {
    if (!product || !product.id) return;

    const cart = getCart();
    const existingItem = cart.find((item) => String(item.id) === String(product.id));

    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            price: Number(product.price),
            qty: 1
        });
    }

    saveCart(cart);
}

function clearCart() {
    localStorage.removeItem(STORAGE_KEY_CART);
    updateCartUI();
}

function updateCartUI() {
    const cart = getCart();
    const currentBadge = document.getElementById("cart-badge");
    const currentTotalText = document.getElementById("cart-total-text");

    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    if (currentBadge) {
        currentBadge.textContent = totalItems;
    }

    if (currentTotalText) {
        currentTotalText.textContent = `($${totalPrice.toFixed(2)})`;
    }
}

// Fitur ketika tombol Keranjang diklik
function handleCartClick() {
    const cart = getCart();

    if (cart.length === 0) {
        alert("Keranjang belanja kamu masih kosong.");
        return;
    }

    const itemListText = cart
        .map((item, idx) => `${idx + 1}. ${item.title} (x${item.qty}) - $${(item.price * item.qty).toFixed(2)}`)
        .join("\n");

    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    const isConfirmCheckout = confirm(
        `RINGKASAN KERANJANG BELANJA:\n\n${itemListText}\n\n` +
        `Total Barang: ${totalItems} item\n` +
        `Total Harga: $${totalPrice.toFixed(2)}\n\n` +
        `Klik "OK" untuk Checkout / Kosongkan Keranjang, atau "Cancel" untuk lanjut belanja.`
    );

    if (isConfirmCheckout) {
        clearCart();
        alert("Terima kasih! Pesanan berhasil diproses dan keranjang telah dikosongkan.");
    }
}

// EKSPOR INTERFACE KE GLOBAL
window.Cart = {
    addToCart: addToCart,
    getCart: getCart,
    clearCart: clearCart
};

// INISIALISASI EVENT LISTENER
const debouncedFilter = createDebounce(applyFilterAndSort, 350);

if (searchInput) {
    searchInput.addEventListener("input", debouncedFilter);
}

if (categoryFilter) {
    categoryFilter.addEventListener("change", applyFilterAndSort);
}

if (sortControl) {
    sortControl.addEventListener("change", applyFilterAndSort);
}

if (cartBtn) {
    cartBtn.addEventListener("click", handleCartClick);
}

updateCartUI();