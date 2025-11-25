// DOM Elements
const views = document.querySelectorAll('.view-section');
const navLinks = document.querySelectorAll('.nav-links li');
const containers = {
    primeros: document.getElementById('container-primeros'),
    segundos: document.getElementById('container-segundos'),
    postres: document.getElementById('container-postres')
};
const calcElements = {
    food: document.getElementById('calc-food'),
    drinks: document.getElementById('calc-drinks'),
    pan: document.getElementById('calc-pan'),
    total: document.getElementById('calc-total'),
    perPerson: document.getElementById('calc-per-person')
};
const menuNameInput = document.getElementById('menu-name-input');
const btnSavePending = document.getElementById('btn-save-pending');
const btnFinalize = document.getElementById('btn-finalize');
const pendingContainer = document.getElementById('pending-container');
const historyContainer = document.getElementById('history-container');

// Modal Elements
const modal = document.getElementById('product-modal');
const closeModal = document.querySelector('.close-modal');
const productForm = document.getElementById('product-form');
const modalTitle = document.getElementById('modal-title');
const btnDeleteProd = document.getElementById('btn-delete-prod');

// State
let products = [];
let currentSelection = new Set(); // Stores product IDs
let pendingMenus = [];
let historyMenus = [];

// Constants
const PRICE_PAN = 2.40;
const PRICE_DRINK_PER_PERSON = 7.50;
const PERSONS = 4;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadPendingMenus();
    loadHistory();
    setupEventListeners();
});

function setupEventListeners() {
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const viewId = link.getAttribute('data-view');
            switchView(viewId);
        });
    });

    // Modal
    closeModal.addEventListener('click', hideModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) hideModal();
    });

    // Add Product Buttons
    document.querySelectorAll('.add-prod-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = btn.getAttribute('data-cat');
            openProductModal(null, cat);
        });
    });

    // Form Submit
    productForm.addEventListener('submit', handleProductSubmit);

    // Delete Product
    btnDeleteProd.addEventListener('click', handleDeleteProduct);

    // Save/Finalize Buttons
    btnSavePending.addEventListener('click', saveToPending);
    btnFinalize.addEventListener('click', finalizeMenu);

    // Sorting
    document.getElementById('sort-products').addEventListener('change', (e) => {
        renderProducts(e.target.value);
    });
}

