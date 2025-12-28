// ========================================
// DONNÉES ET ÉTAT
// ========================================

let goals = JSON.parse(localStorage.getItem('goals')) || [];
let checkins = JSON.parse(localStorage.getItem('checkins')) || [];
let socialInteractions = JSON.parse(localStorage.getItem('socialInteractions')) || {};

// ========================================
// NAVIGATION
// ========================================

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const section = btn.dataset.section;

        // Update active nav button
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update active section
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(section).classList.add('active');

        // Render appropriate section
        if (section === 'mes-objectifs') renderMyGoals();
        if (section === 'objectifs-publics') renderPublicGoals();
        if (section === 'check-in') renderCheckIn();
    });
});

// ========================================
// MODAL GESTION
// ========================================

const modalGoal = document.getElementById('modal-goal');
const modalDetails = document.getElementById('modal-goal-details');

document.getElementById('btn-new-goal').addEventListener('click', () => {
    openGoalModal();
});

document.getElementById('modal-goal-close').addEventListener('click', () => {
    modalGoal.classList.remove('active');
});

document.getElementById('modal-details-close').addEventListener('click', () => {
    modalDetails.classList.remove('active');
});

// ========================================
// PROGRESS SLIDERS
// ========================================

const goalProgressSlider = document.getElementById('goal-progress');
const goalProgressValue = document.getElementById('goal-progress-value');

goalProgressSlider.addEventListener('input', (e) => {
    goalProgressValue.textContent = e.target.value + '%';
});

const checkinProgressSlider = document.getElementById('checkin-progress');
const checkinProgressValue = document.getElementById('checkin-progress-value');

checkinProgressSlider.addEventListener('input', (e) => {
    checkinProgressValue.textContent = e.target.value + '%';
});

// ========================================
// CRÉER/MODIFIER OBJECTIF
// ========================================

function openGoalModal(goalId = null) {
    const form = document.getElementById('goal-form');
    form.reset();

    if (goalId) {
        const goal = goals.find(g => g.id === goalId);
        if (goal) {
            document.getElementById('modal-goal-title').textContent = 'Modifier l\'objectif';
            document.getElementById('goal-id').value = goal.id;
            document.getElementById('goal-title').value = goal.title;
            document.getElementById('goal-description').value = goal.description;
            document.querySelector(`input[name="goal-type"][value="${goal.type}"]`).checked = true;
            document.getElementById('goal-progress').value = goal.progress;
            goalProgressValue.textContent = goal.progress + '%';
            document.querySelector(`input[name="goal-visibility"][value="${goal.visibility}"]`).checked = true;
            document.querySelector(`input[name="goal-display-name"][value="${goal.displayName}"]`).checked = true;
            document.getElementById('goal-user-name').value = goal.userName || '';
            document.getElementById('goal-allow-comments').checked = goal.allowComments;
        }
    } else {
        document.getElementById('modal-goal-title').textContent = 'Créer un objectif';
        goalProgressValue.textContent = '0%';
    }

    modalGoal.classList.add('active');
}

document.getElementById('goal-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const goalId = document.getElementById('goal-id').value;
    const title = document.getElementById('goal-title').value;
    const description = document.getElementById('goal-description').value;
    const type = document.querySelector('input[name="goal-type"]:checked').value;
    const progress = parseInt(document.getElementById('goal-progress').value);
    const visibility = document.querySelector('input[name="goal-visibility"]:checked').value;
    const displayName = document.querySelector('input[name="goal-display-name"]:checked').value;
    const userName = document.getElementById('goal-user-name').value;
    const allowComments = document.getElementById('goal-allow-comments').checked;

    if (goalId) {
        // Modifier
        const index = goals.findIndex(g => g.id === goalId);
        if (index !== -1) {
            goals[index] = {
                ...goals[index],
                title,
                description,
                type,
                progress,
                visibility,
                displayName,
                userName,
                allowComments,
                lastUpdate: new Date().toISOString()
            };
        }
    } else {
        // Créer
        const newGoal = {
            id: Date.now().toString(),
            title,
            description,
            type,
            progress,
            visibility,
            displayName,
            userName,
            allowComments,
            createdAt: new Date().toISOString(),
            lastUpdate: new Date().toISOString()
        };
        goals.push(newGoal);
    }

    saveGoals();
    modalGoal.classList.remove('active');
    renderMyGoals();
});

// ========================================
// AFFICHAGE MES OBJECTIFS
// ========================================

