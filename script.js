// ===============================
// ÉTAT DE L'APPLICATION
// ===============================
let goals = [];
let publicGoals = [];
let myLikes = [];
let myComments = [];
let currentGoalId = null;
let currentUser = 'Utilisateur';
let analytics = null;
let db = null;

// Rendre les fonctions globales pour qu'elles soient accessibles partout
window.openModal = openModal;
window.deleteGoal = deleteGoal;
window.toggleLike = toggleLike;
window.submitComment = submitComment;

// ===============================
// CHARGEMENT INITIAL
// ===============================
window.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase !== 'undefined') {
        analytics = firebase.analytics();
        db = firebase.firestore();

        // 🔥 Synchronisation temps réel des objectifs publics
        db.collection("publicGoals")
            .orderBy("createdAt", "desc")
            .onSnapshot(snapshot => {
                publicGoals = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                if (document.querySelector('#publicSection.active')) {
                    renderPublicGoals();
                }
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
    // Navigation principale
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            showSection(btn.dataset.section);
        });
    });

    // Navigation secondaire
    document.querySelectorAll('.secondary-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            showSection(btn.dataset.section);
        });
    });

    // Boutons modaux
    document.getElementById('addGoalBtn').addEventListener('click', () => openModal());
    document.querySelectorAll('.close').forEach(btn => btn.addEventListener('click', closeModals));
    document.getElementById('cancelBtn').addEventListener('click', closeModals);

    // Formulaire
    document.getElementById('goalForm').addEventListener('submit', saveGoal);

    // Slider progression
    document.getElementById('goalProgress').addEventListener('input', (e) => {
        document.getElementById('progressValue').textContent = e.target.value;
    });

    // Visibilité
    document.querySelectorAll('input[name="visibility"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const publicOptions = document.getElementById('publicOptions');
            publicOptions.style.display = e.target.value === 'public' ? 'block' : 'none';
        });
    });

    // Nom affiché
    document.getElementById('displayName').addEventListener('change', (e) => {
        const pseudoInput = document.getElementById('pseudoInput');
        const realNameInput = document.getElementById('realNameInput');
        pseudoInput.style.display = e.target.value === 'pseudo' ? 'block' : 'none';
        realNameInput.style.display = e.target.value === 'real' ? 'block' : 'none';
    });

    // Paramètres
    document.getElementById('settingsBtn').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.add('active');
    });
    document.getElementById('closeSettings').addEventListener('click', closeModals);

    document.getElementById('themeSelect').addEventListener('change', (e) => {
        document.body.className = e.target.value;
        saveData();
    });

    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.documentElement.style.setProperty('--primary', btn.dataset.color);
            saveData();
        });
    });

    // Fermer modal en cliquant à l'extérieur
    window.addEventListener('click', (e) => {
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
        // Mode modification
        const goal = goals.find(g => g.id === goalId);
        if (!goal) return;

        document.getElementById('modalTitle').textContent = '✏️ Modifier l\'objectif';
        document.getElementById('goalTitle').value = goal.title;
        document.getElementById('goalDescription').value = goal.description || '';
        document.getElementById('goalType').value = goal.type;
        document.getElementById('goalProgress').value = goal.progress;
        document.getElementById('progressValue').textContent = goal.progress;
        document.querySelector(`input[name="visibility"][value="${goal.visibility}"]`).checked = true;

        if (goal.visibility === 'public') {
            document.getElementById('publicOptions').style.display = 'block';
            document.getElementById('displayName').value = goal.displayName || 'anonymous';
            document.getElementById('allowComments').checked = goal.allowComments !== false;

            if (goal.displayName === 'pseudo') {
                document.getElementById('pseudoInput').style.display = 'block';
                document.getElementById('pseudoInput').value = goal.authorName;
            } else if (goal.displayName === 'real') {
                document.getElementById('realNameInput').style.display = 'block';
                document.getElementById('realNameInput').value = goal.authorName;
            }
        }
    } else {
        // Mode création
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
        if (displayName === 'pseudo') {
            authorName = document.getElementById('pseudoInput').value || 'Anonyme';
        } else if (displayName === 'real') {
            authorName = document.getElementById('realNameInput').value || currentUser;
        }
    }

    const goal = {
        title,
        description,
        type,
        progress,
        visibility,
        displayName,
        authorName,
        allowComments,
        likes: 0,
        comments: [],
        createdAt: Date.now()
    };

    if (currentGoalId) {
        // Modification (seulement privés pour l'instant)
        const index = goals.findIndex(g => g.id === currentGoalId);
        if (index !== -1) {
            goals[index] = { ...goal, id: currentGoalId, likes: goals[index].likes, comments: goals[index].comments };
            saveData();
            renderPrivateGoals();
        }
    } else {
        // Création
        if (visibility === 'public' && db) {
            db.collection("publicGoals").add(goal);
            if (analytics) analytics.logEvent('add_goal', { visibility: 'public' });
        } else {
            goals.push({ ...goal, id: Date.now().toString() });
            saveData();
            renderPrivateGoals();
            if (analytics) analytics.logEvent('add_goal', { visibility: 'private' });
        }
    }

    closeModals();
}

