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
const menuDateInput = document.getElementById('menu-date-input');
const btnSavePending = document.getElementById('btn-save-pending');
const btnFinalize = document.getElementById('btn-finalize');
const pendingContainer = document.getElementById('pending-container');
const historyContainer = document.getElementById('history-container');

// Mobile Accordion Elements
const calcPanel = document.getElementById('calc-panel');
const mobileCalcToggle = document.getElementById('mobile-calc-toggle');
const mobileTotalPreview = document.getElementById('mobile-total-preview');

// Modal Elements
const modal = document.getElementById('product-modal');
const closeModal = document.querySelector('.close-modal');
const productForm = document.getElementById('product-form');
const modalTitle = document.getElementById('modal-title');
const btnDeleteProd = document.getElementById('btn-delete-prod');

// Generic Modals
const msgModal = document.getElementById('message-modal');
const confirmModal = document.getElementById('confirm-modal');

// State
let products = [];
let currentSelection = {}; // Stores product IDs -> Quantity
let pendingMenus = [];
let historyMenus = [];
let currentPendingId = null; // Track if we are editing a pending menu
let confirmCallback = null; // Store callback for confirmation modal

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

    // Set default date to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    if (menuDateInput) menuDateInput.value = now.toISOString().slice(0, 16);

    // Initial total calculation (Base price)
    calculateTotal();

    // Hide Header on Scroll (Mobile) - Hide on UP, show on DOWN
    const sidebar = document.querySelector('.sidebar');
    let lastScrollTop = 0;

    window.addEventListener('scroll', () => {
        if (window.innerWidth > 768) return; // Only on mobile

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop < lastScrollTop && scrollTop > 50) {
            // Scrolling UP - hide header
            sidebar.classList.add('header-hidden');
        } else if (scrollTop > lastScrollTop || scrollTop <= 50) {
            // Scrolling DOWN or at top - show header
            sidebar.classList.remove('header-hidden');
        }

        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }, { passive: true });
});

function setupEventListeners() {
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const viewId = link.getAttribute('data-view');
            switchView(viewId);
        });
    });

    // Mobile Accordion Toggle
    // Mobile Accordion Toggle - ONLY on Button Click
    const btnToggleDetail = document.getElementById('btn-toggle-detail');
    if (btnToggleDetail) {
        btnToggleDetail.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent bubbling
            calcPanel.classList.toggle('expanded');
            btnToggleDetail.textContent = calcPanel.classList.contains('expanded') ? 'Ocultar Detalle' : 'Ver Detalle';
        });
    }

    // Prevent click on the header bar from toggling if not clicking the button
    if (mobileCalcToggle) {
        mobileCalcToggle.addEventListener('click', (e) => {
            // Do nothing if clicking the bar itself, only button triggers
            // e.stopPropagation(); 
        });
    }

    // Modal Closers
    if (closeModal) closeModal.addEventListener('click', hideModal);

    // Generic Modal Closers
    document.getElementById('close-msg-modal').addEventListener('click', () => msgModal.classList.add('hidden'));
    document.getElementById('btn-msg-ok').addEventListener('click', () => msgModal.classList.add('hidden'));

    document.getElementById('btn-confirm-cancel').addEventListener('click', () => confirmModal.classList.add('hidden'));
    document.getElementById('btn-confirm-ok').addEventListener('click', () => {
        if (confirmCallback) confirmCallback();
        confirmModal.classList.add('hidden');
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) hideModal();
        if (e.target === msgModal) msgModal.classList.add('hidden');
        if (e.target === confirmModal) confirmModal.classList.add('hidden');

        // Close mobile menu if clicking outside
        const mobileMenu = document.getElementById('mobile-menu');
        const hamburgerBtn = document.getElementById('hamburger-btn');
        if (mobileMenu && mobileMenu.classList.contains('active')) {
            if (!mobileMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
                mobileMenu.classList.remove('active');
            }
        }
    });

    // Hamburger Menu Toggle
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent immediate close
            mobileMenu.classList.toggle('active');
        });

        // Close menu when a link is clicked
        const mobileLinks = mobileMenu.querySelectorAll('li');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
            });
        });
    }

    // Add Product Buttons
    document.querySelectorAll('.add-prod-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = btn.getAttribute('data-cat');
            openProductModal(null, cat);
        });
    });

    // Form Submit
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }

    // Delete Product
    if (btnDeleteProd) {
        btnDeleteProd.addEventListener('click', handleDeleteProduct);
    }

    // Save/Finalize Buttons
    if (btnSavePending) btnSavePending.addEventListener('click', saveToPending);
    if (btnFinalize) btnFinalize.addEventListener('click', finalizeMenu);

    // Sorting
    const sortSelect = document.getElementById('sort-products');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            renderProducts(e.target.value);
        });
    }
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
    if (typeof db === 'undefined') {
        console.error("Firebase 'db' is not defined. Check firebase-config.js");
        return;
    }
    db.ref('products').on('value', (snapshot) => {
        const data = snapshot.val();
        products = [];
        if (data) {
            Object.keys(data).forEach(key => {
                const prod = data[key];
                // Defensive check: Ensure product has ID and basic fields
                if (prod) {
                    products.push({
                        id: key,
                        name: prod.name || 'Sin nombre',
                        price: prod.price || 0,
                        category: prod.category || 'primeros',
                        usageCount: prod.usageCount || 0
                    });
                }
            });
        }
        renderProducts();
    });
}

