// ===============================
// ÉTAT DE L'APPLICATION
// ===============================
let goals = [];           // objectifs privés
let publicGoals = [];     // objectifs publics Firestore
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
    if (typeof firebase !== 'undefined' && firebase.analytics) {
        analytics = firebase.analytics();
        db = firebase.firestore();

        // 🔥 Synchronisation temps réel des objectifs publics
        db.collection("publicGoals")
            .orderBy("createdAt", "desc")
            .onSnapshot(snapshot => {
                publicGoals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

    document.getElementById('displayName').addEventListener('change', e => {
        document.getElementById('pseudoInput').style.display = e.target.value === 'pseudo' ? 'block' : 'none';
        document.getElementById('realNameInput').style.display = e.target.value === 'real' ? 'block' : 'none';
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
        btn.addEventListener('click', e => {
            e.preventDefault();
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

    if (goalId) {
        let goal = goals.find(g => g.id === goalId) || publicGoals.find(g => g.id === goalId);
        if (!goal) return;

        document.getElementById('modalTitle').textContent = '✏️ Modifier l\'objectif';
        document.getElementById('goalTitle').value = goal.title;
        document.getElementById('goalDescription').value = goal.description;
        document.getElementById('goalType').value = goal.type;
        document.getElementById('goalProgress').value = goal.progress;
        document.getElementById('progressValue').textContent = goal.progress;
        document.querySelector(`input[name="visibility"][value="${goal.visibility}"]`).checked = true;

        if (goal.visibility === 'public') {
            document.getElementById('publicOptions').style.display = 'block';
            document.getElementById('displayName').value = goal.displayName || 'pseudo';
            document.getElementById('allowComments').checked = goal.allowComments !== false;
            if (goal.displayName === 'pseudo') {
                document.getElementById('pseudoInput').style.display = 'block';
                document.getElementById('pseudoInput').value = goal.authorName;
            } else if (goal.displayName === 'real') {
                document.getElementById('realNameInput').style.display = 'block';
                document.getElementById('realNameInput').value = goal.authorName;
            }
        } else {
            document.getElementById('publicOptions').style.display = 'none';
        }
    } else {
        document.getElementById('modalTitle').textContent = '✨ Nouvel Objectif';
        form.reset();
        document.getElementById('progressValue').textContent = '0';
        document.getElementById('publicOptions').style.display = 'none';
        document.getElementById('pseudoInput').style.display = 'none';
        document.getElementById('realNameInput').style.display = 'none';
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

    const title = document.getElementById('goalTitle').value;
    const description = document.getElementById('goalDescription').value;
    const type = document.getElementById('goalType').value;
    const progress = Number(document.getElementById('goalProgress').value);
    const visibility = document.querySelector('input[name="visibility"]:checked').value;
    const displayName = document.getElementById('displayName').value;
    const allowComments = document.getElementById('allowComments').checked;

    let authorName = 'Anonyme';
    if (visibility === 'public') {
        authorName = displayName === 'pseudo'
            ? document.getElementById('pseudoInput').value || 'Anonyme'
            : document.getElementById('realNameInput').value || currentUser;
    }

    const goal = {
        title, description, type, progress,
        visibility, displayName, authorName, allowComments,
        likes: 0, comments: [], createdAt: Date.now()
    };

    if (visibility === 'public' && db) {
        db.collection("publicGoals").add(goal);
        if (analytics) analytics.logEvent('add_goal', { visibility: 'public' });
    } else {
        goal.id = currentGoalId || Date.now().toString();
        goals.push(goal);
        saveData();
        if (analytics) analytics.logEvent('add_goal', { visibility: 'private' });
    }

    closeModals();
}

// ===============================
// SUPPRESSION
// ===============================
function deleteGoal(id, isPublic = false) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet objectif ?')) return;

    if (isPublic && db) {
        db.collection("publicGoals").doc(id).delete();
    } else {
        goals = goals.filter(g => g.id !== id);
        myLikes = myLikes.filter(l => l !== id);
        myComments = myComments.filter(c => c.goalId !== id);
        saveData();
        renderPrivateGoals();
    }
}

// ===============================
// LIKES
// ===============================
function toggleLike(id, isPublic = false) {
    const goal = isPublic ? publicGoals.find(g => g.id === id) : goals.find(g => g.id === id);
    if (!goal) return;

    const index = myLikes.indexOf(id);
    if (index > -1) {
        myLikes.splice(index, 1);
        goal.likes--;
    } else {
        myLikes.push(id);
        goal.likes++;
        if (analytics) analytics.logEvent('like_goal', { goalId: id });
    }

    saveData();
    renderGoals();
}

// ===============================
// COMMENTAIRES
// ===============================
function addComment(goalId, text, isPublic = false) {
    if (!text.trim()) return;

    const comment = { id: Date.now().toString(), author: currentUser, text, createdAt: Date.now() };

    if (isPublic && db) {
        db.collection("publicGoals").doc(goalId).update({
            comments: firebase.firestore.FieldValue.arrayUnion(comment)
        });
        if (analytics) analytics.logEvent('comment_goal', { goalId });
    } else {
        const goal = goals.find(g => g.id === goalId);
        if (!goal) return;
        goal.comments.push(comment);
    }

    myComments.push({ ...comment, goalId });
    saveData();
    renderGoals();
}

function submitComment(goalId, isPublic = false) {
    const input = document.querySelector(`input[data-goal="${goalId}"]`);
    if (input && input.value.trim()) {
        addComment(goalId, input.value.trim(), isPublic);
        input.value = '';
    }
}

// ===============================
// NAVIGATION
// ===============================
function showSection(section) {
    document.querySelectorAll('.goals-section').forEach(s => s.classList.remove('active'));

    switch(section) {
        case 'public':
            document.getElementById('publicSection').classList.add('active');
            renderPublicGoals();
            break;
        case 'private':
            document.getElementById('privateSection').classList.add('active');
            renderPrivateGoals();
            break;
    }
}

// ===============================
// RENDER
// ===============================
function renderPublicGoals() {
    const container = document.getElementById('publicGoals');
    if (!publicGoals.length) {
        container.innerHTML = '<div class="empty-state">Aucun objectif public</div>';
        return;
    }
    container.innerHTML = publicGoals.map(g => createGoalCard(g, true)).join('');
    attachCardEvents();
}

function renderPrivateGoals() {
    const container = document.getElementById('privateGoals');
    if (!goals.length) {
        container.innerHTML = '<div class="empty-state">Aucun objectif privé</div>';
        return;
    }
    container.innerHTML = goals.map(g => createGoalCard(g, false)).join('');
    attachCardEvents();
}

// ===============================
// CARTE OBJECTIF
// ===============================
function createGoalCard(goal, isPublic) {
    const isLiked = myLikes.includes(goal.id);
    return `
        <div class="goal-card">
            <h3>${escapeHtml(goal.title)}</h3>
            <p>${escapeHtml(goal.description)}</p>
            <div class="progress-bar">
                <div class="progress-fill" style="width:${goal.progress}%"></div>
            </div>
            <div class="goal-actions">
                <button class="btn btn-danger" onclick="deleteGoal('${goal.id}', ${isPublic})">🗑️</button>
                ${isPublic ? `<button class="btn btn-like" onclick="toggleLike('${goal.id}', true)">${isLiked ? '❤️' : '🤍'} ${goal.likes}</button>` : ''}
            </div>
        </div>
    `;
}

// ===============================
// EVENTS CARTES
// ===============================
function attachCardEvents() {
    document.querySelectorAll('.comment-input').forEach(input => {
        input.addEventListener('keypress', e => {
            if (e.key === 'Enter') submitComment(input.dataset.goal);
        });
    });
}

// ===============================
// STORAGE
// ===============================
function saveData() {
    const data = { goals, myLikes, myComments };
    localStorage.setItem('goalsTrackerData', JSON.stringify(data));
}

function loadData() {
    const saved = localStorage.getItem('goalsTrackerData');
    if (saved) {
        const data = JSON.parse(saved);
        goals = data.goals || [];
        myLikes = data.myLikes || [];
        myComments = data.myComments || [];
    }
}

// ===============================
// UTILS
// ===============================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