function renderMyGoals() {
    const container = document.getElementById('my-goals-list');

    if (goals.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bullseye"></i>
                <p>Aucun objectif créé</p>
                <p style="font-size: 14px; margin-top: 8px;">Cliquez sur "Créer un objectif" pour commencer</p>
            </div>
        `;
        return;
    }

    container.innerHTML = goals.map(goal => `
        <div class="goal-item">
            <div class="goal-header">
                <div>
                    <div class="goal-title">${goal.title}</div>
                    <span class="goal-type">${goal.type}</span>
                </div>
            </div>

            ${goal.description ? `<div class="goal-description">${goal.description}</div>` : ''}

            <div class="progress-container">
                <div class="progress-label">
                    <span>Progression</span>
                    <span>${goal.progress}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${goal.progress}%"></div>
                </div>
            </div>

            <div class="goal-meta">
                <span><i class="fas fa-eye${goal.visibility === 'privé' ? '-slash' : ''}"></i> ${goal.visibility === 'privé' ? 'Privé' : 'Public'}</span>
                <span><i class="fas fa-calendar"></i> Créé le ${formatDate(goal.createdAt)}</span>
                <span><i class="fas fa-clock"></i> Mis à jour le ${formatDate(goal.lastUpdate)}</span>
            </div>

            <div class="goal-actions">
                <button class="btn btn-secondary" onclick="openGoalModal('${goal.id}')">
                    <i class="fas fa-edit"></i> Modifier
                </button>
                <button class="btn btn-secondary" onclick="viewGoalDetails('${goal.id}')">
                    <i class="fas fa-info-circle"></i> Détails
                </button>
                <button class="btn btn-danger" onclick="deleteGoal('${goal.id}')">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
                ${goal.progress === 100 ? '<button class="btn btn-success"><i class="fas fa-check"></i> Terminé</button>' : ''}
            </div>
        </div>
    `).join('');
}

// ========================================
// AFFICHAGE OBJECTIFS PUBLICS
// ========================================

function renderPublicGoals() {
    const container = document.getElementById('public-goals-list');
    const publicGoals = goals.filter(g => g.visibility === 'public');

    if (publicGoals.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-globe"></i>
                <p>Aucun objectif public</p>
                <p style="font-size: 14px; margin-top: 8px;">Les objectifs publics apparaîtront ici</p>
            </div>
        `;
        return;
    }

    container.innerHTML = publicGoals.map(goal => {
        const displayedName = getDisplayedName(goal);
        const interactions = socialInteractions[goal.id] || { likes: [], dislikes: [], comments: [] };
        const userLiked = interactions.likes.includes('current-user');
        const userDisliked = interactions.dislikes.includes('current-user');

        return `
            <div class="goal-item">
                <div class="goal-header">
                    <div>
                        <div class="goal-title">${goal.title}</div>
                        <span class="goal-type">${goal.type}</span>
                    </div>
                </div>

                ${goal.description ? `<div class="goal-description">${goal.description}</div>` : ''}

                <div class="progress-container">
                    <div class="progress-label">
                        <span>Progression</span>
                        <span>${goal.progress}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${goal.progress}%"></div>
                    </div>
                </div>

                <div class="goal-meta">
                    <span><i class="fas fa-user"></i> ${displayedName}</span>
                    <span><i class="fas fa-clock"></i> Mis à jour le ${formatDate(goal.lastUpdate)}</span>
                </div>

                <div class="social-actions">
                    <button class="social-btn ${userLiked ? 'active' : ''}" onclick="toggleLike('${goal.id}')">
                        <i class="fas fa-thumbs-up"></i>
                        <span>${interactions.likes.length}</span>
                    </button>
                    <button class="social-btn dislike ${userDisliked ? 'active' : ''}" onclick="toggleDislike('${goal.id}')">
                        <i class="fas fa-thumbs-down"></i>
                        <span>${interactions.dislikes.length}</span>
                    </button>
                    ${goal.allowComments ? `
                        <button class="social-btn" onclick="toggleComments('${goal.id}')">
                            <i class="fas fa-comment"></i>
                            <span>${interactions.comments.length}</span>
                        </button>
                    ` : ''}
                </div>

                ${goal.allowComments ? `
                    <div class="comments-section" id="comments-${goal.id}" style="display: none;">
                        <div class="comment-form">
                            <input type="text" placeholder="Écrire un commentaire..." id="comment-input-${goal.id}">
                            <button class="btn" onclick="addComment('${goal.id}')">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                        <div id="comments-list-${goal.id}">
                            ${interactions.comments.map(c => `
                                <div class="comment-item">
                                    <div class="comment-author">${c.author}</div>
                                    <div>${c.text}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// ========================================
// INTERACTIONS SOCIALES
// ========================================

function toggleLike(goalId) {
    if (!socialInteractions[goalId]) {
        socialInteractions[goalId] = { likes: [], dislikes: [], comments: [] };
    }

    const likes = socialInteractions[goalId].likes;
    const dislikes = socialInteractions[goalId].dislikes;
    const userIndex = likes.indexOf('current-user');

    if (userIndex > -1) {
        likes.splice(userIndex, 1);
    } else {
        likes.push('current-user');
        const dislikeIndex = dislikes.indexOf('current-user');
        if (dislikeIndex > -1) dislikes.splice(dislikeIndex, 1);
    }

    saveSocialInteractions();
    renderPublicGoals();
}

function toggleDislike(goalId) {
    if (!socialInteractions[goalId]) {
        socialInteractions[goalId] = { likes: [], dislikes: [], comments: [] };
    }

    const likes = socialInteractions[goalId].likes;
    const dislikes = socialInteractions[goalId].dislikes;
    const userIndex = dislikes.indexOf('current-user');

    if (userIndex > -1) {
        dislikes.splice(userIndex, 1);
    } else {
        dislikes.push('current-user');
        const likeIndex = likes.indexOf('current-user');
        if (likeIndex > -1) likes.splice(likeIndex, 1);
    }

    saveSocialInteractions();
    renderPublicGoals();
}

function toggleComments(goalId) {
    const commentsSection = document.getElementById(`comments-${goalId}`);
    commentsSection.style.display = commentsSection.style.display === 'none' ? 'block' : 'none';
}

function addComment(goalId) {
    const input = document.getElementById(`comment-input-${goalId}`);
    const text = input.value.trim();

    if (!text) return;

    if (!socialInteractions[goalId]) {
        socialInteractions[goalId] = { likes: [], dislikes: [], comments: [] };
    }

    socialInteractions[goalId].comments.push({
        author: 'Utilisateur',
        text: text,
        date: new Date().toISOString()
    });

    saveSocialInteractions();
    input.value = '';
    renderPublicGoals();
    toggleComments(goalId);
}

// ========================================
// CHECK-IN QUOTIDIEN
// ========================================

function renderCheckIn() {
    const select = document.getElementById('checkin-goal-select');
    select.innerHTML = '<option value="">-- Sélectionner un objectif --</option>' + 
        goals.map(g => `<option value="${g.id}">${g.title}</option>`).join('');

    select.addEventListener('change', (e) => {
        const goal = goals.find(g => g.id === e.target.value);
        if (goal) {
            document.getElementById('checkin-progress').value = goal.progress;
            checkinProgressValue.textContent = goal.progress + '%';
        }
    });

    renderCheckInHistory();
}

document.getElementById('btn-save-checkin').addEventListener('click', () => {
    const goalId = document.getElementById('checkin-goal-select').value;
    const note = document.getElementById('checkin-note').value.trim();
    const progress = parseInt(document.getElementById('checkin-progress').value);

    if (!goalId) {
        alert('Veuillez sélectionner un objectif');
        return;
    }

    if (!note) {
        alert('Veuillez écrire une note');
        return;
    }

    const goal = goals.find(g => g.id === goalId);
    if (goal) {
        goal.progress = progress;
        goal.lastUpdate = new Date().toISOString();
        saveGoals();
    }

    const checkin = {
        id: Date.now().toString(),
        goalId: goalId,
        goalTitle: goal.title,
        note: note,
        progress: progress,
        date: new Date().toISOString()
    };

    checkins.push(checkin);
    saveCheckIns();

    document.getElementById('checkin-note').value = '';

    alert('Check-in enregistré avec succès !');
    renderCheckInHistory();
});

function renderCheckInHistory() {
    const container = document.getElementById('checkin-history');

    if (checkins.length === 0) {
        container.innerHTML = `
            <div class="card">
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>Aucun check-in enregistré</p>
                </div>
            </div>
        `;
        return;
    }

    const sortedCheckins = [...checkins].sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = `
        <div class="card">
            <h3 style="margin-bottom: 20px;">Historique des check-ins</h3>
            ${sortedCheckins.map(c => `
                <div class="checkin-item">
                    <div class="checkin-date">${formatDate(c.date)}</div>
                    <div class="checkin-progress">
                        <strong>${c.goalTitle}</strong> - ${c.progress}%
                    </div>
                    <div class="checkin-note">${c.note}</div>
                </div>
            `).join('')}
        </div>
    `;
}

// ========================================
// DÉTAILS OBJECTIF
// ========================================

function viewGoalDetails(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const goalCheckins = checkins.filter(c => c.goalId === goalId);

    const content = `
        <div>
            <h3 style="margin-bottom: 16px;">${goal.title}</h3>
            <div class="goal-meta" style="margin-bottom: 20px;">
                <span><i class="fas fa-tag"></i> ${goal.type}</span>
                <span><i class="fas fa-eye${goal.visibility === 'privé' ? '-slash' : ''}"></i> ${goal.visibility}</span>
            </div>

            ${goal.description ? `<p style="margin-bottom: 20px; color: var(--text-light);">${goal.description}</p>` : ''}

            <div class="progress-container">
                <div class="progress-label">
                    <span>Progression actuelle</span>
                    <span>${goal.progress}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${goal.progress}%"></div>
                </div>
            </div>

            <div style="margin-top: 24px;">
                <h4 style="margin-bottom: 12px;">Check-ins (${goalCheckins.length})</h4>
                ${goalCheckins.length === 0 ? '<p style="color: var(--text-light);">Aucun check-in pour cet objectif</p>' : 
                    goalCheckins.sort((a, b) => new Date(b.date) - new Date(a.date)).map(c => `
                        <div class="checkin-item">
                            <div class="checkin-date">${formatDate(c.date)}</div>
                            <div class="checkin-progress">${c.progress}%</div>
                            <div class="checkin-note">${c.note}</div>
                       