function loadPendingMenus() {
    if (typeof db === 'undefined') return;
    db.ref('pending_menus').on('value', (snapshot) => {
        const data = snapshot.val();
        pendingMenus = [];
        if (data) {
            Object.keys(data).forEach(key => {
                pendingMenus.push({ id: key, ...data[key] });
            });
        }
        // Sort LIFO (Newest first)
        pendingMenus.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        renderPendingMenus();
    });
}

function loadHistory() {
    if (typeof db === 'undefined') return;
    db.ref('history').on('value', (snapshot) => {
        const data = snapshot.val();
        historyMenus = [];
        if (data) {
            Object.keys(data).forEach(key => {
                historyMenus.push({ id: key, ...data[key] });
            });
        }
        // Sort LIFO (Newest first)
        historyMenus.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        renderHistory();
    });
}

// --- Rendering ---

function renderProducts(sortBy = 'name') {
    // Sort products
    let sortedProducts = [...products];
    if (sortBy === 'name') {
        sortedProducts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'price-asc') {
        sortedProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
        sortedProducts.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'popularity') {
        sortedProducts.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    }

    // Clear containers
    Object.values(containers).forEach(el => { if (el) el.innerHTML = ''; });

    sortedProducts.forEach(prod => {
        const isSelected = !!currentSelection[prod.id];
        const card = document.createElement('div');
        card.className = `product-card ${isSelected ? 'selected' : ''}`;

        // Explicit button logic, no card click
        card.innerHTML = `
            <div class="card-content">
                <span class="prod-name">${prod.name}</span>
                <span class="prod-price">${parseFloat(prod.price).toFixed(2)}€</span>
            </div>
            <div class="card-actions-row">
                <button class="btn-toggle-prod" onclick="toggleProductSelection('${prod.id}')">
                    ${isSelected ? 'Quitar' : 'Añadir'}
                </button>
                <button class="btn-edit-mini" onclick="openProductModal('${prod.id}')">Editar</button>
            </div>
        `;

        if (containers[prod.category]) {
            containers[prod.category].appendChild(card);
        }
    });
}