// ===============================
// SUPPRESSION
// ===============================
function deleteGoal(id, isPublic) {
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
function toggleLike(id) {
    const likeIndex = myLikes.indexOf(id);
    const goal = publicGoals.find(g => g.id === id);
    
    if (!goal || !db) return;

    const goalRef = db.collection("publicGoals").doc(id);
    
    if (likeIndex > -1) {
        myLikes.splice(likeIndex, 1);
        goalRef.update({ likes: firebase.firestore.FieldValue.increment(-1) });
    } else {
        myLikes.push(id);
        goalRef.update({ likes: firebase.firestore.FieldValue.increment(1) });
        if (analytics) analytics.logEvent('like_goal', { goalId: id });
    }

    saveData();
}

// ===============================
// COMMENTAIRES
// ===============================
function submitComment(goalId) {
    const input = document.querySelector(`input[data-goal="${goalId}"]`);
    if (!input || !input.value.trim()) return;

    const comment = {
        id: Date.now().toString(),
        author: currentUser,
        text: input.value.trim(),
        createdAt: Date.now()
    };

    if (db) {
        const goalRef = db.collection("publicGoals").doc(goalId);
        goalRef.update({
            comments: firebase.firestore.FieldValue.arrayUnion(comment)
        });
        if (analytics) analytics.logEvent('comment_goal', { goalId });
    }

    myComments.push({ ...comment, goalId });
    saveData();
    input.value = '';
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
        case 'comments':
            document.getElementById('commentsSection').classList.add('active');
            renderMyComments();
            break;
        case 'likes':
            document.getElementById('likesSection').classList.add('active');
            renderMyLikes();
            break;
    }
}

// ===============================
// RENDER
// ===============================
function renderPublicGoals() {
    const container = document.getElementById('publicGoals');

    if (!publicGoals.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>Aucun objectif public pour le moment</p></div>';
        return;
    }

    container.innerHTML = publicGoals.map(g => createGoalCard(g, true)).join('');
    attachCommentListeners();
}

function renderPrivateGoals() {
    const container = document.getElementById('privateGoals');

    if (!goals.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>Aucun objectif privé pour le moment</p></div>';
        return;
    }

    container.innerHTML = goals.map(g => createGoalCard(g, false)).join('');
    attachCommentListeners();
}

function renderMyComments() {
    const container = document.getElementById('myComments');
    const commentedGoals = publicGoals.filter(g => 
        g.comments && g.comments.some(c => myComments.find(mc => mc.id === c.id))
    );

    if (!commentedGoals.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💬</div><p>Vous n\'avez pas encore commenté</p></div>';
        return;
    }

    container.innerHTML = commentedGoals.map(g => createGoalCard(g, true)).join('');
    attachCommentListeners();
}

function renderMyLikes() {
    const container = document.getElementById('myLikes');
    const likedGoals = publicGoals.filter(g => myLikes.includes(g.id));

    if (!likedGoals.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❤️</div><p>Vous n\'avez pas encore aimé d\'objectifs</p></div>';
        return;
    }

    container.innerHTML = likedGoals.map(g => createGoalCard(g, true)).join('');
    attachCommentListeners();
}

// ===============================
// CARTE OBJECTIF
// ===============================
function createGoalCard(goal, isPublic) {
    const typeLabels = { day: '📅 Jour', week: '📆 Semaine', month: '🗓️ Mois', year: '📊 Année' };
    const isLiked = myLikes.includes(goal.id);

    return `
        <div class="goal-card">
            <div class="goal-header">
                <div>
                    <div class="goal-title">${escapeHtml(goal.title)}</div>
                    ${isPublic ? `<small style="color: var(--text-light);">Par ${escapeHtml(goal.authorName)}</small>` : ''}
                </div>
                <span class="goal-type">${typeLabels[goal.type]}</span>
            </div>
            ${goal.description ? `<div class="goal-description">${escapeHtml(goal.description)}</div>` : ''}
            <div class="progress-container">
                <div class="progress-label">
                    <span>Progression</span>
                    <span><strong>${goal.progress}%</strong></span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${goal.progress}%"></div>
                </div>
            </div>
            <div class="goal-actions">
                ${!isPublic ? `<button class="btn btn-primary" onclick="openModal('${goal.id}')">✏️ Modifier</button>` : ''}
                <button class="btn btn-danger" onclick="deleteGoal('${goal.id}', ${isPublic})">🗑️ Supprimer</button>
                ${isPublic ? `<button class="btn btn-like ${isLiked ? 'liked' : ''}" onclick="toggleLike('${goal.id}')">${isLiked ? '❤️' : '🤍'} ${goal.likes || 0}</button>` : ''}
            </div>
            ${isPublic && goal.allowComments !== false ? `
                <div class="comments-section">
                    <h4>💬 Commentaires (${(goal.comments || []).length})</h4>
                    ${(goal.comments || []).map(c => `
                        <div class="comment">
                            <div class="comment-author">${escapeHtml(c.author)}</div>
                            <div class="comment-text">${escapeHtml(c.text)}</div>
                        </div>
                    `).join('')}
                    <div class="comment-form">
                        <input type="text" class="comment-input" placeholder="Ajouter un commentaire..." data-goal="${goal.id}">
                        <button class="btn btn-primary" onclick="submitComment('${goal.id}')">💬</button>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

// ===============================
// LISTENERS COMMENTAIRES
// ===============================
function attachCommentListeners() {
    document.querySelectorAll('.comment-input').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitComment(input.dataset.goal);
            }
        });
    });
}

// ===============================
// STORAGE
// ===============================
function saveData() {
    const data = {
        goals,
        myLikes,
        myComments,
        theme: document.body.className,
        primaryColor: getComputedStyle(document.documentElement).getPropertyValue('--primary')
    };
    localStorage.setItem('goalsTrackerData', JSON.stringify(data));
}

function loadData() {
    const saved = localStorage.getItem('goalsTrackerData');
    if (saved) {
        const data = JSON.parse(saved);
        goals = data.goals || [];
        myLikes = data.myLikes || [];
        myComments = data.myComments || [];

        if (data.theme) {
            document.body.className = data.theme;
            document.getElementById('themeSelect').value = data.theme;
        }

        if (data.primaryColor) {
            document.documentElement.style.setProperty('--primary', data.primaryColor);
        }
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
