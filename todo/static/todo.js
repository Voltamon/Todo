// ===================== TODO APP JAVASCRIPT =====================
// Utility functions
function getToday() {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d.toISOString().slice(0,10);
}
function saveTasks(tasks) {
    localStorage.setItem('todo-tasks', JSON.stringify(tasks));
}
function loadTasks() {
    return JSON.parse(localStorage.getItem('todo-tasks') || '{}');
}
function getTasksForDate(date) {
    const all = loadTasks();
    return all[date] || [];
}
function setTasksForDate(date, tasks) {
    const all = loadTasks();
    all[date] = tasks;
    saveTasks(all);
}
function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}
function getQuote() {
    const quotes = [
        "The secret of getting ahead is getting started.",
        "Don’t watch the clock; do what it does. Keep going.",
        "Success is the sum of small efforts, repeated day-in and day-out.",
        "It always seems impossible until it’s done.",
        "You don’t have to be great to start, but you have to start to be great.",
        "The best way to get something done is to begin.",
        "Dream big. Start small. Act now.",
        "Every accomplishment starts with the decision to try."
    ];
    // Use the date string as a seed for randomness
    const seed = currentDate.split('-').join('');
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
    }
    const idx = Math.abs(hash) % quotes.length;
    return quotes[idx];
}

// DOM elements
const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const inputCounter = document.getElementById('todo-input-counter');
const desc = document.getElementById('todo-desc');
const descCounter = document.getElementById('todo-desc-counter');
const priority = document.getElementById('todo-priority');
const duration = document.getElementById('todo-duration');
const dateInput = document.getElementById('todo-date');
const schedule = document.getElementById('schedule-container');
const progressBar = document.getElementById('progress-bar');
const greetingQuote = document.getElementById('greeting-quote');
const dateNav = document.getElementById('date-nav');

// Modal elements
const modal = document.getElementById('task-modal');
const modalTaskName = document.getElementById('modal-task-name');
const modalTaskDesc = document.getElementById('modal-task-desc');
const modalTimer = document.getElementById('modal-timer');
const modalStart = document.getElementById('modal-start');
const modalPause = document.getElementById('modal-pause');
const modalDone = document.getElementById('modal-done');
const modalClose = document.getElementById('modal-close');

// State
let currentDate = getToday();
let timerInterval = null;
let timerRemaining = 0;
let timerTaskIndex = null;