function formatDateHeader(dateString) {
    if (!dateString) return 'Fecha desconocida';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function renderPendingMenus() {
    if (!pendingContainer) return;
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
                <span class="history-date">${formatDateHeader(menu.date)}</span>
            </div>
            <div class="history-items">
                ${(menu.itemsNames || (menu.items ? menu.items.map(i => i.name) : [])).join(', ') || 'Sin detalles'}
            </div>
            <div class="history-footer-row">
                <div class="history-total-compact">
                    Total: ${parseFloat(menu.total || 0).toFixed(2)}€
                    <span>(${menu.perPerson ? parseFloat(menu.perPerson).toFixed(2) : '0.00'}€/p)</span>
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="btn-edit-compact" onclick="loadMenu('${menu.id}', true)">Editar</button>
                    <button class="btn-delete-compact" onclick="deletePending('${menu.id}')">Eliminar</button>
                </div>
            </div>
        `;
        pendingContainer.appendChild(card);
    });
}

function renderHistory() {
    if (!historyContainer) return;
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
                <span class="history-date">${formatDateHeader(menu.date)}</span>
            </div>
            <div class="history-items">
                ${(menu.itemsNames || (menu.items ? menu.items.map(i => i.name) : [])).join(', ') || 'Sin detalles'}
            </div>
            <div class="history-footer-row">
                <div class="history-total-compact">
                    Total: ${parseFloat(menu.total || 0).toFixed(2)}€
                    <span>(${menu.perPerson ? parseFloat(menu.perPerson).toFixed(2) : '0.00'}€/p)</span>
                </div>
                <button class="btn-delete-compact" onclick="deleteHistory('${menu.id}')">Eliminar</button>
            </div>
        `;
        historyContainer.appendChild(card);
    });
}

// --- Logic Actions ---

function toggleProductSelection(prodId) {
    if (currentSelection[prodId]) {
        delete currentSelection[prodId];
    } else {
        currentSelection[prodId] = 1;
    }
    renderProducts(document.getElementById('sort-products').value); // Re-render to show selection
    calculateTotal();
}

function updateQuantity(prodId, qty) {
    if (currentSelection[prodId]) {
        currentSelection[prodId] = parseInt(qty, 10);
        calculateTotal();
    }
}

function calculateTotal() {
    let foodTotal = 0;
    const selectedIds = Object.keys(currentSelection);

    selectedIds.forEach(id => {
        const prod = products.find(p => p.id === id);
        if (prod) {
            const qty = currentSelection[id];
            foodTotal += parseFloat(prod.price) * qty;
        }
    });

    const drinksTotal = PRICE_DRINK_PER_PERSON * PERSONS;
    const total = foodTotal + drinksTotal + PRICE_PAN;
    const perPerson = total / PERSONS;

    if (calcElements.food) calcElements.food.textContent = foodTotal.toFixed(2) + '€';
    if (calcElements.drinks) calcElements.drinks.textContent = drinksTotal.toFixed(2) + '€';
    if (calcElements.pan) calcElements.pan.textContent = PRICE_PAN.toFixed(2) + '€';
    if (calcElements.total) calcElements.total.textContent = total.toFixed(2) + '€';
    if (calcElements.perPerson) calcElements.perPerson.textContent = perPerson.toFixed(2) + '€';

    // Update mobile preview
    if (mobileTotalPreview) mobileTotalPreview.textContent = total.toFixed(2) + '€';

    // Render Selected List (Mobile/Desktop)
    const listContainer = document.getElementById('selected-products-list');
    if (listContainer) {
        if (selectedIds.length > 0) {
            listContainer.innerHTML = selectedIds.map(id => {
                const prod = products.find(p => p.id === id);
                if (!prod) return '';
                const qty = currentSelection[id];
                const lineTotal = (parseFloat(prod.price) * qty).toFixed(2);

                // Build options for native select
                let optionsHtml = '';
                for (let i = 1; i <= 10; i++) {
                    optionsHtml += `<option value="${i}" ${i === qty ? 'selected' : ''}>${i}</option>`;
                }

                /* racion-selector: created/updated by Antigravity - DO NOT MODIFY LOGIC */
                return `
                <div class="selected-item-row" data-base-price="${prod.price}">
                    <span class="item-name">${prod.name}</span>
                    
                    <select class="racion-selector" aria-label="Raciones" data-role="racion" onchange="updateQuantity('${id}', this.value)">
                        ${optionsHtml}
                    </select>

                    <span class="item-price">${lineTotal}€</span>
                    <button class="btn-remove-item" onclick="removeFromSelection('${prod.id}')">×</button>
                </div>
            `;
            }).join('');
        } else {
            listContainer.innerHTML = '<div style="text-align:center; color:#999; font-size:0.9rem;">Ningún plato seleccionado</div>';
        }
    }

    return { foodTotal, drinksTotal, total, perPerson };
}

