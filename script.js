// ============================
// ÉTAT
// ============================
let goals = [];
let currentGoalId = null;

// ============================
// DOM READY
// ============================
window.addEventListener("DOMContentLoaded", () => {
    setupEvents();
    render();
});

// ============================
// EVENTS
// ============================
function setupEvents() {

    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            showSection(btn.dataset.section);
        });
    });

    document.getElementById("addGoalBtn").onclick = () => openModal();

    document.querySelector(".close").onclick = closeModal;

    document.getElementById("goalProgress").oninput = e => {
        document.getElementById("progressValue").textContent = e.target.value;
    };

    document.getElementById("goalForm").onsubmit = saveGoal;
}

// ============================
// MODAL
// ============================
function openModal(id = null) {
    currentGoalId = id;
    document.getElementById("modal").classList.add("active");
}

function closeModal() {
    document.getElementById("modal").classList.remove("active");
    currentGoalId = null;
}

// ============================
// SAVE GOAL
// ============================
function saveGoal(e) {
    e.preventDefault();

    const goal = {
        id: currentGoalId || Date.now().toString(),
        title: goalTitle.value,
        description: goalDescription.value,
        progress: goalProgress.value,
        visibility: document.querySelector("input[name=visibility]:checked").value
    };

    if (currentGoalId) {
        goals = goals.map(g => g.id === currentGoalId ? goal : g);
    } else {
        goals.push(goal);
    }

    closeModal();
    render();
}

// ============================
// RENDER
// ============================
function render() {
    renderPublic();
    renderPrivate();
}

function renderPublic() {
    publicGoals.innerHTML = goals
        .filter(g => g.visibility === "public")
        .map(goalCard)
        .join("");
}

function renderPrivate() {
    privateGoals.innerHTML = goals
        .filter(g => g.visibility === "private")
        .map(goalCard)
        .join("");
}

function goalCard(g) {
    return `
        <div class="goal">
            <h3>${g.title}</h3>
            <p>${g.description || ""}</p>
            <p>${g.progress}%</p>
            <button onclick="openModal('${g.id}')">✏️</button>
            <button onclick="deleteGoal('${g.id}')">🗑️</button>
        </div>
    `;
}

// ============================
// DELETE
// ============================
function deleteGoal(id) {
    goals = goals.filter(g => g.id !== id);
    render();
}

// ============================
// SECTIONS
// ============================
function showSection(section) {
    document.querySelectorAll(".goals-section").forEach(s => s.classList.remove("active"));
    document.getElementById(section + "Section").classList.add("active");
}
