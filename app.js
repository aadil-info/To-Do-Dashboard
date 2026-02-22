/**
 * TaskFlow - Premium To-Do Dashboard
 * Modern JavaScript Application
 * 
 * Features:
 * - Task CRUD operations
 * - Local storage persistence
 * - Search & Filter
 * - Dark/Light theme
 * - Toast notifications
 * - Responsive design
 */

// ============================================
// Constants & Configuration
// ============================================
const STORAGE_KEY = 'taskflow_tasks';
const THEME_KEY = 'taskflow_theme';

const PRIORITIES = {
    low: { label: 'Low', color: 'low' },
    medium: { label: 'Medium', color: 'medium' },
    high: { label: 'High', color: 'high' }
};

const CATEGORIES = {
    work: { label: 'Work', color: 'work' },
    personal: { label: 'Personal', color: 'personal' },
    health: { label: 'Health', color: 'health' },
    learning: { label: 'Learning', color: 'learning' }
};

// ============================================
// State Management
// ============================================
const state = {
    tasks: [],
    filters: {
        search: '',
        status: 'all',
        priority: 'all',
        category: 'all'
    },
    currentView: 'all',
    currentCategory: null,
    isDarkMode: true
};

// ============================================
// DOM Elements
// ============================================
const DOM = {
    // Sidebar
    sidebar: document.getElementById('sidebar'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    mobileOverlay: document.getElementById('mobileOverlay'),
    navItems: document.querySelectorAll('.nav-item'),
    categoryItems: document.querySelectorAll('.category-item'),
    
    // Header
    greeting: document.getElementById('greeting'),
    currentDate: document.getElementById('currentDate'),
    themeToggle: document.getElementById('themeToggle'),
    clearAllBtn: document.getElementById('clearAllBtn'),
    
    // Stats
    totalTasks: document.getElementById('totalTasks'),
    completedTasks: document.getElementById('completedTasks'),
    pendingTasks: document.getElementById('pendingTasks'),
    progressBar: document.getElementById('progressBar'),
    progressPercentage: document.getElementById('progressPercentage'),
    
    // Task Form
    taskForm: document.getElementById('taskForm'),
    taskInput: document.getElementById('taskInput'),
    taskPriority: document.getElementById('taskPriority'),
    taskCategory: document.getElementById('taskCategory'),
    taskDueDate: document.getElementById('taskDueDate'),
    
    // Search & Filter
    searchInput: document.getElementById('searchInput'),
    filterStatus: document.getElementById('filterStatus'),
    filterPriority: document.getElementById('filterPriority'),
    filterCategory: document.getElementById('filterCategory'),
    
    // Task List
    taskList: document.getElementById('taskList'),
    taskCount: document.getElementById('taskCount'),
    emptyState: document.getElementById('emptyState'),
    
    // Modal
    editModal: document.getElementById('editModal'),
    editForm: document.getElementById('editForm'),
    editTaskId: document.getElementById('editTaskId'),
    editTaskInput: document.getElementById('editTaskInput'),
    editTaskPriority: document.getElementById('editTaskPriority'),
    editTaskCategory: document.getElementById('editTaskCategory'),
    editTaskDueDate: document.getElementById('editTaskDueDate'),
    modalClose: document.getElementById('modalClose'),
    cancelEdit: document.getElementById('cancelEdit'),
    
    // Toast
    toastContainer: document.getElementById('toastContainer')
};

// ============================================
// Utility Functions
// ============================================

/**
 * Generate unique ID for tasks
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Check if date is overdue
 */
function isOverdue(dateString) {
    if (!dateString) return false;
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
}

/**
 * Get greeting based on time of day
 */
function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
}

/**
 * Format current date
 */
function formatCurrentDate() {
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
}

// ============================================
// Local Storage Functions
// ============================================

/**
 * Save tasks to local storage
 */
function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
    } catch (error) {
        console.error('Error saving tasks:', error);
        showToast('Failed to save tasks', 'error');
    }
}

