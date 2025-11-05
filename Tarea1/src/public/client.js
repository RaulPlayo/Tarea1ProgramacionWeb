// Configuración global
const API_BASE = '/api';
let currentUser = null;
let currentPage = 1;
let totalPages = 1;
let socket = null;

// Elementos DOM
const elements = {
    // Navegación
    navLinks: document.querySelectorAll('.nav-link'),
    authButtons: document.getElementById('authButtons'),
    userMenu: document.getElementById('userMenu'),
    userGreeting: document.getElementById('userGreeting'),
    loginBtn: document.getElementById('loginBtn'),
    registerBtn: document.getElementById('registerBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    navToggle: document.getElementById('navToggle'),
    
    // Secciones
    sections: document.querySelectorAll('.section'),
    
    // Productos
    productsGrid: document.getElementById('productsGrid'),
    categoryFilter: document.getElementById('categoryFilter'),
    platformFilter: document.getElementById('platformFilter'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    addProductBtn: document.getElementById('addProductBtn'),
    pagination: document.getElementById('pagination'),
    
    // Chat
    chatMessages: document.getElementById('chatMessages'),
    messageInput: document.getElementById('messageInput'),
    sendMessageBtn: document.getElementById('sendMessageBtn'),
    typingIndicator: document.getElementById('typingIndicator'),
    
    // Modales
    loginModal: document.getElementById('loginModal'),
    registerModal: document.getElementById('registerModal'),
    productModal: document.getElementById('productModal'),
    
    // Formularios
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    productForm: document.getElementById('productForm')
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    checkAuthStatus();
});

function initializeApp() {
    setupFormHelpers();
    loadProducts();
}

function setupFormHelpers() {
    // Agregar estilos para texto de ayuda
    const style = document.createElement('style');
    style.textContent = `
        .form-help {
            color: #666;
            font-size: 0.8rem;
            margin-top: 0.25rem;
            display: block;
        }
        .notification {
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 3000;
            display: flex;
            align-items: center;
            gap: 1rem;
            animation: slideIn 0.3s ease;
            color: white;
        }
        .notification-success { background: #00b894; }
        .notification-error { background: #e17055; }
        .notification-info { background: #6c5ce7; }
        .notification-warning { background: #fdcb6e; color: #2d3436; }
        .notification button {
            background: none;
            border: none;
            color: inherit;
            font-size: 1.2rem;
            cursor: pointer;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

function setupEventListeners() {
    // Navegación
    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.getAttribute('data-section');
            showSection(section);
        });
    });

    // Botones de autenticación
    elements.loginBtn.addEventListener('click', () => showModal(elements.loginModal));
    elements.registerBtn.addEventListener('click', () => showModal(elements.registerModal));
    elements.logoutBtn.addEventListener('click', logout);

    // Toggle de navegación móvil
    elements.navToggle.addEventListener('click', () => {
        const navLinks = document.querySelector('.nav-links');
        navLinks.classList.toggle('active');
    });

    // Filtros de productos
    elements.categoryFilter.addEventListener('change', () => {
        currentPage = 1;
        loadProducts();
    });
    elements.platformFilter.addEventListener('change', () => {
        currentPage = 1;
        loadProducts();
    });
    elements.searchBtn.addEventListener('click', () => {
        currentPage = 1;
        loadProducts();
    });
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            currentPage = 1;
            loadProducts();
        }
    });

    // Botón añadir producto
    elements.addProductBtn.addEventListener('click', () => showAddProductModal());

    // Formularios
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.registerForm.addEventListener('submit', handleRegister);
    elements.productForm.addEventListener('submit', handleProductSubmit);

    // Chat
    elements.messageInput.addEventListener('input', handleTyping);
    elements.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    elements.sendMessageBtn.addEventListener('click', sendMessage);

    // Cerrar modales
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            hideAllModals();
        });
    });

    // Cerrar modales al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            hideAllModals();
        }
    });

    // Enlaces entre modales
    document.getElementById('showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        hideAllModals();
        showModal(elements.registerModal);
    });

    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        hideAllModals();
        showModal(elements.loginModal);
    });

    document.getElementById('cancelProductBtn').addEventListener('click', () => {
        hideAllModals();
    });
}

// Navegación entre secciones
function showSection(sectionName) {
    elements.sections.forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Si es la sección de chat, inicializar socket si está autenticado
        if (sectionName === 'chat' && currentUser) {
            initializeChat();
        }
        
        // Si es la sección de productos, recargar
        if (sectionName === 'products') {
            loadProducts();
        }
    }
}

// Autenticación
async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        updateAuthUI(false);
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateAuthUI(true);
            
            // Si estamos en la sección de chat, inicializar socket
            if (document.getElementById('chat').classList.contains('active')) {
                initializeChat();
            }
        } else {
            localStorage.removeItem('token');
            updateAuthUI(false);
        }
    } catch (error) {
        console.error('Error verificando autenticación:', error);
        localStorage.removeItem('token');
        updateAuthUI(false);
    }
}

function updateAuthUI(isAuthenticated) {
    if (isAuthenticated) {
        elements.authButtons.style.display = 'none';
        elements.userMenu.style.display = 'flex';
        elements.userGreeting.textContent = `Hola, ${currentUser.username}`;
        
        // Mostrar botón de añadir producto si es admin
        if (currentUser.role === 'admin') {
            elements.addProductBtn.style.display = 'block';
        } else {
            elements.addProductBtn.style.display = 'none';
        }
        
        // Habilitar chat
        elements.messageInput.disabled = false;
        elements.sendMessageBtn.disabled = false;
        
        // Actualizar mensaje de bienvenida en chat
        if (document.getElementById('chat').classList.contains('active')) {
            initializeChat();
        }
    } else {
        elements.authButtons.style.display = 'flex';
        elements.userMenu.style.display = 'none';
        elements.addProductBtn.style.display = 'none';
        
        // Deshabilitar chat
        elements.messageInput.disabled = true;
        elements.sendMessageBtn.disabled = true;
        
        // Limpiar mensajes del chat
        elements.chatMessages.innerHTML = `
            <div class="welcome-message">
                <p>Bienvenido al chat! Inicia sesión para unirte a la conversación.</p>
            </div>
        `;
        
        // Desconectar socket si existe
        if (socket) {
            socket.disconnect();
            socket = null;
        }
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    // Validación básica
    if (!username || !password) {
        showNotification('Usuario y contraseña son requeridos', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            updateAuthUI(true);
            hideAllModals();
            showNotification('Login exitoso', 'success');
            
            // Limpiar formulario
            elements.loginForm.reset();
            
            // Recargar productos para mostrar botones de admin
            loadProducts();
            
            // Si estamos en la sección de chat, inicializar socket
            if (document.getElementById('chat').classList.contains('active')) {
                initializeChat();
            }
        } else {
            showNotification(data.message || 'Error en el login', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        console.error('Error en login:', error);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    // Validaciones
    if (!username || !password) {
        showNotification('Usuario y contraseña son requeridos', 'error');
        return;
    }
    
    if (username.length < 3) {
        showNotification('El usuario debe tener al menos 3 caracteres', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Las contraseñas no coinciden', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Registro exitoso. Ahora puedes iniciar sesión.', 'success');
            hideAllModals();
            // Limpiar formulario
            elements.registerForm.reset();
            showModal(elements.loginModal);
        } else {
            showNotification(data.message || 'Error en el registro', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        console.error('Error en registro:', error);
    }
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    updateAuthUI(false);
    showNotification('Sesión cerrada', 'info');
    loadProducts(); // Recargar para ocultar botones de admin
    
    // Desconectar socket
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

// Gestión de productos
async function loadProducts(page = currentPage) {
    const category = elements.categoryFilter.value;
    const platform = elements.platformFilter.value;
    const search = elements.searchInput.value;
    
    let url = `${API_BASE}/products?page=${page}&limit=12`;
    if (category) url += `&category=${category}`;
    if (platform) url += `&platform=${platform}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    
    try {
        elements.productsGrid.innerHTML = '<div class="spinner"></div>';
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok) {
            displayProducts(data.products);
            currentPage = data.currentPage;
            totalPages = data.totalPages;
            setupPagination(data.total, data.currentPage, data.totalPages);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error cargando productos:', error);
        elements.productsGrid.innerHTML = `
            <div class="text-center">
                <p>Error al cargar los productos. Intenta nuevamente.</p>
            </div>
        `;
    }
}

function displayProducts(products) {
    if (products.length === 0) {
        elements.productsGrid.innerHTML = `
            <div class="text-center" style="grid-column: 1 / -1; padding: 2rem;">
                <p>No se encontraron productos.</p>
                ${currentUser && currentUser.role === 'admin' ? 
                    '<button class="btn btn-warning mt-2" onclick="showAddProductModal()">Añadir primer producto</button>' : 
                    ''}
            </div>
        `;
        return;
    }
    
    elements.productsGrid.innerHTML = products.map(product => `
        <div class="product-card">
            ${product.featured ? '<span class="featured-badge"><i class="fas fa-star"></i> Destacado</span>' : ''}
            <img src="${product.imageUrl}" alt="${product.name}" class="product-image" 
                 onerror="this.src='https://via.placeholder.com/300x200/6c5ce7/ffffff?text=Imagen+No+Disponible'">
            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-meta">
                    <span class="product-price">${product.price}€</span>
                    <span class="product-rating">
                        <i class="fas fa-star"></i> ${product.rating}/5
                    </span>
                </div>
                <div class="product-meta">
                    <span class="product-platform">${product.platform}</span>
                    ${currentUser && currentUser.role === 'admin' ? `
                        <div class="product-actions">
                            <button class="btn btn-edit" onclick="editProduct('${product._id}')">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn btn-danger" onclick="deleteProduct('${product._id}')">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}
function setupPagination(total, currentPage, totalPages) {
    if (totalPages <= 1) {
        elements.pagination.innerHTML = '';
        return;
    }
    
    elements.pagination.innerHTML = `
        <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} 
                onclick="changePage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i> Anterior
        </button>
        <span class="pagination-info">Página ${currentPage} de ${totalPages}</span>
        <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} 
                onclick="changePage(${currentPage + 1})">
            Siguiente <i class="fas fa-chevron-right"></i>
        </button>
    `;
}

function changePage(page) {
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        loadProducts(page);
    }
}

// Gestión de productos (admin)
function showAddProductModal() {
    document.getElementById('productModalTitle').textContent = 'Añadir Videojuego';
    elements.productForm.reset();
    elements.productForm.dataset.mode = 'add';
    delete elements.productForm.dataset.productId;
    showModal(elements.productModal);
}

async function editProduct(productId) {
    try {
        const response = await fetch(`${API_BASE}/products/${productId}`);
        const product = await response.json();
        
        if (response.ok) {
            document.getElementById('productModalTitle').textContent = 'Editar Videojuego';
            document.getElementById('productName').value = product.name;
            document.getElementById('productDescription').value = product.description;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productRating').value = product.rating;
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productPlatform').value = product.platform;
            document.getElementById('productImageUrl').value = product.imageUrl;
            document.getElementById('productFeatured').checked = product.featured;
            
            elements.productForm.dataset.mode = 'edit';
            elements.productForm.dataset.productId = productId;
            showModal(elements.productModal);
        }
    } catch (error) {
        console.error('Error cargando producto:', error);
        showNotification('Error al cargar el producto', 'error');
    }
}

async function handleProductSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        price: parseFloat(document.getElementById('productPrice').value),
        rating: parseFloat(document.getElementById('productRating').value) || 0,
        category: document.getElementById('productCategory').value,
        platform: document.getElementById('productPlatform').value,
        imageUrl: document.getElementById('productImageUrl').value,
        featured: document.getElementById('productFeatured').checked
    };
    
    // Validación básica
    if (!formData.name || !formData.description || !formData.price || !formData.imageUrl || !formData.category || !formData.platform) {
        showNotification('Todos los campos son requeridos', 'error');
        return;
    }
    
    const token = localStorage.getItem('token');
    const mode = elements.productForm.dataset.mode;
    const productId = elements.productForm.dataset.productId;
    
    try {
        const url = mode === 'edit' ? `${API_BASE}/products/${productId}` : `${API_BASE}/products`;
        const method = mode === 'edit' ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            hideAllModals();
            showNotification(
                mode === 'edit' ? 'Producto actualizado exitosamente' : 'Producto añadido exitosamente',
                'success'
            );
            loadProducts();
        } else {
            showNotification(data.message || 'Error al guardar el producto', 'error');
        }
    } catch (error) {
        console.error('Error guardando producto:', error);
        showNotification('Error de conexión', 'error');
    }
}