// ========== UI RENDERING ==========
function renderGreeting() {
    greetingQuote.innerHTML = `<div style='font-size:1.2em;font-weight:600;'>${getGreeting()}!</div><div style='font-size:1em;margin-top:0.2em;'>${getQuote()}</div>`;
}
function renderProgressBar(tasks) {
    if (!tasks.length) {
        progressBar.value = 0;
        progressBar.max = 100;
        return;
    }
    const done = tasks.filter(t => t.done).length;
    progressBar.value = Math.round((done / tasks.length) * 100);
    progressBar.max = 100;
}
function renderTasks() {
    const tasks = getTasksForDate(currentDate);
    schedule.innerHTML = '';
    if (!tasks.length) {
        schedule.innerHTML = `<div style='color:#8b949e;text-align:center;margin-top:2em;'>No tasks for this day.</div>`;
        renderProgressBar([]);
        return;
    }
    // Sort by user order (drag-and-drop), then by priority
    tasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    renderProgressBar(tasks);
    for (let i = 0; i < tasks.length; ++i) {
        const t = tasks[i];
        const div = document.createElement('div');
        div.className = 'todo-task';
        div.setAttribute('draggable', 'true');
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.background = '#23272e';
        div.style.borderRadius = '0.7em';
        div.style.marginBottom = '0.7em';
        div.style.padding = '0.9em 1.1em';
        div.style.boxShadow = t.done ? '0 0 0 2px #22c55e33' : '0 1px 8px #0002';
        div.style.borderLeft = `6px solid ${t.priority === 'red' ? '#ef4444' : t.priority === 'yellow' ? '#facc15' : '#22c55e'}`;
        div.style.cursor = 'grab';
        div.dataset.index = i;
        div.innerHTML = `
            <span style="flex:1;font-weight:500;color:${t.done ? '#22c55e' : '#fff'};display:flex;align-items:center;gap:0.5em;font-size:0.85em;">
                ${t.done ? '<span style=\'color:#22c55e;font-size:1.1em;\'>&#10003;</span>' : ''}
                ${t.name}
            </span>
            <span style="font-size:0.7em;color:#8b949e;margin-right:1.2em;">${t.duration} min</span>
            <button class="delete-task" data-index="${i}" title="Delete" style="background:none;color:#ef4444;border:none;padding:0.1em 0.2em;border-radius:0.3em;cursor:pointer;margin-left:0.2em;font-size:0.5em;display:flex;align-items:center;justify-content:center;opacity:0.7;transition:opacity 0.15s;">
                <svg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 24 24' fill='none' stroke='#ef4444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='3 6 5 6 21 6'/><path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2'/><line x1='10' y1='11' x2='10' y2='17'/><line x1='14' y1='11' x2='14' y2='17'/></svg>
            </button>
        `;
        // Drag events
        div.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', i);
        });
        div.addEventListener('dragover', e => {
            e.preventDefault();
            div.style.boxShadow = '0 0 0 2px #3b82f6';
        });
        div.addEventListener('dragleave', e => {
            div.style.boxShadow = t.done ? '0 0 0 2px #22c55e33' : '0 1px 8px #0002';
        });
        div.addEventListener('drop', e => {
            e.preventDefault();
            const from = +e.dataTransfer.getData('text/plain');
            if (from === i) return;
            const arr = [...tasks];
            const moved = arr.splice(from, 1)[0];
            arr.splice(i, 0, moved);
            arr.forEach((t, idx) => t.order = idx);
            setTasksForDate(currentDate, arr);
            renderTasks();
        });
        // Delete
        div.querySelector('.delete-task').onclick = () => confirmDeleteTask(i);
        // Mark done on double click (only if not done)
        if (!t.done) {
            div.ondblclick = () => openTaskModal(i);
        } else {
            div.style.opacity = 0.7;
            div.style.pointerEvents = 'auto'; // allow delete
        }
        schedule.appendChild(div);
        if (t.description) {
            const descDiv = document.createElement('div');
            descDiv.textContent = t.description;
            descDiv.style.color = '#bfc7d5';
            descDiv.style.fontSize = '0.46em';
            descDiv.style.marginLeft = '2.1em';
            descDiv.style.marginTop = '0.09em';
            descDiv.style.marginBottom = '-0.15em';
            schedule.appendChild(descDiv);
        }
    }
}

// ========== FORM HANDLING ==========
input.maxLength = 25;
desc.maxLength = 100;
input.addEventListener('input', () => {
    inputCounter.textContent = `${input.value.length}/25`;
    if (input.value.length > 25) input.value = input.value.slice(0, 25);
});
desc.addEventListener('input', () => {
    descCounter.textContent = `${desc.value.length}/100`;
    if (desc.value.length > 100) desc.value = desc.value.slice(0, 100);
});
form.onsubmit = e => {
    e.preventDefault();
    const name = input.value.trim();
    const description = desc.value.trim();
    const prio = priority.value;
    const dur = Math.max(1, Math.min(30, parseInt(duration.value, 10) || 1));
    const date = dateInput.value || getToday();
    if (!name) return;
    const tasks = getTasksForDate(date);
    tasks.push({
        name,
        description,
        priority: prio,
        duration: dur,
        date,
        done: false,
        order: tasks.length
    });
    setTasksForDate(date, tasks);
    input.value = '';
    desc.value = '';
    duration.value = '';
    renderTasks();
    renderProgressBar(tasks);
    inputCounter.textContent = '';
    descCounter.textContent = '';
};

// ========== DATE NAVIGATION ==========
function renderDateNav() {
    dateNav.innerHTML = '';
    const prev = document.createElement('button');
    prev.textContent = '<';
    prev.onclick = () => changeDate(-1);
    const next = document.createElement('button');
    next.textContent = '>';
    next.onclick = () => changeDate(1);
    const dateLabel = document.createElement('span');
    dateLabel.textContent = currentDate;
    dateLabel.style.margin = '0 1.2em';
    dateNav.append(prev, dateLabel, next);
}
function changeDate(delta) {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + delta);
    currentDate = d.toISOString().slice(0,10);
    updateAll();
}
dateInput.value = getToday();

