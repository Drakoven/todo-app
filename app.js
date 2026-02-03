// =====================
// Selecteurs DOM
// =====================
const STORAGE_KEY = "todo-pro-v1";

const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const dateInput = document.querySelector("#todo-date");
const list = document.querySelector("#todo-list");
const counter = document.querySelector("#counter");

const filterButtons = document.querySelectorAll("#filters button");
const viewButtons = document.querySelectorAll("#views button");

const themeBtn = document.querySelector("#theme-toggle");
const THEME_KEY = "todo-theme";

// =====================
// État de l'app
// =====================
let tasks = [];
let activeFilter = "all"; // all | todo | done
let activeView = "all";   // all | today | week

// =====================
// LocalStorage
// =====================
function saveState() {
  const state = { tasks, activeFilter, activeView };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const state = JSON.parse(raw);

    if (Array.isArray(state.tasks)) tasks = state.tasks;
    if (typeof state.activeFilter === "string") activeFilter = state.activeFilter;
    if (typeof state.activeView === "string") activeView = state.activeView;
  } catch (err) {
    console.error("Erreur localStorage:", err);
  }
}

// =====================
// Helpers dates
// =====================
function formatToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysFromNow(n) {
  const d = new Date();
  d.setHours(12, 0, 0, 0); // midi = évite les bugs de fuseau
  d.setDate(d.getDate() + n);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateFR(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

// =====================
// Filtrage
// =====================
function applyFilter(listTasks) {
  if (activeFilter === "todo") return listTasks.filter(t => !t.done);
  if (activeFilter === "done") return listTasks.filter(t => t.done);
  return listTasks;
}

function applyView(listTasks) {
  if (activeView === "all") return listTasks;

  const today = formatToday();

  if (activeView === "today") {
    return listTasks.filter(t => t.dueDate === today);
  }

  if (activeView === "week") {
    const end = daysFromNow(7);
    return listTasks.filter(t => t.dueDate && t.dueDate >= today && t.dueDate <= end);
  }

  return listTasks;
}

// =====================
// UI boutons actifs
// =====================
function syncActiveButtons() {
  filterButtons.forEach(b => b.classList.remove("active"));
  const fb = document.querySelector(`#filters button[data-filter="${activeFilter}"]`);
  if (fb) fb.classList.add("active");

  viewButtons.forEach(b => b.classList.remove("active"));
  const vb = document.querySelector(`#views button[data-view="${activeView}"]`);
  if (vb) vb.classList.add("active");
}

// =====================
// Render
// =====================
function render() {
  list.innerHTML = "";

  // 1) filtrer par statut, puis par vue date
  const visible = applyView(applyFilter(tasks));

  visible.forEach((task, index) => {
    const li = document.createElement("li");
    li.className = "todo-item";
    li.dataset.id = task.id;

    // en retard ?
    const today = formatToday();
    if (task.dueDate && task.dueDate < today && !task.done) {
      li.classList.add("overdue");
    }

    li.innerHTML = `
      <div class="todo-pill">
        <label class="todo-left">
          <span class="todo-text">${task.text}</span>
          ${task.dueDate ? `<small class="todo-date">${formatDateFR(task.dueDate)}</small>` : ""}
        </label>

        <div class="todo-right">
          <span class="todo-badge">${index + 1}</span>
        </div>
      </div>

      <button class="todo-delete" aria-label="Supprimer">✕</button>
    `;

    if (task.done) li.classList.add("done");

    list.appendChild(li);
  });

  // compteur sur toutes les tâches
  const remaining = tasks.filter(t => !t.done).length;
  counter.textContent = `${remaining} tâche(s) restantes`;
}

// =====================
// Events
// =====================

// Ajouter
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  const dueDate = dateInput.value ? dateInput.value : null;

  tasks.push({
    id: Date.now(),
    text,
    done: false,
    dueDate
  });

  input.value = "";
  dateInput.value = "";

  saveState();
  render();
});

// Clique liste : delete OU toggle done
list.addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (!li) return;

  const id = Number(li.dataset.id);

  // supprimer
  if (e.target.classList.contains("todo-delete")) {
    tasks = tasks.filter(t => t.id !== id);
    saveState();
    render();
    return;
  }

  // toggle done si clic sur la capsule
  if (e.target.closest(".todo-pill")) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    task.done = !task.done;
    saveState();
    render();
  }
});

// Filtres statut
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    activeFilter = btn.dataset.filter;

    syncActiveButtons();
    saveState();
    render();
  });
});

// Vues date
viewButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    activeView = btn.dataset.view;

    syncActiveButtons();
    saveState();
    render();
  });
});

// =====================
// Init
// =====================
loadState();
syncActiveButtons();
render();

// Thème sombre / clair
function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  if (themeBtn) themeBtn.textContent = theme === "dark" ? "☀️" : "🌙";
  localStorage.setItem(THEME_KEY, theme);
}

if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    const current = document.body.getAttribute("data-theme") || "light";
    applyTheme(current === "light" ? "dark" : "light");
  });
}

// au chargement
applyTheme(localStorage.getItem(THEME_KEY) || "light");