async function deleteProduct(productId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    console.log('🗑️ Intentando eliminar producto:', productId);
    console.log('🔑 Token disponible:', !!token);
    
    if (!token) {
        showNotification('No estás autenticado', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Respuesta del servidor:', response.status);
        
        if (response.ok) {
            showNotification('Producto eliminado exitosamente', 'success');
            loadProducts();
        } else {
            const data = await response.json();
            console.error('❌ Error del servidor:', data);
            showNotification(data.message || 'Error al eliminar el producto', 'error');
        }
    } catch (error) {
        console.error('💥 Error eliminando producto:', error);
        showNotification('Error de conexión', 'error');
    }
}

// Chat en tiempo real
function initializeChat() {
    if (!currentUser) return;
    
    // Desconectar socket existente si hay uno
    if (socket) {
        socket.disconnect();
    }
    
    // Conectar nuevo socket
    socket = io();
    
    // Limpiar mensajes existentes
    elements.chatMessages.innerHTML = '';
    
    // Configurar event listeners del socket
    socket.on('connect', () => {
        console.log('Conectado al chat');
        
        // Unirse al chat
        socket.emit('user_joined', {
            username: currentUser.username,
            userId: currentUser.id
        });
    });
    
    socket.on('chat_message', (data) => {
        addMessageToChat(data, data.username === currentUser.username);
    });
    
    socket.on('user_typing', (users) => {
        showTypingIndicator(users);
    });
    
    socket.on('user_joined', (data) => {
        addSystemMessage(data.message);
    });
    
    socket.on('user_left', (data) => {
        addSystemMessage(data.message);
    });
    
    socket.on('system_message', (data) => {
        addSystemMessage(data.message);
    });
    
    socket.on('disconnect', () => {
        console.log('Desconectado del chat');
    });
    
    socket.on('connect_error', (error) => {
        console.error('Error de conexión al chat:', error);
        showNotification('Error al conectar con el chat', 'error');
    });
}

function addMessageToChat(data, isOwn = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'own' : 'other'}`;
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-sender">${data.username}</span>
            <span class="message-time">${data.timestamp}</span>
        </div>
        <div class="message-text">${data.message}</div>
    `;
    
    elements.chatMessages.appendChild(messageDiv);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function addSystemMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message system';
    messageDiv.style.cssText = `
        text-align: center;
        font-style: italic;
        color: #666;
        background: transparent;
        border: none;
        margin: 0.5rem 0;
        max-width: 100%;
    `;
    messageDiv.innerHTML = `
        <div class="message-text">${message}</div>
    `;
    
    elements.chatMessages.appendChild(messageDiv);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function sendMessage() {
    const message = elements.messageInput.value.trim();
    
    if (message && socket && socket.connected) {
        socket.emit('chat_message', { message });
        elements.messageInput.value = '';
        socket.emit('typing_stop');
    }
}

let typingTimer;
function handleTyping() {
    if (!socket || !socket.connected) return;
    
    socket.emit('typing_start');
    
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        socket.emit('typing_stop');
    }, 1000);
}