function validateInputs() {
    let isValid = true;
    const name = menuNameInput ? menuNameInput.value.trim() : '';

    if (!name) {
        if (menuNameInput) menuNameInput.classList.add('input-error');
        isValid = false;
    } else {
        if (menuNameInput) menuNameInput.classList.remove('input-error');
    }

    // Clear error on input
    if (menuNameInput) {
        menuNameInput.addEventListener('input', () => menuNameInput.classList.remove('input-error'), { once: true });
    }

    return isValid;
}

function saveToPending() {
    if (!validateInputs()) {
        showMessageModal('Faltan datos', 'Por favor indica el Nombre del Menú.');
        return;
    }

    const name = menuNameInput ? menuNameInput.value.trim() : '';
    const dateVal = menuDateInput ? menuDateInput.value : '';
    if (Object.keys(currentSelection).length === 0) {
        showMessageModal('Menú vacío', 'Selecciona al menos un plato.');
        return;
    }

    const selectedIds = Object.keys(currentSelection);
    const selectedItemsNames = [];
    selectedIds.forEach(id => {
        const prod = products.find(p => p.id === id);
        if (prod) selectedItemsNames.push(prod.name);
    });

    const totals = calculateTotal(); // Ensure we have fresh totals

    const menuData = {
        name: name,
        table: '', // Combined with name now
        date: dateVal || new Date().toISOString(),
        items: selectedIds,
        itemsNames: selectedItemsNames,
        quantities: currentSelection, // Store quantities
        total: totals.total.toFixed(2),
        perPerson: totals.perPerson.toFixed(2)
    };

    if (currentPendingId) {
        db.ref(`pending_menus/${currentPendingId}`).update(menuData)
            .then(() => {
                showMessageModal('Éxito', 'Menú actualizado en pendientes.');
                collapseFooter();
                resetSelection();
            });
    } else {
        db.ref('pending_menus').push(menuData)
            .then(() => {
                showMessageModal('Éxito', 'Menú guardado en pendientes.');
                collapseFooter();
                resetSelection();
            })
            .catch(err => console.error(err));
    }
}

function finalizeMenu() {
    if (!validateInputs()) {
        showMessageModal('Faltan datos', 'Por favor indica el Nombre del Menú.');
        return;
    }

    const name = menuNameInput ? menuNameInput.value.trim() : '';
    const dateVal = menuDateInput ? menuDateInput.value : '';

    if (Object.keys(currentSelection).length === 0) {
        showMessageModal('Menú vacío', 'Selecciona al menos un plato.');
        return;
    }

    const selectedIds = Object.keys(currentSelection);
    const selectedItemsNames = [];
    selectedIds.forEach(id => {
        const prod = products.find(p => p.id === id);
        if (prod) selectedItemsNames.push(prod.name);
    });

    const totals = calculateTotal(); // Ensure we have fresh totals

    const menuData = {
        name: name || `Mesa ${new Date().toLocaleTimeString()}`,
        table: '', // Combined with name
        date: dateVal || new Date().toISOString(),
        items: selectedIds,
        itemsNames: selectedItemsNames,
        quantities: currentSelection,
        total: totals.total.toFixed(2),
        perPerson: totals.perPerson.toFixed(2)
    };

    // Update usage counts
    selectedIds.forEach(id => {
        const prod = products.find(p => p.id === id);
        if (prod) {
            const newCount = (prod.usageCount || 0) + 1;
            db.ref(`products/${prod.id}`).update({ usageCount: newCount });
        }
    });

    db.ref('history').push(menuData)
        .then(() => {
            // If it was a pending menu, remove it from pending
            if (currentPendingId) {
                db.ref(`pending_menus/${currentPendingId}`).remove();
            }
            showMessageModal('Éxito', 'Menú finalizado y guardado en historial.');
            collapseFooter();
            resetSelection();
        })
        .catch(err => console.error(err));
}

// Collapse mobile footer
function collapseFooter() {
    if (calcPanel) {
        calcPanel.classList.remove('expanded');
        const btnToggleDetail = document.getElementById('btn-toggle-detail');
        if (btnToggleDetail) btnToggleDetail.textContent = 'Ver Detalle';
    }
}

