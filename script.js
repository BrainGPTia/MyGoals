/// ===============================
// ÉTAT DE L'APPLICATION
// ===============================
let goals = [];              // objectifs privés (local)
let publicGoals = [];        // objectifs publics (Firebase)
let myLikes = [];
let myComments = [];
let currentGoalId = null;
let currentUser = 'Utilisateur';
let analytics = null;
let db = null;

// ===============================
// CHARGEMENT INITIAL
// ===============================
window.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase !== 'undefined') {
        analytics = firebase.analytics();
        db = firebase.firestore();

        // 🔥 SYNCHRO TEMPS RÉEL DES OBJECTIFS PUBLICS
        db.collection("publicGoals")
            .orderBy("createdAt", "desc")
            .onSnapshot(snapshot => {
                publicGoals = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                renderPublicGoals();
            });
    }

    loadData();
    setupEventListeners();
    showSection('public');
});

// ===============================
// EVENT LISTENERS
// ===============================
function setupEventListeners() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            showSection(btn.dataset.section);
        });
    });

    document.querySelectorAll('.secondary-btn').forEach(btn => {
        btn.addEventListener('click', () => showSection(btn.dataset.section));
    });

    document.getElementById('addGoalBtn').addEventListener('click', () => openModal());

    document.querySelectorAll('.close').forEach(btn => btn.addEventListener('click', closeModals));
    document.getElementById('cancelBtn').addEventListener('click', closeModals);

    document.getElementById('goalForm').addEventListener('submit', saveGoal);

    document.getElementById('goalProgress').addEventListener('input', e => {
        document.getElementById('progressValue').textContent = e.target.value;
    });

    document.querySelectorAll('input[name="visibility"]').forEach(radio => {
        radio.addEventListener('change', e => {
            document.getElementById('publicOptions').style.display =
                e.target.value === 'public' ? 'block' : 'none';
        });
    });

    document.getElementById('settingsBtn').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.add('active');
    });

    document.getElementById('closeSettings').addEventListener('click', closeModals);

    document.getElementById('themeSelect').addEventListener('change', e => {
        document.body.className = e.target.value;
        saveSettings();
    });

    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.documentElement.style.setProperty('--primary', btn.dataset.color);
            saveSettings();
        });
    });

    window.addEventListener('click', e => {
        if (e.target.classList.contains('modal')) closeModals();
    });
}

// ===============================
// MODALE
// ===============================
function openModal(goalId = null) {
    currentGoalId = goalId;
    const modal = document.getElementById('modal');
    const form = document.getElementById('goalForm');

    if (!goalId) {
        form.reset();
        document.getElementById('progressValue').textContent = '0';
        document.getElementById('publicOptions').style.display = 'none';
    }

    modal.classList.add('active');
}

function closeModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    currentGoalId = null;
}

// ===============================
// SAUVEGARDE OBJECTIF
// ===============================
function saveGoal(e) {
    e.preventDefault();

    const visibility = document.querySelector('input[name="visibility"]:checked').value;

    const goal = {
        title: goalTitle.value,
        description: goalDescription.value,
        type: goalType.value,
        progress: Number(goalProgress.value),
        visibility,
        authorName: currentUser,
        allowComments: allowComments.checked,
        likes: 0,
        comments: [],
        createdAt: Date.now()
    };

    // 🔥 PUBLIC → FIREBASE
    if (visibility === 'public' && db) {
        db.collection("publicGoals").add(goal);
        analytics?.logEvent('add_goal', { visibility: 'public' });
    }
    // 🔒 PRIVÉ → LOCAL
    else {
        goals.push({ id: Date.now().toString(), ...goal });
        saveData();
    }

    closeModals();
}

// ===============================
// SUPPRESSION
// ===============================
function deleteGoal(id) {
    if (!confirm('Supprimer cet objectif ?')) return;

    if (publicGoals.some(g => g.id === id)) {
        db.collection("publicGoals").doc(id).delete();
    } else {
        goals = goals.filter(g => g.id !== id);
        saveData();
    }
}

// ===============================
// NAVIGATION
// ===============================
function showSection(section) {
    document.querySelectorAll('.goals-section').forEach(s => s.classList.remove('active'));

    if (section === 'public') {
        publicSection.classList.add('active');
        renderPublicGoals();
    }
    if (section === 'private') {
        privateSection.classList.add('active');
        renderPrivateGoals();
    }
}

// ===============================
// RENDER
// ===============================
function renderPublicGoals() {
    const container = document.getElementById('publicGoals');

    if (!publicGoals.length) {
        container.innerHTML = `<div class="empty-state">Aucun objectif public</div>`;
        return;
    }

    container.innerHTML = publicGoals.map(g => createGoalCard(g, true)).join('');
}

function renderPrivateGoals() {
    const container = document.getElementById('privateGoals');

    if (!goals.length) {
        container.innerHTML = `<div class="empty-state">Aucun objectif privé</div>`;
        return;
    }

    container.innerHTML = goals.map(g => createGoalCard(g, false)).join('');
}

// ===============================
// CARTE OBJECTIF
// ===============================
function createGoalCard(goal, isPublic) {
    return `
    <div class="goal-card">
        <h3>${escapeHtml(goal.title)}</h3>
        <p>${escapeHtml(goal.description || '')}</p>
        <div class="progress-bar">
            <div class="progress-fill" style="width:${goal.progress}%"></div>
        </div>
        <div class="goal-actions">
            <button class="btn btn-danger" onclick="deleteGoal('${goal.id}')">🗑️</button>
        </div>
    </div>`;
}

// ===============================
// LOCAL STORAGE
// ===============================
function saveData() {
    localStorage.setItem('goalsTrackerData', JSON.stringify(goals));
}

function loadData() {
    const saved = localStorage.getItem('goalsTrackerData');
    if (saved) goals = JSON.parse(saved);
}

function saveSettings() {
    saveData();
}

// ===============================
// UTILS
// ===============================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
