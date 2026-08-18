// State Management
const STORAGE_KEY = 'taskflow_todos_v1';

class TodoApp {
  constructor() {
    this.todos = this.loadTodos();
    this.currentFilter = 'all';

    // DOM Elements
    this.todoForm = document.getElementById('todoForm');
    this.taskInput = document.getElementById('taskInput');
    this.taskList = document.getElementById('taskList');
    this.emptyState = document.getElementById('emptyState');
    this.itemsLeft = document.getElementById('itemsLeft');
    this.clearCompletedBtn = document.getElementById('clearCompletedBtn');
    this.filterTabs = document.querySelectorAll('.filter-tab');
    this.currentDateElem = document.getElementById('currentDate');

    this.init();
  }

  init() {
    // Set formatted date in header
    this.renderCurrentDate();

    // Event Listeners
    this.todoForm.addEventListener('submit', (e) => this.handleAddTodo(e));
    this.clearCompletedBtn.addEventListener('click', () => this.handleClearCompleted());

    this.filterTabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        const filter = e.target.getAttribute('data-filter');
        this.setFilter(filter);
      });
    });

    // Delegated event listener for task list clicks (toggle / delete)
    this.taskList.addEventListener('click', (e) => this.handleListClick(e));

    // Render initial tasks
    this.render();
  }

  loadTodos() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load tasks from localStorage:', e);
    }
    // Default initial sample tasks if empty
    return [
      { id: '1', text: 'Welcome to TaskFlow! 👋', completed: false, createdAt: Date.now() - 3600000 },
      { id: '2', text: 'Mark this task as completed by clicking it', completed: true, createdAt: Date.now() - 1800000 },
      { id: '3', text: 'Delete tasks using the trash icon on the right', completed: false, createdAt: Date.now() }
    ];
  }

  saveTodos() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.todos));
    } catch (e) {
      console.error('Failed to save tasks to localStorage:', e);
    }
  }

  renderCurrentDate() {
    if (!this.currentDateElem) return;
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    const today = new Date();
    this.currentDateElem.textContent = today.toLocaleDateString('en-US', options);
  }

  handleAddTodo(e) {
    e.preventDefault();
    const text = this.taskInput.value.trim();
    if (!text) return;

    const newTodo = {
      id: Date.now().toString() + '-' + Math.random().toString(36).substring(2, 7),
      text: text,
      completed: false,
      createdAt: Date.now()
    };

    this.todos.unshift(newTodo);
    this.saveTodos();
    this.taskInput.value = '';
    this.taskInput.focus();
    this.render();
  }

  handleListClick(e) {
    const deleteBtn = e.target.closest('.btn-delete');
    const taskItem = e.target.closest('.task-item');

    if (!taskItem) return;
    const id = taskItem.getAttribute('data-id');

    if (deleteBtn) {
      this.deleteTodo(id, taskItem);
    } else {
      // Toggle task complete status
      this.toggleTodo(id);
    }
  }

  toggleTodo(id) {
    this.todos = this.todos.map((todo) => {
      if (todo.id === id) {
        return { ...todo, completed: !todo.completed };
      }
      return todo;
    });

    this.saveTodos();
    this.render();
  }

  deleteTodo(id, element) {
    if (element) {
      element.classList.add('removing');
      element.addEventListener('transitionend', () => {
        this.todos = this.todos.filter((todo) => todo.id !== id);
        this.saveTodos();
        this.render();
      }, { once: true });
    } else {
      this.todos = this.todos.filter((todo) => todo.id !== id);
      this.saveTodos();
      this.render();
    }
  }

  handleClearCompleted() {
    this.todos = this.todos.filter((todo) => !todo.completed);
    this.saveTodos();
    this.render();
  }

  setFilter(filter) {
    this.currentFilter = filter;
    this.filterTabs.forEach((tab) => {
      const isActive = tab.getAttribute('data-filter') === filter;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    this.render();
  }

  getFilteredTodos() {
    switch (this.currentFilter) {
      case 'active':
        return this.todos.filter((t) => !t.completed);
      case 'completed':
        return this.todos.filter((t) => t.completed);
      default:
        return this.todos;
    }
  }

  render() {
    const filteredTodos = this.getFilteredTodos();
    const activeCount = this.todos.filter((t) => !t.completed).length;
    const completedCount = this.todos.filter((t) => t.completed).length;

    // Update list container
    this.taskList.innerHTML = '';

    filteredTodos.forEach((todo) => {
      const li = document.createElement('li');
      li.className = `task-item ${todo.completed ? 'completed' : ''}`;
      li.setAttribute('data-id', todo.id);

      // Checkbox and text container
      const contentDiv = document.createElement('div');
      contentDiv.className = 'task-content';
      contentDiv.setAttribute('role', 'checkbox');
      contentDiv.setAttribute('aria-checked', todo.completed ? 'true' : 'false');
      contentDiv.setAttribute('tabindex', '0');

      // Keypress support for checkbox
      contentDiv.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggleTodo(todo.id);
        }
      });

      const checkbox = document.createElement('div');
      checkbox.className = 'custom-checkbox';
      checkbox.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;

      const span = document.createElement('span');
      span.className = 'task-text';
      span.textContent = todo.text;

      contentDiv.appendChild(checkbox);
      contentDiv.appendChild(span);

      // Delete action button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete';
      deleteBtn.setAttribute('aria-label', `Delete task: ${todo.text}`);
      deleteBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      `;

      li.appendChild(contentDiv);
      li.appendChild(deleteBtn);
      this.taskList.appendChild(li);
    });

    // Empty state visibility & text
    if (filteredTodos.length === 0) {
      this.emptyState.classList.add('visible');
      const emptyText = this.emptyState.querySelector('.empty-text');
      const emptySubtext = this.emptyState.querySelector('.empty-subtext');

      if (this.currentFilter === 'active') {
        emptyText.textContent = 'No active tasks!';
        emptySubtext.textContent = 'All caught up or create a new one above.';
      } else if (this.currentFilter === 'completed') {
        emptyText.textContent = 'No completed tasks yet';
        emptySubtext.textContent = 'Check off tasks as you finish them.';
      } else {
        emptyText.textContent = 'No tasks yet!';
        emptySubtext.textContent = 'Add a task above to get started.';
      }
    } else {
      this.emptyState.classList.remove('visible');
    }

    // Stats
    this.itemsLeft.textContent = `${activeCount} ${activeCount === 1 ? 'task' : 'tasks'} remaining`;

    // Clear completed button display
    if (completedCount > 0) {
      this.clearCompletedBtn.style.display = 'inline-flex';
    } else {
      this.clearCompletedBtn.style.display = 'none';
    }
  }
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new TodoApp();
});