function resetSelection() {
    currentSelection = {};
    if (menuNameInput) menuNameInput.value = '';
    // Reset date to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    if (menuDateInput) menuDateInput.value = now.toISOString().slice(0, 16);

    currentPendingId = null; // Reset pending ID
    const sortVal = document.getElementById('sort-products') ? document.getElementById('sort-products').value : 'name';
    renderProducts(sortVal);
    calculateTotal();
}

// Custom Modal Functions
function showMessageModal(title, message) {
    document.getElementById('msg-modal-title').textContent = title;
    document.getElementById('msg-modal-body').textContent = message;
    msgModal.classList.remove('hidden');
}

function showConfirmModal(title, message, callback) {
    document.getElementById('confirm-modal-title').textContent = title;
    document.getElementById('confirm-modal-body').textContent = message;
    confirmCallback = callback;
    confirmModal.classList.remove('hidden');
}

function loadMenu(menuId, isPending) {
    const menu = isPending ? pendingMenus.find(m => m.id === menuId) : null;
    if (menu) {
        currentSelection = {};
        if (menu.quantities) {
            currentSelection = { ...menu.quantities };
        } else if (Array.isArray(menu.items)) {
            menu.items.forEach(id => {
                currentSelection[id] = 1;
            });
        }
        if (menuNameInput) menuNameInput.value = menu.name || '';
        // Handle date format for input
        if (menu.date && menuDateInput) {
            const d = new Date(menu.date);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            menuDateInput.value = d.toISOString().slice(0, 16);
        }

        if (isPending) {
            currentPendingId = menuId;
        } else {
            currentPendingId = null;
        }
        const sortVal = document.getElementById('sort-products') ? document.getElementById('sort-products').value : 'name';
        renderProducts(sortVal);
        calculateTotal();
        switchView('view-main-menu');
    }
}

function deletePending(id) {
    showConfirmModal('Borrar Menú', '¿Estás seguro de que quieres borrar este menú pendiente?', () => {
        db.ref(`pending_menus/${id}`).remove();
    });
}

function deleteHistory(id) {
    showConfirmModal('Borrar Historial', '¿Estás seguro de que quieres borrar este menú del historial?', () => {
        db.ref(`history/${id}`).remove();
    });
}

// --- Product CRUD ---

function openProductModal(prodId = null, category = 'primeros') {
    if (!modal) return;

    if (prodId) {
        const prod = products.find(p => p.id === prodId);
        // Defensive check
        if (!prod) {
            console.error('Product not found:', prodId);
            return;
        }
        if (modalTitle) modalTitle.textContent = 'Editar Producto';
        if (document.getElementById('prod-id')) document.getElementById('prod-id').value = prod.id;
        if (document.getElementById('prod-name')) document.getElementById('prod-name').value = prod.name;
        if (document.getElementById('prod-price')) document.getElementById('prod-price').value = prod.price;
        if (document.getElementById('prod-category')) document.getElementById('prod-category').value = prod.category;
        if (btnDeleteProd) btnDeleteProd.classList.remove('hidden');
    } else {
        if (modalTitle) modalTitle.textContent = 'Añadir Producto';
        if (document.getElementById('prod-id')) document.getElementById('prod-id').value = '';
        if (document.getElementById('prod-name')) document.getElementById('prod-name').value = '';
        if (document.getElementById('prod-price')) document.getElementById('prod-price').value = '';
        if (document.getElementById('prod-category')) document.getElementById('prod-category').value = category;
        if (btnDeleteProd) btnDeleteProd.classList.add('hidden');
    }
    modal.classList.remove('hidden');
}

function hideModal() {
    if (modal) modal.classList.add('hidden');
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
    if (id) {
        showConfirmModal('Eliminar Producto', '¿Seguro que quieres eliminar este producto?', () => {
            db.ref(`products/${id}`).remove();
            hideModal();
        });
    }
}

// Global scope for onclick handlers
window.openProductModal = openProductModal;
window.loadMenu = loadMenu;
window.deletePending = deletePending;
window.deleteHistory = deleteHistory;
window.toggleProductSelection = toggleProductSelection;
window.removeFromSelection = removeFromSelection;

// Function to remove product from selection (for × button)
function removeFromSelection(prodId) {
    if (currentSelection[prodId]) {
        delete currentSelection[prodId];
        renderProducts(document.getElementById('sort-products').value);
        calculateTotal();
    }
}