/**
 * Load tasks from local storage
 */
function loadTasks() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            state.tasks = JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        state.tasks = [];
    }
}

/**
 * Save theme preference
 */
function saveTheme() {
    localStorage.setItem(THEME_KEY, state.isDarkMode ? 'dark' : 'light');
}

/**
 * Load theme preference
 */
function loadTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) {
        state.isDarkMode = saved === 'dark';
    } else {
        // Check system preference
        state.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    applyTheme();
}

/**
 * Apply theme to document
 */
function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.isDarkMode ? 'dark' : 'light');
    DOM.themeToggle.innerHTML = state.isDarkMode 
        ? '<i class="fas fa-moon"></i>' 
        : '<i class="fas fa-sun"></i>';
}

// ============================================
// Task Management Functions
// ============================================

/**
 * Add a new task
 */
function addTask(title, priority, category, dueDate) {
    const task = {
        id: generateId(),
        title: title.trim(),
        priority,
        category,
        dueDate: dueDate || null,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    state.tasks.unshift(task);
    saveTasks();
    renderTasks();
    updateStats();
    
    showToast('Task added successfully', 'success');
    
    // Reset form
    DOM.taskInput.value = '';
    DOM.taskPriority.value = 'medium';
    DOM.taskCategory.value = 'work';
    DOM.taskDueDate.value = '';
}

/**
 * Delete a task
 */
function deleteTask(taskId) {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskElement) {
        taskElement.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            state.tasks = state.tasks.filter(t => t.id !== taskId);
            saveTasks();
            renderTasks();
            updateStats();
            showToast('Task deleted', 'info');
        }, 300);
    }
}

/**
 * Toggle task completion
 */
function toggleTaskCompletion(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateStats();
        
        if (task.completed) {
            showToast('Task completed!', 'success');
        }
    }
}

/**
 * Update task
 */
function updateTask(taskId, updates) {
    const taskIndex = state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        state.tasks[taskIndex] = { ...state.tasks[taskIndex], ...updates };
        saveTasks();
        renderTasks();
        updateStats();
        showToast('Task updated successfully', 'success');
    }
}

// ============================================
// Filter & Search Functions
// ============================================

/**
 * Get filtered tasks based on current filters
 */
function getFilteredTasks() {
    return state.tasks.filter(task => {
        // Search filter
        if (state.filters.search) {
            const searchTerm = state.filters.search.toLowerCase();
            if (!task.title.toLowerCase().includes(searchTerm)) {
                return false;
            }
        }
        
        // Status filter
        if (state.filters.status !== 'all') {
            if (state.filters.status === 'completed' && !task.completed) return false;
            if (state.filters.status === 'pending' && task.completed) return false;
        }
        
        // Priority filter
        if (state.filters.priority !== 'all') {
            if (task.priority !== state.filters.priority) return false;
        }
        
        // Category filter
        if (state.filters.category !== 'all') {
            if (task.category !== state.filters.category) return false;
        }
        
        // Category sidebar filter
        if (state.currentCategory) {
            if (task.category !== state.currentCategory) return false;
        }
        
        // View filters
        if (state.currentView === 'completed' && !task.completed) return false;
        if (state.currentView === 'pending' && task.completed) return false;
        
        return true;
    });
}

// ============================================
// Rendering Functions
// ============================================

/**
 * Render all tasks
 */
function renderTasks() {
    const filteredTasks = getFilteredTasks();
    
    if (filteredTasks.length === 0) {
        DOM.taskList.innerHTML = '';
        DOM.emptyState.classList.add('show');
        DOM.taskCount.textContent = '0 tasks';
        return;
    }
    
    DOM.emptyState.classList.remove('show');
    DOM.taskCount.textContent = `${filteredTasks.length} task${filteredTasks.length !== 1 ? 's' : ''}`;
    
    DOM.taskList.innerHTML = filteredTasks.map(task => createTaskHTML(task)).join('');
}

