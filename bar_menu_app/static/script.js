document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration & Constants ---
    const DINERS = 4;
    const DRINK_PRICE_PER_PERSON = 7.50;
    const FIXED_PAN_PRICE = 2.40;
    const STORAGE_KEY_PRODUCTS = 'bar_menu_products';
    const STORAGE_KEY_HISTORY = 'bar_menu_history';
    const STORAGE_KEY_PENDING = 'bar_menu_pending';

    // Default Products
    const DEFAULT_PRODUCTS = [
        // Primeros
        { id: 101, name: "Ensalada mixta", price: 5.00, category: "primeros" },
        { id: 102, name: "Ensalada completa", price: 7.00, category: "primeros" },
        // Segundos
        { id: 201, name: "Callos", price: 9.00, category: "segundos" },
        { id: 202, name: "Albóndigas con patatas/arroz", price: 12.50, category: "segundos" },
        { id: 203, name: "Tortilla", price: 12.00, category: "segundos" },
        { id: 204, name: "Chipirones con patatas", price: 13.00, category: "segundos" },
        { id: 205, name: "Calamares a la romana", price: 13.00, category: "segundos" },
        { id: 206, name: "Zorza", price: 12.00, category: "segundos" },
        { id: 207, name: "Raxo Pollo", price: 12.50, category: "segundos" },
        { id: 208, name: "Raxo Cerdo", price: 12.50, category: "segundos" },
        { id: 209, name: "Lacón A Feira", price: 13.00, category: "segundos" },
        { id: 210, name: "Pulpo a la gallega", price: 17.00, category: "segundos" },
        { id: 211, name: "Cachopo", price: 24.00, category: "segundos" },
        { id: 212, name: "Huevos rotos con chistorra", price: 12.00, category: "segundos" },
        { id: 213, name: "Cazón en adobo", price: 13.00, category: "segundos" },
        { id: 214, name: "Tortitas de camarones", price: 13.00, category: "segundos" },
        { id: 215, name: "Arroz a la cubana", price: 11.00, category: "segundos" },
        { id: 216, name: "Puntillas", price: 13.00, category: "segundos" },
        { id: 217, name: "Patatas 3 salsas", price: 11.00, category: "segundos" },
        { id: 218, name: "Patatas alioli", price: 9.00, category: "segundos" },
        { id: 219, name: "Patatas bravas", price: 9.00, category: "segundos" },
        { id: 220, name: "Tostitas de salmorejo", price: 13.00, category: "segundos" },
        { id: 221, name: "Croquetas (Variadas)", price: 10.00, category: "segundos" }, // Price editable
        // Postres
        { id: 301, name: "Tarta de la abuela", price: 4.00, category: "postres" },
        { id: 302, name: "Tarta de queso semifría", price: 4.00, category: "postres" },
        { id: 303, name: "Helado", price: 1.50, category: "postres" }
    ];

    // --- State ---
    let products = [];
    let history = [];
    let pendingMenus = [];
    let db = null; // Firebase DB instance

    // --- DOM Elements ---
    const containers = {
        primeros: document.getElementById('container-primeros'),
        segundos: document.getElementById('container-segundos'),
        postres: document.getElementById('container-postres')
    };
    const addForm = document.getElementById('add-product-form');
    const summaryEls = {
        food: document.getElementById('sum-food'),
        drinks: document.getElementById('sum-drinks'),
        pan: document.getElementById('sum-pan'),
        total: document.getElementById('sum-total'),
        perPerson: document.getElementById('sum-per-person')
    };
    const saveMenuBtn = document.getElementById('save-menu-btn');
    const savePendingBtn = document.getElementById('save-pending-btn');
    const menuNameInput = document.getElementById('menu-name-input');
    const historyList = document.getElementById('history-list');
    const pendingList = document.getElementById('pending-list');
    const pendingSection = document.getElementById('pending-section');
    const sortSelect = document.getElementById('sort-products');

    // Edit Modal Elements
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-product-form');
    const deleteBtn = document.getElementById('delete-prod-btn');
    const closeModalBtn = document.querySelector('.close-btn');

    // --- Initialization ---
    init();

    async function init() {
        // Initialize Firebase if config exists
        if (typeof firebaseConfig !== 'undefined' && firebaseConfig.apiKey !== "YOUR_API_KEY") {
            try {
                firebase.initializeApp(firebaseConfig);
                db = firebase.database();
                console.log("Firebase initialized");
            } catch (e) {
                console.error("Firebase init error:", e);
            }
        }

        await loadProducts();
        await loadHistory();
        await loadPending();
        renderProducts();
        renderHistory();
        renderPending();
        calculateTotal(); // Initial calc
    }

    // --- Data Management ---
    async function loadProducts() {
        // Try Firebase first
        if (db) {
            const snapshot = await db.ref('products').once('value');
            const val = snapshot.val();
            if (val) {
                products = val;
                return;
            }
        }

        // Fallback to LocalStorage
        const stored = localStorage.getItem(STORAGE_KEY_PRODUCTS);
        if (stored) {
            products = JSON.parse(stored);
        } else {
            products = [...DEFAULT_PRODUCTS];
            saveProducts();
        }
    }

    async function saveProducts() {
        if (db) {
            db.ref('products').set(products);
        }
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
    }

    async function loadHistory() {
        if (db) {
            const snapshot = await db.ref('history').once('value');
            const val = snapshot.val();
            if (val) {
                history = val;
                return;
            }
        }
        const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
        if (stored) history = JSON.parse(stored);
    }

    async function saveHistory() {
        if (db) {
            db.ref('history').set(history);
        }
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    }

    async function loadPending() {
        if (db) {
            const snapshot = await db.ref('pending').once('value');
            const val = snapshot.val();
            if (val) {
                pendingMenus = val;
                return;
            }
        }
        const stored = localStorage.getItem(STORAGE_KEY_PENDING);
        if (stored) pendingMenus = JSON.parse(stored);
    }

    async function savePending() {
        if (db) {
            db.ref('pending').set(pendingMenus);
        }
        localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify(pendingMenus));
    }

    // --- Rendering ---
    function renderProducts() {
        // Clear containers
        Object.values(containers).forEach(c => c.innerHTML = '');

        products.forEach(prod => {
            const card = createProductCard(prod);
            if (containers[prod.category]) {
                containers[prod.category].appendChild(card);
            }
        });
    }

    function createProductCard(prod) {
        const div = document.createElement('div');
        div.className = 'product-card';
        div.dataset.id = prod.id;

        div.innerHTML = `
            <div class="checkbox-wrapper">
                <input type="checkbox" id="prod-${prod.id}" value="${prod.id}">
                <label for="prod-${prod.id}">
                    <span class="prod-name">${prod.name}</span>
                    <span class="prod-price">${parseFloat(prod.price).toFixed(2)}€</span>
                </label>
            </div>
            <button class="edit-btn" title="Editar">✏️</button>
        `;

        // Event Listeners
        const checkbox = div.querySelector('input');
        checkbox.addEventListener('change', () => {
            div.classList.toggle('selected', checkbox.checked);
            calculateTotal();
        });

        const editBtn = div.querySelector('.edit-btn');
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent checking the box
            openEditModal(prod);
        });

        return div;
    }

    function renderHistory() {
        historyList.innerHTML = '';
        if (history.length === 0) {
            historyList.innerHTML = '<p class="empty-msg">No hay menús guardados.</p>';
            return;
        }

        // Show latest first
        [...history].reverse().forEach((menu, index) => {
            // Original index is needed for deletion/referencing
            const originalIndex = history.length - 1 - index;

            const div = document.createElement('div');
            div.className = 'history-item';

            const itemNames = menu.items.map(i => i.name).join(', ');
            const menuName = menu.name ? `<span class="menu-name-tag">${menu.name}</span>` : '';

            div.innerHTML = `
                <div class="history-header">
                    <div class="history-info">
                        ${menuName}
                        <span class="history-total">Total: ${menu.total.toFixed(2)}€ (${menu.perPerson.toFixed(2)}€/p)</span>
                    </div>
                    <div class="history-actions">
                        <button class="btn-use-menu" data-idx="${originalIndex}" title="Cargar menú">📂</button>
                        <button class="btn-delete-menu" data-idx="${originalIndex}" title="Eliminar">🗑️</button>
                    </div>
                </div>
                <div class="history-items-list">${itemNames}</div>
            `;

            historyList.appendChild(div);
        });

        // Add listeners
        document.querySelectorAll('.btn-use-menu').forEach(btn => {
            btn.addEventListener('click', () => loadMenuFromHistory(parseInt(btn.dataset.idx)));
        });
        document.querySelectorAll('.btn-delete-menu').forEach(btn => {
            btn.addEventListener('click', () => deleteHistoryItem(parseInt(btn.dataset.idx)));
        });
    }

    function renderPending() {
        pendingList.innerHTML = '';
        if (pendingMenus.length === 0) {
            pendingSection.style.display = 'none';
            return;
        }
        pendingSection.style.display = 'block';

        pendingMenus.forEach((menu, index) => {
            const div = document.createElement('div');
            div.className = 'history-item pending-item';

            const itemNames = menu.items.map(i => i.name).join(', ');
            const menuName = menu.name ? `<span class="menu-name-tag">${menu.name}</span>` : '<span class="menu-name-tag">Sin nombre</span>';

            div.innerHTML = `
                <div class="history-header">
                    <div class="history-info">
                        ${menuName}
                        <span class="history-total">Total: ${menu.total.toFixed(2)}€</span>
                    </div>
                    <div class="history-actions">
                        <button class="btn-use-pending" data-idx="${index}" title="Cargar y Finalizar">✅</button>
                        <button class="btn-delete-pending" data-idx="${index}" title="Eliminar">🗑️</button>
                    </div>
                </div>
                <div class="history-items-list">${itemNames}</div>
            `;

            pendingList.appendChild(div);
        });

        document.querySelectorAll('.btn-use-pending').forEach(btn => {
            btn.addEventListener('click', () => loadPendingMenu(parseInt(btn.dataset.idx)));
        });
        document.querySelectorAll('.btn-delete-pending').forEach(btn => {
            btn.addEventListener('click', () => deletePendingMenu(parseInt(btn.dataset.idx)));
        });
    }

    // --- Logic ---
    function calculateTotal() {
        const selectedCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked:not(#prod-pan)');
        let foodTotal = 0;

        selectedCheckboxes.forEach(cb => {
            const id = parseInt(cb.value);
            const prod = products.find(p => p.id === id);
            if (prod) foodTotal += parseFloat(prod.price);
        });

        // Fixed Costs
        const drinksTotal = DRINK_PRICE_PER_PERSON * DINERS;
        const panTotal = FIXED_PAN_PRICE; // Fixed single charge or per person? 
        // Request says "producto fijo de Pan (2.40€)". Assuming single charge for the table or per person?
        // Usually bread is per person, but 2.40 sounds like a basket. 
        // Let's assume it's a fixed item added ONCE to the bill as requested "un producto fijo".
        // If it was per person it would likely be grouped with drinks.

        const totalBill = foodTotal + drinksTotal + panTotal;
        const perPerson = totalBill / DINERS;

        // Update UI
        summaryEls.food.textContent = foodTotal.toFixed(2) + '€';
        summaryEls.drinks.textContent = drinksTotal.toFixed(2) + '€';
        summaryEls.pan.textContent = panTotal.toFixed(2) + '€';
        summaryEls.total.textContent = totalBill.toFixed(2) + '€';
        summaryEls.perPerson.textContent = perPerson.toFixed(2) + '€';

        return {
            food: foodTotal,
            drinks: drinksTotal,
            pan: panTotal,
            total: totalBill,
            perPerson: perPerson
        };
    }

    // --- Actions ---

    // Add Product
    addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('new-prod-name').value;
        const price = parseFloat(document.getElementById('new-prod-price').value);
        const category = document.getElementById('new-prod-category').value;

        const newProd = {
            id: Date.now(), // Simple ID generation
            name,
            price,
            category
        };

        products.push(newProd);
        saveProducts();
        renderProducts();
        addForm.reset();
    });

    // Edit Product
    function openEditModal(prod) {
        document.getElementById('edit-prod-id').value = prod.id;
        document.getElementById('edit-prod-name').value = prod.name;
        document.getElementById('edit-prod-price').value = prod.price;
        editModal.classList.remove('hidden');
    }

    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = parseInt(document.getElementById('edit-prod-id').value);
        const name = document.getElementById('edit-prod-name').value;
        const price = parseFloat(document.getElementById('edit-prod-price').value);

        const idx = products.findIndex(p => p.id === id);
        if (idx !== -1) {
            products[idx].name = name;
            products[idx].price = price;
            saveProducts();
            renderProducts();
            calculateTotal(); // Recalc in case price changed on selected item
            editModal.classList.add('hidden');
        }
    });

    deleteBtn.addEventListener('click', () => {
        const id = parseInt(document.getElementById('edit-prod-id').value);
        if (confirm('¿Seguro que quieres eliminar este producto?')) {
            products = products.filter(p => p.id !== id);
            saveProducts();
            renderProducts();
            calculateTotal();
            editModal.classList.add('hidden');
        }
    });

    // Modal Close Logic
    closeModalBtn.addEventListener('click', () => editModal.classList.add('hidden'));
    window.addEventListener('click', (e) => {
        if (e.target === editModal) editModal.classList.add('hidden');
    });

    // History Actions
    saveMenuBtn.addEventListener('click', () => {
        saveMenuToHistory();
    });

    savePendingBtn.addEventListener('click', () => {
        saveMenuToPending();
    });

    sortSelect.addEventListener('change', () => {
        sortProducts(sortSelect.value);
    });

    function getSelectedItems() {
        const selectedCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked:not(#prod-pan)');
        const selectedItems = [];
        selectedCheckboxes.forEach(cb => {
            const id = parseInt(cb.value);
            const prod = products.find(p => p.id === id);
            if (prod) selectedItems.push(prod);
        });
        return selectedItems;
    }

    function saveMenuToHistory() {
        const selectedItems = getSelectedItems();
        if (selectedItems.length === 0) {
            alert("Selecciona al menos un producto para guardar el menú.");
            return;
        }

        // Update usage stats
        selectedItems.forEach(item => {
            const prodIdx = products.findIndex(p => p.id === item.id);
            if (prodIdx !== -1) {
                products[prodIdx].usageCount = (products[prodIdx].usageCount || 0) + 1;
            }
        });
        saveProducts(); // Save updated usage counts

        const totals = calculateTotal();
        const menuName = menuNameInput.value.trim();

        const menuEntry = {
            items: selectedItems,
            total: totals.total,
            perPerson: totals.perPerson,
            name: menuName,
            date: new Date().toISOString()
        };

        history.push(menuEntry);
        saveHistory();
        renderHistory();

        // Reset inputs
        menuNameInput.value = '';
        // Optional: clear selection? User might want to keep it.
        // Let's keep selection as is, standard behavior.
    }

    function saveMenuToPending() {
        const selectedItems = getSelectedItems();
        if (selectedItems.length === 0) {
            alert("Selecciona al menos un producto.");
            return;
        }

        const totals = calculateTotal();
        const menuName = menuNameInput.value.trim();

        const menuEntry = {
            items: selectedItems,
            total: totals.total,
            perPerson: totals.perPerson,
            name: menuName,
            date: new Date().toISOString()
        };

        pendingMenus.push(menuEntry);
        savePending();
        renderPending();
        menuNameInput.value = '';
    }

    function deleteHistoryItem(index) {
        if (confirm('¿Eliminar este menú del historial?')) {
            history.splice(index, 1);
            saveHistory();
            renderHistory();
        }
    }

    function deletePendingMenu(index) {
        if (confirm('¿Eliminar este menú pendiente?')) {
            pendingMenus.splice(index, 1);
            savePending();
            renderPending();
        }
    }

    function loadPendingMenu(index) {
        const menu = pendingMenus[index];
        loadMenuState(menu);
        if (menu.name) menuNameInput.value = menu.name;

        // Remove from pending since we are "loading" it to potentially finalize it
        // Or should we keep it until they save? 
        // "Cargar y Finalizar" implies moving it to workspace.
        // Let's keep it in pending until they explicitly delete or we could delete it now.
        // Better UX: Keep it, user can delete if they want.
    }

    function loadMenuState(menu) {
        if (!menu) return;

        // Uncheck all first
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            if (cb.id !== 'prod-pan') {
                cb.checked = false;
                cb.closest('.product-card').classList.remove('selected');
            }
        });

        // Check items
        menu.items.forEach(item => {
            const checkbox = document.querySelector(`input[value="${item.id}"]`);
            if (checkbox) {
                checkbox.checked = true;
                checkbox.closest('.product-card').classList.add('selected');
            }
        });

        calculateTotal();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function sortProducts(criteria) {
        const containerMap = {
            'primeros': [],
            'segundos': [],
            'postres': []
        };

        // Group by category
        products.forEach(p => {
            if (containerMap[p.category]) {
                containerMap[p.category].push(p);
            }
        });

        // Sort each category
        Object.keys(containerMap).forEach(cat => {
            containerMap[cat].sort((a, b) => {
                if (criteria === 'name') {
                    return a.name.localeCompare(b.name);
                } else if (criteria === 'price') {
                    return a.price - b.price;
                } else if (criteria === 'usage') {
                    return (b.usageCount || 0) - (a.usageCount || 0);
                }
                return 0; // default
            });
        });

        // Re-render (we need to update the products array order or just render from sorted lists?
        // Better to update global products array order to match visual order?
        // Or just re-render. Let's re-render based on sorted lists.
        // Actually, renderProducts iterates `products`. Let's sort `products` in place.

        products.sort((a, b) => {
            // First by category to keep them grouped if we were rendering all together, 
            // but renderProducts filters by category.
            // So we just need to sort generally or just sort when rendering?
            // Let's sort the main array.
            if (criteria === 'default') {
                return a.id - b.id; // Assuming ID order is default creation order
            }
            if (criteria === 'name') {
                return a.name.localeCompare(b.name);
            } else if (criteria === 'price') {
                return a.price - b.price;
            } else if (criteria === 'usage') {
                return (b.usageCount || 0) - (a.usageCount || 0);
            }
            return 0;
        });

        // Capture selection before render
        const selectedIds = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(cb => parseInt(cb.value));

        renderProducts();

        // Restore selection
        restoreSelection(selectedIds);
    }

    function restoreSelection(selectedIds) {
        selectedIds.forEach(id => {
            const cb = document.querySelector(`input[value="${id}"]`);
            if (cb) {
                cb.checked = true;
                cb.closest('.product-card').classList.add('selected');
            }
        });
        calculateTotal();
    }

    function loadMenuFromHistory(index) {
        const menu = history[index];
        loadMenuState(menu);
        if (menu.name) menuNameInput.value = menu.name;
    }
});

