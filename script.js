// État de l'application
let goals = [];
let myLikes = [];
let myComments = [];
let currentGoalId = null;
let currentUser = 'Utilisateur';
let analytics = null;

// Charger les données au démarrage
window.addEventListener('DOMContentLoaded', () => {
    // Initialiser Firebase Analytics si disponible
    if (typeof firebase !== 'undefined' && firebase.analytics) {
        analytics = firebase.analytics();
    }
    
    loadData();
    setupEventListeners();
    renderGoals();
});

// Configuration des écouteurs d'événements
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

    // Bouton nouvel objectif
    document.getElementById('addGoalBtn').addEventListener('click', () => openModal());

    // Fermeture modale
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });

    document.getElementById('cancelBtn').addEventListener('click', closeModals);

    // Soumission formulaire
    document.getElementById('goalForm').addEventListener('submit', saveGoal);

    // Slider progression
    document.getElementById('goalProgress').addEventListener('input', (e) => {
        document.getElementById('progressValue').textContent = e.target.value;
    });

    // Visibilité publique/privée
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
        saveSettings();
    });

    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const color = btn.dataset.color;
            document.documentElement.style.setProperty('--primary', color);
            saveSettings();
        });
    });

    // Fermeture modale en cliquant à l'extérieur
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModals();
        }
    });
}

function openModal(goalId = null) {
    currentGoalId = goalId;
    const modal = document.getElementById('modal');
    const form = document.getElementById('goalForm');
    
    if (goalId) {
        const goal = goals.find(g => g.id === goalId);
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
            document.getElementById('displayName').value = goal.displayName;
            document.getElementById('allowComments').checked = goal.allowComments;
            
            if (goal.displayName === 'pseudo') {
                document.getElementById('pseudoInput').style.display = 'block';
                document.getElementById('pseudoInput').value = goal.authorName;
                document.getElementById('realNameInput').style.display = 'none';
            } else if (goal.displayName === 'real') {
                document.getElementById('realNameInput').style.display = 'block';
                document.getElementById('realNameInput').value = goal.authorName;
                document.getElementById('pseudoInput').style.display = 'none';
            } else {
                document.getElementById('pseudoInput').style.display = 'none';
                document.getElementById('realNameInput').style.display = 'none';
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
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    currentGoalId = null;
}

function saveGoal(e) {
    e.preventDefault();
    
    const title = document.getElementById('goalTitle').value;
    const description = document.getElementById('goalDescription').value;
    const type = document.getElementById('goalType').value;
    const progress = parseInt(document.getElementById('goalProgress').value);
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
        id: currentGoalId || Date.now().toString(),
        title,
        description,
        type,
        progress,
        visibility,
        displayName,
        authorName,
        allowComments,
        likes: currentGoalId ? goals.find(g => g.id === currentGoalId).likes : 0,
        comments: currentGoalId ? goals.find(g => g.id === currentGoalId).comments : [],
        createdAt: currentGoalId ? goals.find(g => g.id === currentGoalId).createdAt : Date.now()
    };
    
    if (currentGoalId) {
        const index = goals.findIndex(g => g.id === currentGoalId);
        goals[index] = goal;
    } else {
        goals.push(goal);
        // Analytics: suivi nouvel objectif
        if (analytics) {
            analytics.logEvent('add_goal', { title, visibility });
        }
    }
    
    saveData();
    renderGoals();
    closeModals();
}

function deleteGoal(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet objectif ?')) {
        goals = goals.filter(g => g.id !== id);
        myLikes = myLikes.filter(l => l !== id);
        myComments = myComments.filter(c => c.goalId !== id);
        saveData();
        renderGoals();
    }
}

function toggleLike(id) {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    
    const likeIndex = myLikes.indexOf(id);
    if (likeIndex > -1) {
        myLikes.splice(likeIndex, 1);
        goal.likes--;
    } else {
        myLikes.push(id);
        goal.likes++;
        // Analytics: suivi like
        if (analytics) {
            analytics.logEvent('like_goal', { goalId: id });
        }
    }
    
    saveData();
    renderGoals();
}

function addComment(goalId, text) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal || !goal.allowComments) return;
    
    const comment = {
        id: Date.now().toString(),
        goalId,
        author: currentUser,
        text,
        createdAt: Date.now()
    };
    
    goal.comments.push(comment);
    myComments.push(comment);
    // Analytics: suivi commentaire
    if (analytics) {
        analytics.logEvent('comment_goal', { goalId });
    }
    saveData();
    renderGoals();
}

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

function renderGoals() {
    const activeSection = document.querySelector('.goals-section.active');
    if (!activeSection) return;
    
    const activeSectionId = activeSection.id;
    
    if (activeSectionId === 'publicSection') renderPublicGoals();
    else if (activeSectionId === 'privateSection') renderPrivateGoals();
    else if (activeSectionId === 'commentsSection') renderMyComments();
    else if (activeSectionId === 'likesSection') renderMyLikes();
}

function renderPublicGoals() {
    const container = document.getElementById('publicGoals');
    const publicGoals = goals.filter(g => g.visibility === 'public');
    
    if (publicGoals.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>Aucun objectif public pour le moment</p></div>';
        return;
    }
    
    container.innerHTML = publicGoals.map(goal => createGoalCard(goal, true)).join('');
    attachGoalEventListeners();
}

function renderPrivateGoals() {
    const container = document.getElementById('privateGoals');
    const privateGoals = goals.filter(g => g.visibility === 'private');
    
    if (privateGoals.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>Aucun objectif privé pour le moment</p></div>';
        return;
    }
    
    container.innerHTML = privateGoals.map(goal => createGoalCard(goal, false)).join('');
    attachGoalEventListeners();
}

function renderMyComments() {
    const container = document.getElementById('myComments');
    const commentedGoals = goals.filter(g => g.comments.some(c => myComments.find(mc => mc.id === c.id)));
    
    if (commentedGoals.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💬</div><p>Vous n\'avez pas encore commenté</p></div>';
        return;
    }
    
    container.innerHTML = commentedGoals.map(goal => createGoalCard(goal, true)).join('');
    attachGoalEventListeners();
}

function renderMyLikes() {
    const container = document.getElementById('myLikes');
    const likedGoals = goals.filter(g => myLikes.includes(g.id));
    
    if (likedGoals.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❤️</div><p>Vous n\'avez pas encore aimé d\'objectifs</p></div>';
        return;
    }
    
    container.innerHTML = likedGoals.map(goal => createGoalCard(goal, true)).join('');
    attachGoalEventListeners();
}

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
                <button class="btn btn-primary" onclick="openModal('${goal.id}')">✏️ Modifier</button>
                <button class="btn btn-danger" onclick="deleteGoal('${goal.id}')">🗑️ Supprimer</button>
                ${isPublic ? `
                    <button class="btn btn-like ${isLiked ? 'liked' : ''}" onclick="toggleLike('${goal.id}')">
                        ${isLiked ? '❤️' : '🤍'} ${goal.likes}
                    </button>
                ` : ''}
            </div>
            ${isPublic && goal.allowComments ? `
                <div class="comments-section">
                    <h4>💬 Commentaires (${goal.comments.length})</h4>
                    ${goal.comments.map(c => `
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

function submitComment(goalId) {
    const input = document.querySelector(`input[data-goal="${goalId}"]`);
    if (input && input.value.trim()) {
        addComment(goalId, input.value.trim());
        input.value = '';
    }
}

function attachGoalEventListeners() {
    document.querySelectorAll('.comment-input').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitComment(input.dataset.goal);
            }
        });
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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

function saveSettings() {
    saveData();
}
function saveSettings() {
    saveData();
}