// ========== MODAL HANDLING ==========
function openTaskModal(idx) {
    const tasks = getTasksForDate(currentDate);
    const t = tasks[idx];
    modalTaskName.textContent = t.name;
    modalTaskDesc.textContent = t.description;
    // Restore timerRemaining from task if present, else use duration
    timerRemaining = typeof t.timeLeft === 'number' ? t.timeLeft : t.duration * 60;
    timerTaskIndex = idx;
    updateModalTimer();
    modal.style.display = 'flex';
}
function closeTaskModal() {
    // Save timerRemaining to the task before closing
    if (timerTaskIndex !== null) {
        const tasks = getTasksForDate(currentDate);
        if (tasks[timerTaskIndex]) {
            tasks[timerTaskIndex].timeLeft = timerRemaining;
            setTasksForDate(currentDate, tasks);
        }
    }
    modal.style.display = 'none';
    clearInterval(timerInterval);
    timerInterval = null;
}
function updateModalTimer() {
    const min = Math.floor(timerRemaining / 60).toString().padStart(2, '0');
    const sec = (timerRemaining % 60).toString().padStart(2, '0');
    modalTimer.textContent = `${min}:${sec}`;
}
modalClose.onclick = closeTaskModal;
modalStart.onclick = () => {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
        if (timerRemaining > 0) {
            timerRemaining--;
            updateModalTimer();
        } else {
            clearInterval(timerInterval);
            timerInterval = null;
            markTaskDone(timerTaskIndex);
            closeTaskModal();
        }
    }, 1000);
};
modalPause.onclick = () => {
    clearInterval(timerInterval);
    timerInterval = null;
};
modalDone.onclick = () => {
    markTaskDone(timerTaskIndex);
    closeTaskModal();
};
function markTaskDone(idx) {
    const tasks = getTasksForDate(currentDate);
    if (tasks[idx]) {
        tasks[idx].done = true;
        tasks[idx].timeLeft = 0; // Reset timer on done
    }
    setTasksForDate(currentDate, tasks);
    renderTasks();
    renderProgressBar(tasks);
}
window.onclick = function(e) {
    if (e.target === modal) closeTaskModal();
};

// ========== DELETE CONFIRMATION ==========
function confirmDeleteTask(idx) {
    // Create modal if not exists
    let modal = document.getElementById('delete-confirm-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'delete-confirm-modal';
        modal.style.position = 'fixed';
        modal.style.left = '0';
        modal.style.top = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.7)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '2000';
        modal.innerHTML = `
            <div style="background:#23272e;padding:2rem 2.5rem;border-radius:1rem;box-shadow:0 4px 32px #000a;min-width:320px;max-width:98vw;display:flex;flex-direction:column;align-items:center;position:relative;">
                <div style="color:#fff;font-size:1.15em;margin-bottom:1.5em;text-align:center;">Are you sure you want to delete this task?</div>
                <div style="display:flex;gap:1.5em;">
                    <button id="delete-confirm-yes" style="background:#ef4444;color:#fff;padding:0.5em 1.5em;border:none;border-radius:0.5em;font-size:1em;">Delete</button>
                    <button id="delete-confirm-no" style="background:#23272e;color:#fff;padding:0.5em 1.5em;border:1px solid #444;border-radius:0.5em;font-size:1em;">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        modal.style.display = 'flex';
    }
    // Button handlers
    document.getElementById('delete-confirm-yes').onclick = function() {
        const tasks = getTasksForDate(currentDate);
        tasks.splice(idx, 1);
        setTasksForDate(currentDate, tasks);
        renderTasks();
        renderProgressBar(tasks);
        modal.style.display = 'none';
    };
    document.getElementById('delete-confirm-no').onclick = function() {
        modal.style.display = 'none';
    };
    // Dismiss modal on outside click
    modal.onclick = function(e) {
        if (e.target === modal) modal.style.display = 'none';
    };
}

// ========== INIT ==========
function updateAll() {
    renderGreeting();
    renderTasks();
    renderDateNav();
}
updateAll();