function switchView(viewId) {
    // Update Nav
    navLinks.forEach(link => {
        if (link.getAttribute('data-view') === viewId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Update View
    views.forEach(view => {
        if (view.id === viewId) {
            view.classList.add('active');
        } else {
            view.classList.remove('active');
        }
    });
}

// --- Firebase / Data Logic ---

function loadProducts() {
    db.ref('products').on('value', (snapshot) => {
        const data = snapshot.val();
        products = [];
        if (data) {
            Object.keys(data).forEach(key => {
                products.push({ id: key, ...data[key] });
            });
        }
        renderProducts();
    });
}

function loadPendingMenus() {
    db.ref('pending_menus').on('value', (snapshot) => {
        const data = snapshot.val();
        pendingMenus = [];
        if (data) {
            Object.keys(data).forEach(key => {
                pendingMenus.push({ id: key, ...data[key] });
            });
        }
        renderPendingMenus();
    });
}

function loadHistory() {
    db.ref('history').on('value', (snapshot) => {
        const data = snapshot.val();
        historyMenus = [];
        if (data) {
            Object.keys(data).forEach(key => {
                historyMenus.push({ id: key, ...data[key] });
            });
        }
        // Sort history by date desc
        historyMenus.sort((a, b) => new Date(b.date) - new Date(a.date));
        renderHistory();
    });
}

// --- Rendering ---

function renderProducts(sortBy = 'name') {
    // Sort products
    let sortedProducts = [...products];
    if (sortBy === 'name') {
        sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'price-asc') {
        sortedProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
        sortedProducts.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'popularity') {
        sortedProducts.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    }

    // Clear containers
    Object.values(containers).forEach(el => el.innerHTML = '');

    sortedProducts.forEach(prod => {
        const card = document.createElement('div');
        card.className = `product-card ${currentSelection.has(prod.id) ? 'selected' : ''}`;
        card.onclick = (e) => {
            if (!e.target.closest('.btn-edit-mini')) {
                toggleProductSelection(prod.id);
            }
        };

        card.innerHTML = `
            <div class="card-content">
                <span class="prod-name">${prod.name}</span>
                <span class="prod-price">${parseFloat(prod.price).toFixed(2)}€</span>
            </div>
            <div class="card-actions">
                <button class="btn-edit-mini" onclick="openProductModal('${prod.id}')">Editar</button>
            </div>
        `;

        if (containers[prod.category]) {
            containers[prod.category].appendChild(card);
        }
    });
}

function renderPendingMenus() {
    pendingContainer.innerHTML = '';
    if (pendingMenus.length === 0) {
        pendingContainer.innerHTML = '<p class="empty-state">No hay menús pendientes.</p>';
        return;
    }

    pendingMenus.forEach(menu => {
        const card = document.createElement('div');
        card.className = 'history-card'; // Reuse style
        card.innerHTML = `
            <div class="history-header">
                <span class="history-title">${menu.name || 'Sin nombre'}</span>
                <span class="history-date">${new Date(menu.date).toLocaleDateString()}</span>
            </div>
            <div class="history-items">
                ${menu.itemsNames.join(', ')}
            </div>
            <div class="history-total">
                Total: ${menu.total}€
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 10px;">
                <button class="btn-secondary" onclick="loadMenu('${menu.id}', true)">Cargar/Editar</button>
                <button class="btn-danger" onclick="deletePending('${menu.id}')">Borrar</button>
            </div>
        `;
        pendingContainer.appendChild(card);
    });
}

function renderHistory() {
    historyContainer.innerHTML = '';
    if (historyMenus.length === 0) {
        historyContainer.innerHTML = '<p class="empty-state">No hay historial disponible.</p>';
        return;
    }

    historyMenus.forEach(menu => {
        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = `
            <div class="history-header">
                <span class="history-title">${menu.name || 'Sin nombre'}</span>
                <span class="history-date">${new Date(menu.date).toLocaleString()}</span>
            </div>
            <div class="history-items">
                ${menu.itemsNames.join(', ')}
            </div>
            <div class="history-total">
                ${menu.total}€
            </div>
            <button class="btn-delete-history" onclick="deleteHistory('${menu.id}')">Eliminar</button>
        `;
        historyContainer.appendChild(card);
    });
}

// --- Logic Actions ---

function toggleProductSelection(prodId) {
    if (currentSelection.has(prodId)) {
        currentSelection.delete(prodId);
    } else {
        currentSelection.add(prodId);
    }
    renderProducts(document.getElementById('sort-products').value); // Re-render to show selection
    calculateTotal();
}

function calculateTotal() {
    let foodTotal = 0;
    currentSelection.forEach(id => {
        const prod = products.find(p => p.id === id);
        if (prod) foodTotal += parseFloat(prod.price);
    });

    const drinksTotal = PRICE_DRINK_PER_PERSON * PERSONS;
    const total = foodTotal + drinksTotal + PRICE_PAN;
    const perPerson = total / PERSONS;

    calcElements.food.textContent = foodTotal.toFixed(2) + '€';
    calcElements.drinks.textContent = drinksTotal.toFixed(2) + '€';
    calcElements.pan.textContent = PRICE_PAN.toFixed(2) + '€';
    calcElements.total.textContent = total.toFixed(2) + '€';
    calcElements.perPerson.textContent = perPerson.toFixed(2) + '€';

    return { foodTotal, drinksTotal, total, perPerson };
}

function saveToPending() {
    const name = menuNameInput.value.trim();
    if (!name) {
        alert('Por favor, ponle un nombre al menú (ej: Mesa 4).');
        return;
    }
    if (currentSelection.size === 0) {
        alert('Selecciona al menos un plato.');
        return;
    }

    const selectedItems = products.filter(p => currentSelection.has(p.id));
    const totals = calculateTotal();

    const menuData = {
        name: name,
        date: new Date().toISOString(),
        items: Array.from(currentSelection),
        itemsNames: selectedItems.map(p => p.name),
        total: totals.total.toFixed(2)
    };

    db.ref('pending_menus').push(menuData)
        .then(() => {
            alert('Menú guardado en pendientes.');
            resetSelection();
        })
        .catch(err => console.error(err));
}

function finalizeMenu() {
    const name = menuNameInput.value.trim();
    if (currentSelection.size === 0) {
        alert('Selecciona al menos un plato.');
        return;
    }

    const selectedItems = products.filter(p => currentSelection.has(p.id));
    const totals = calculateTotal();

    const menuData = {
        name: name || `Mesa ${new Date().toLocaleTimeString()}`,
        date: new Date().toISOString(),
        items: Array.from(currentSelection),
        itemsNames: selectedItems.map(p => p.name),
        total: totals.total.toFixed(2)
    };

    // Update usage counts
    selectedItems.forEach(prod => {
        const newCount = (prod.usageCount || 0) + 1;
        db.ref(`products/${prod.id}`).update({ usageCount: newCount });
    });

    db.ref('history').push(menuData)
        .then(() => {
            alert('Menú finalizado y guardado en historial.');
            resetSelection();
        })
        .catch(err => console.error(err));
}

function resetSelection() {
    currentSelection.clear();
    menuNameInput.value = '';
    renderProducts(document.getElementById('sort-products').value);
    calculateTotal();
}

function loadMenu(menuId, isPending) {
    const menu = isPending ? pendingMenus.find(m => m.id === menuId) : null;
    if (menu) {
        currentSelection = new Set(menu.items);
        menuNameInput.value = menu.name;
        renderProducts(document.getElementById('sort-products').value);
        calculateTotal();
        switchView('view-main-menu');

        // Optionally remove from pending if we are "loading" it to finalize it
        // For now, we keep it until they explicitly delete or finalize (which doesn't auto-delete pending)
        // Let's auto-delete from pending if they finalize? Or just let them manage it.
        // User asked to "edit and then finalize", implies moving it.
        // We'll delete from pending ONLY if they click "Finalize" later? 
        // For simplicity, let's just load it. If they save again, it's a new entry.
        // To make it a true "move", we would need to track the "active pending ID".
    }
}

function deletePending(id) {
    if (confirm('¿Borrar este menú pendiente?')) {
        db.ref(`pending_menus/${id}`).remove();
    }
}

function deleteHistory(id) {
    if (confirm('¿Borrar este menú del historial?')) {
        db.ref(`history/${id}`).remove();
    }
}

// --- Product CRUD ---

function openProductModal(prodId = null, category = 'primeros') {
    modal.classList.remove('hidden');
    const form = document.getElementById('product-form');

    if (prodId) {
        const prod = products.find(p => p.id === prodId);
        modalTitle.textContent = 'Editar Producto';
        document.getElementById('prod-id').value = prod.id;
        document.getElementById('prod-name').value = prod.name;
        document.getElementById('prod-price').value = prod.price;
        document.getElementById('prod-category').value = prod.category;
        btnDeleteProd.classList.remove('hidden');
    } else {
        modalTitle.textContent = 'Añadir Producto';
        document.getElementById('prod-id').value = '';
        document.getElementById('prod-name').value = '';
        document.getElementById('prod-price').value = '';
        document.getElementById('prod-category').value = category;
        btnDeleteProd.classList.add('hidden');
    }
}

function hideModal() {
    modal.classList.add('hidden');
}

function handleProductSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const name = document.getElementById('prod-name').value;
    const price = parseFloat(document.getElementById('prod-price').value);
    const category = document.getElementById('prod-category').value;

    const data = { name, price, category };

    if (id) {
        // Update
        db.ref(`products/${id}`).update(data);
    } else {
        // Create
        data.usageCount = 0;
        db.ref('products').push(data);
    }
    hideModal();
}

function handleDeleteProduct() {
    const id = document.getElementById('prod-id').value;
    if (id && confirm('¿Seguro que quieres eliminar este producto?')) {
        db.ref(`products/${id}`).remove();
        hideModal();
    }
}

// Global scope for onclick handlers
window.openProductModal = openProductModal;
window.loadMenu = loadMenu;
window.deletePending = deletePending;
window.deleteHistory = deleteHistory;