/**
 * Create HTML for a single task
 */
function createTaskHTML(task) {
    const priorityInfo = PRIORITIES[task.priority];
    const categoryInfo = CATEGORIES[task.category];
    const overdueClass = task.dueDate && !task.completed && isOverdue(task.dueDate) ? 'overdue' : '';
    
    return `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
            <label class="task-checkbox">
                <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTaskCompletion('${task.id}')">
                <span class="checkmark"></span>
            </label>
            <div class="task-content">
                <div class="task-title">${escapeHtml(task.title)}</div>
                <div class="task-meta">
                    <span class="task-priority ${priorityInfo.color}">${priorityInfo.label}</span>
                    <span class="task-category ${categoryInfo.color}">
                        <span class="category-dot ${categoryInfo.color}"></span>
                        ${categoryInfo.label}
                    </span>
                    ${task.dueDate ? `
                        <span class="task-due-date ${overdueClass}">
                            <i class="fas fa-calendar"></i>
                            ${formatDate(task.dueDate)}
                        </span>
                    ` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="edit-btn" onclick="openEditModal('${task.id}')" title="Edit Task">
                    <i class="fas fa-pen"></i>
                </button>
                <button class="delete-btn" onclick="deleteTask('${task.id}')" title="Delete Task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Update statistics
 */
function updateStats() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    DOM.totalTasks.textContent = total;
    DOM.completedTasks.textContent = completed;
    DOM.pendingTasks.textContent = pending;
    DOM.progressBar.style.width = `${percentage}%`;
    DOM.progressPercentage.textContent = `${percentage}%`;
}

/**
 * Update header date and greeting
 */
function updateHeader() {
    DOM.greeting.textContent = getGreeting();
    DOM.currentDate.textContent = formatCurrentDate();
}

// ============================================
// Modal Functions
// ============================================

/**
 * Open edit modal
 */
function openEditModal(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    DOM.editTaskId.value = task.id;
    DOM.editTaskInput.value = task.title;
    DOM.editTaskPriority.value = task.priority;
    DOM.editTaskCategory.value = task.category;
    DOM.editTaskDueDate.value = task.dueDate || '';
    
    DOM.editModal.classList.add('show');
}

/**
 * Close edit modal
 */
function closeEditModal() {
    DOM.editModal.classList.remove('show');
    DOM.editForm.reset();
}

/**
 * Handle edit form submission
 */
function handleEditSubmit(e) {
    e.preventDefault();
    
    const taskId = DOM.editTaskId.value;
    const updates = {
        title: DOM.editTaskInput.value.trim(),
        priority: DOM.editTaskPriority.value,
        category: DOM.editTaskCategory.value,
        dueDate: DOM.editTaskDueDate.value || null
    };
    
    if (!updates.title) {
        showToast('Task title cannot be empty', 'error');
        return;
    }
    
    updateTask(taskId, updates);
    closeEditModal();
}

// ============================================
// Toast Notification Functions
// ============================================

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check',
        error: 'fa-times',
        info: 'fa-info'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icons[type]}"></i>
        </div>
        <span class="toast-message">${message}</span>
    `;
    
    DOM.toastContainer.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ============================================
// Theme Functions
// ============================================

/**
 * Toggle theme
 */
function toggleTheme() {
    state.isDarkMode = !state.isDarkMode;
    applyTheme();
    saveTheme();
}

// ============================================
// Clear All Functions
// ============================================

/**
 * Clear all tasks
 */
function clearAllTasks() {
    if (state.tasks.length === 0) {
        showToast('No tasks to clear', 'info');
        return;
    }
    
    if (confirm('Are you sure you want to delete all tasks? This action cannot be undone.')) {
        state.tasks = [];
        saveTasks();
        renderTasks();
        updateStats();
        showToast('All tasks cleared', 'info');
    }
}

// ============================================
// Mobile Menu Functions
// ============================================

/**
 * Toggle mobile sidebar
 */
function toggleMobileSidebar() {
    DOM.sidebar.classList.toggle('show');
    DOM.mobileOverlay.classList.toggle('show');
}

/**
 * Close mobile sidebar
 */
function closeMobileSidebar() {
    DOM.sidebar.classList.remove('show');
    DOM.mobileOverlay.classList.remove('show');
}

// ============================================
// Event Listeners
// ============================================

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Task form submission
    DOM.taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = DOM.taskInput.value.trim();
        
        if (!title) {
            showToast('Please enter a task', 'error');
            return;
        }
        
        addTask(
            title,
            DOM.taskPriority.value,
            DOM.taskCategory.value,
            DOM.taskDueDate.value
        );
    });
    
    // Search input
    DOM.searchInput.addEventListener('input', (e) => {
        state.filters.search = e.target.value;
        renderTasks();
    });
    
    // Filter selects
    DOM.filterStatus.addEventListener('change', (e) => {
        state.filters.status = e.target.value;
        renderTasks();
    });
    
    DOM.filterPriority.addEventListener('change', (e) => {
        state.filters.priority = e.target.value;
        renderTasks();
    });
    
    DOM.filterCategory.addEventListener('change', (e) => {
        state.filters.category = e.target.value;
        renderTasks();
    });
    
    // Navigation items
    DOM.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update active state
            DOM.navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Set view
            state.currentView = item.dataset.view;
            state.currentCategory = null;
            
            // Reset category items
            DOM.categoryItems.forEach(cat => cat.classList.remove('active'));
            
            renderTasks();
            closeMobileSidebar();
        });
    });
    
    // Category items
    DOM.categoryItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update active state
            DOM.categoryItems.forEach(cat => cat.classList.remove('active'));
            item.classList.add('active');
            
            // Set category
            state.currentCategory = item.dataset.category;
            state.currentView = 'all';
            
            // Reset nav items
            DOM.navItems.forEach(nav => nav.classList.remove('active'));
            
            renderTasks();
            closeMobileSidebar();
        });
    });
    
    // Theme toggle
    DOM.themeToggle.addEventListener('click', toggleTheme);
    
    // Clear all
    DOM.clearAllBtn.addEventListener('click', clearAllTasks);
    
    // Edit modal
    DOM.editForm.addEventListener('submit', handleEditSubmit);
    DOM.modalClose.addEventListener('click', closeEditModal);
    DOM.cancelEdit.addEventListener('click', closeEditModal);
    
    // Close modal on overlay click
    DOM.editModal.addEventListener('click', (e) => {
        if (e.target === DOM.editModal) {
            closeEditModal();
        }
    });
    
    // Mobile menu
    DOM.mobileMenuBtn.addEventListener('click', toggleMobileSidebar);
    DOM.mobileOverlay.addEventListener('click', closeMobileSidebar);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape to close modal
        if (e.key === 'Escape') {
            closeEditModal();
            closeMobileSidebar();
        }
        
        // Ctrl/Cmd + N to focus new task input
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            DOM.taskInput.focus();
        }
    });
    
    // Window resize - close mobile sidebar
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeMobileSidebar();
        }
    });
}

// ============================================
// Initialization
// ============================================

/**
 * Initialize the application
 */
function init() {
    // Load data from local storage
    loadTasks();
    loadTheme();
    
    // Update header
    updateHeader();
    
    // Initialize event listeners
    initEventListeners();
    
    // Initial render
    renderTasks();
    updateStats();
    
    // Set minimum date for due date input
    const today = new Date().toISOString().split('T')[0];
    DOM.taskDueDate.setAttribute('min', today);
    DOM.editTaskDueDate.setAttribute('min', today);
    
    console.log('TaskFlow initialized successfully! 🚀');
}

// Make functions globally available for inline event handlers
window.toggleTaskCompletion = toggleTaskCompletion;
window.openEditModal = openEditModal;
window.deleteTask = deleteTask;

// Start the application
document.addEventListener('DOMContentLoaded', init);