function showTypingIndicator(users) {
    if (users.length > 0) {
        const names = users.filter(username => username !== currentUser.username);
        if (names.length > 0) {
            const text = names.length === 1 ? 
                `${names[0]} está escribiendo...` : 
                `${names.join(', ')} están escribiendo...`;
            
            elements.typingIndicator.innerHTML = `<div class="typing-indicator">${text}</div>`;
            return;
        }
    }
    
    elements.typingIndicator.innerHTML = '';
}

// Utilidades
function showModal(modal) {
    hideAllModals();
    modal.style.display = 'block';
}

function hideAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

function showNotification(message, type = 'info') {
    // Crear notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
    // Añade estas funciones al final de client.js para debugging

// Función para debug del servidor
async function testServerConnection() {
  try {
    const response = await fetch('/api/debug');
    const data = await response.json();
    console.log('✅ Conexión servidor:', data);
    return true;
  } catch (error) {
    console.error('❌ Error conectando al servidor:', error);
    return false;
  }
}

// Función para ver usuarios en la base de datos (solo desarrollo)
async function debugUsers() {
  try {
    const response = await fetch('/api/auth/debug/users');
    const users = await response.json();
    console.log('👥 Usuarios en BD:', users);
    return users;
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    return [];
  }
}

// Llamar a las funciones de debug al cargar
document.addEventListener('DOMContentLoaded', () => {
  // Testear conexión al servidor
  setTimeout(() => {
    testServerConnection();
    debugUsers();
  }, 1000);
});
}

// Hacer funciones globales para los event listeners
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.changePage = changePage;
window.showAddProductModal = showAddProductModal;

// Navegación con History API
function updateURL(section) {
  const newURL = `${window.location.origin}${window.location.pathname}#${section}`;
  window.history.pushState({ section }, '', newURL);
}

// Manejar botones de navegación atrás/adelante
window.addEventListener('popstate', (event) => {
  if (event.state && event.state.section) {
    showSection(event.state.section);
  }
});

// Modificar la función showSection para usar History API
function showSection(sectionName) {
  elements.sections.forEach(section => {
    section.classList.remove('active');
  });
  
  const targetSection = document.getElementById(sectionName);
  if (targetSection) {
    targetSection.classList.add('active');
    updateURL(sectionName);
    
    // Si es la sección de chat, inicializar socket si está autenticado
    if (sectionName === 'chat' && currentUser) {
      initializeChat();
    }
    
    // Si es la sección de productos, recargar
    if (sectionName === 'products') {
      loadProducts();
    }
  }
}

// Cargar sección desde URL al iniciar
document.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash.replace('#', '');
  const validSections = ['home', 'products', 'chat'];
  
  if (hash && validSections.includes(hash)) {
    showSection(hash);
  } else {
    showSection('home');
  }
  
  initializeApp();
  setupEventListeners();
  checkAuthStatus();
});