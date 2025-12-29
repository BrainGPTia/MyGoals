// =================================================================
// 1. CONFIGURATION ET CONSTANTES GLOBALES
// =================================================================

const STORAGE_KEYS = {
    PRIVATE_GOALS: 'myPrivateGoals',
    THEME: 'themePreference',
    COLOR: 'colorPreference'
};
const DEFAULT_COLOR = '#007bff';
const DEFAULT_THEME = 'light';

// État de l'application
let currentView = 'public'; // 'public' ou 'private'
let currentGoalIdToComment = null;
let currentGoalVisibilityToComment = null;

// DOM Elements
const goalsList = document.getElementById('goals-list');
const goalModal = document.getElementById('goal-modal');
const settingsModal = document.getElementById('settings-modal');
const commentsModal = document.getElementById('comments-modal');
const publicOptions = document.getElementById('public-options');
const goalForm = document.getElementById('goal-form');
const progressRange = document.getElementById('progress');
const progressValueSpan = document.getElementById('progress-value');
const emptyState = document.getElementById('empty-state');
const modalTitle = document.getElementById('modal-title');


// =================================================================
// 2. GESTION DU LOCAL STORAGE (UTILITAIRES DE BASE)
// Ces fonctions doivent être définies en premier.
// =================================================================

const getPrivateGoals = () => {
    try {
        const storedGoals = localStorage.getItem(STORAGE_KEYS.PRIVATE_GOALS);
        return storedGoals ? JSON.parse(storedGoals) : [];
    } catch (error) {
        console.error("Erreur de lecture des objectifs privés :", error);
        return [];
    }
};

const savePrivateGoals = (privateGoals) => {
    try {
        localStorage.setItem(STORAGE_KEYS.PRIVATE_GOALS, JSON.stringify(privateGoals));
    } catch (error) {
        console.error("Erreur de sauvegarde des objectifs privés :", error);
    }
};

// FONCTIONS UTILITAIRES POUR LES PRÉFÉRENCES (Résout le ReferenceError)
const getUserPreference = (key, defaultValue) => {
    return localStorage.getItem(key) || defaultValue;
};

const saveUserPreference = (key, value) => {
    try {
        localStorage.setItem(key, value);
    } catch (error) {
        console.error(`Erreur de sauvegarde de la préférence ${key} :`, error);
    }
};


// =================================================================
// 3. GESTION FIREBASE (SIMULATION)
// =================================================================

let publicGoalsMock = [
    { id: 'p1', title: 'Apprendre React', description: 'Étudier les hooks.', type: 'semaine', progress: 50, visibility: 'public', authorId: 'user123', displayName: 'GeminiDev', allowComments: true, likes: ['user456'], comments: [{ text: 'Bonne chance !', displayName: 'Bob', createdAt: new Date().toISOString() }], createdAt: new Date().toISOString() },
    { id: 'p2', title: 'Courir 10km', description: 'Atteindre l\'objectif en fin de mois.', type: 'mois', progress: 80, visibility: 'public', authorId: 'user456', displayName: 'RunnerX', allowComments: false, likes: [], comments: [], createdAt: new Date().toISOString() }
];

const getCurrentUser = () => {
    // Remplacer par auth.currentUser.uid si vous utilisez Firebase Auth
    return 'demoUserUID_123'; 
}

const updatePublicGoalInDb = async (goalId, updatedData) => {
    // SIMULATION
    const index = publicGoalsMock.findIndex(g => g.id === goalId);
    if (index !== -1) {
        publicGoalsMock[index] = { ...publicGoalsMock[index], ...updatedData };
        refreshGoalsView();
    }
};

const addPublicGoal = async (goalData) => {
    // SIMULATION
    const newId = `p${publicGoalsMock.length + 1}`;
    publicGoalsMock.push({
        ...goalData,
        id: newId,
        authorId: getCurrentUser(),
        createdAt: new Date().toISOString(),
        likes: [],
        comments: [],
        visibility: 'public'
    });
    refreshGoalsView(); 
};

const deletePublicGoalFromDb = async (goalId) => {
    // SIMULATION
    publicGoalsMock = publicGoalsMock.filter(g => g.id !== goalId);
    refreshGoalsView();
};

// =================================================================
// 4. GESTION DU THÈME ET DES COULEURS
// =================================================================

const updateThemeButtons = (theme) => {
    document.querySelectorAll('.theme-button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`set-${theme}-theme`).classList.add('active');
}

const setTheme = (theme, save = true) => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
        root.classList.add('dark-mode');
    } else {
        root.classList.remove('dark-mode');
    }
    
    updateThemeButtons(theme);
    if (save) saveUserPreference(STORAGE_KEYS.THEME, theme);
};

const setColor = (colorCode, save = true) => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', colorCode);
    root.style.setProperty('--saved-color', colorCode);
    
    if (save) saveUserPreference(STORAGE_KEYS.COLOR, colorCode);
};

const initializeTheme = () => {
    // Appelle getUserPreference (qui est maintenant défini)
    const theme = getUserPreference(STORAGE_KEYS.THEME, DEFAULT_THEME);
    setTheme(theme, false);
    
    const color = getUserPreference(STORAGE_KEYS.COLOR, DEFAULT_COLOR);
    setColor(color, false);
    
    // Mise à jour de la couleur dans le color picker
    document.getElementById('color-picker').value = color;
};


// =================================================================
// 5. RENDU ET LOGIQUE DE L'INTERFACE
// =================================================================

// Fonction principale pour rafraîchir l'affichage
const refreshGoalsView = () => {
    goalsList.innerHTML = '';
    
    let goalsToDisplay = [];
    
    if (currentView === 'public') {
        goalsToDisplay = publicGoalsMock;
    } else {
        goalsToDisplay = getPrivateGoals();
    }
    
    if (goalsToDisplay.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        goalsToDisplay.forEach(goal => {
            if (goal.visibility === currentView) {
                goalsList.appendChild(renderGoal(goal));
            }
        });
    }
    
    // Mise à jour des boutons de navigation
    document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`view-${currentView}`).classList.add('active');
};

const renderGoal = (goal) => {
    const isPrivate = goal.visibility === 'private';
    const currentUserId = getCurrentUser();
    const isAuthor = goal.authorId === currentUserId;
    const hasLiked = goal.likes && goal.likes.includes(currentUserId);

    const card = document.createElement('div');
    card.className = 'goal-card';
    card.dataset.id = goal.id;
    card.dataset.visibility = goal.visibility;
    
    const likeIcon = hasLiked ? '❤️' : '<i class="far fa-heart"></i>'; 
    const commentIcon = '<i class="far fa-comment"></i>';

    let actionButtons = '';
    if (isPrivate || isAuthor) {
        actionButtons += `<button class="action-button" onclick="openGoalModal('${goal.id}', '${goal.visibility}')"><i class="fas fa-edit"></i> Modifier</button>`;
        actionButtons += `<button class="action-button delete-button" onclick="handleDeleteGoal('${goal.id}', '${goal.visibility}')"><i class="fas fa-trash-alt"></i> Supprimer</button>`;
    }

    actionButtons += `<button class="action-button" onclick="toggleLike('${goal.id}', '${goal.visibility}')">${likeIcon} ${goal.likes ? goal.likes.length : 0}</button>`;

    if (isPrivate || (goal.visibility === 'public' && goal.allowComments)) {
        actionButtons += `<button class="action-button" onclick="openCommentsModal('${goal.id}', '${goal.visibility}')">${commentIcon} ${goal.comments ? goal.comments.length : 0}</button>`;
    }


    card.innerHTML = `
        <div class="goal-header">
            <h3 class="goal-title">${goal.title}</h3>
            <span class="goal-meta">${isPrivate ? '<i class="fas fa-lock"></i> Privé' : '<i class="fas fa-globe"></i> Public'} - ${goal.type}</span>
        </div>
        <p>${goal.description}</p>
        <div class="goal-meta">Par: ${goal.displayName || 'Anonyme'}</div>
        
        <h4>Progression: ${goal.progress}%</h4>
        <div class="progress-bar-container">
            <div class="progress-bar" style="width: 0%;" data-progress="${goal.progress}"></div>
        </div>
        
        <div class="goal-actions">${actionButtons}</div>
    `;
    
    setTimeout(() => {
        const progressBar = card.querySelector('.progress-bar');
        progressBar.style.width = `${goal.progress}%`;
    }, 10);

    return card;
};

// =================================================================
// 6. GESTION DES INTERACTIONS (LIKE/COMMENT)
// =================================================================

window.toggleLike = (goalId, visibility) => {
    const userId = getCurrentUser();

    if (visibility === 'public') {
        const goal = publicGoalsMock.find(g => g.id === goalId);
        if (!goal) return;

        const hasLiked = goal.likes.includes(userId);
        
        if (hasLiked) {
            goal.likes = goal.likes.filter(id => id !== userId);
        } else {
            goal.likes.push(userId);
        }
        
        updatePublicGoalInDb(goalId, { likes: goal.likes });

    } else { // Privé (Local Storage)
        let privateGoals = getPrivateGoals();
        const goalIndex = privateGoals.findIndex(g => g.id === goalId);
        if (goalIndex === -1) return;

        const hasLiked = privateGoals[goalIndex].likes.includes(userId);

        if (hasLiked) {
            privateGoals[goalIndex].likes = privateGoals[goalIndex].likes.filter(id => id !== userId);
        } else {
            privateGoals[goalIndex].likes.push(userId);
        }
        
        savePrivateGoals(privateGoals);
        refreshGoalsView();
    }
};

const addComment = (goalId, visibility, commentText) => {
    const userId = getCurrentUser();
    const displayName = 'Demo User';

    const newComment = {
        text: commentText,
        authorId: userId,
        displayName: displayName,
        createdAt: new Date().toISOString()
    };

    if (visibility === 'public') {
        const goal = publicGoalsMock.find(g => g.id === goalId);
        if (!goal || !goal.allowComments) return;
        
        goal.comments.push(newComment);
        updatePublicGoalInDb(goalId, { comments: goal.comments });

    } else { // Privé (Local Storage)
        let privateGoals = getPrivateGoals();
        const goalIndex = privateGoals.findIndex(g => g.id === goalId);
        if (goalIndex === -1) return;

        privateGoals[goalIndex].comments.push(newComment);
        savePrivateGoals(privateGoals);
    }
    
    refreshGoalsView(); 
};


// =================================================================
// 7. LOGIQUE MODALES ET FORMULAIRES
// =================================================================

// Ouverture/Fermeture des modales avec animation
const openModal = (modalElement, title = null) => {
    if (title && modalElement.id === 'goal-modal') {
        modalTitle.textContent = title;
    }
    modalElement.classList.add('visible');
};

const closeModal = (modalElement) => {
    modalElement.classList.remove('visible');
    if (modalElement.id === 'goal-modal') {
        goalForm.reset();
        progressValueSpan.textContent = '0%';
        publicOptions.style.display = 'block';
    }
};

window.openGoalModal = (goalId = null, visibility = null) => {
    let goal = null;
    if (goalId) {
        const goalList = visibility === 'public' ? publicGoalsMock : getPrivateGoals();
        goal = goalList.find(g => g.id === goalId);
        openModal(goalModal, 'Modifier l\'Objectif');
    } else {
        openModal(goalModal, 'Créer un Nouvel Objectif');
    }

    if (goal) {
        document.getElementById('goal-id').value = goal.id;
        document.getElementById('title').value = goal.title;
        document.getElementById('description').value = goal.description;
        document.getElementById('type').value = goal.type;
        progressRange.value = goal.progress;
        progressValueSpan.textContent = `${goal.progress}%`;
        
        if (goal.visibility === 'public') {
            document.getElementById('public-radio').checked = true;
            document.getElementById('display-name').value = goal.displayName || '';
            document.getElementById('allow-comments').checked = goal.allowComments;
            publicOptions.style.display = 'block';
        } else {
            document.getElementById('private-radio').checked = true;
            publicOptions.style.display = 'none';
        }

    } else {
        document.getElementById('goal-id').value = '';
        document.getElementById('public-radio').checked = true;
        publicOptions.style.display = 'block';
    }
};

window.openCommentsModal = (goalId, visibility) => {
    currentGoalIdToComment = goalId;
    currentGoalVisibilityToComment = visibility;
    
    const goalList = visibility === 'public' ? publicGoalsMock : getPrivateGoals();
    const goal = goalList.find(g => g.id === goalId);
    if (!goal) return;

    document.getElementById('comments-title').innerHTML = `<i class="fas fa-comments"></i> Commentaires pour : ${goal.title}`;
    
    const commentsListDiv = document.getElementById('comments-list');
    commentsListDiv.innerHTML = '';
    
    if (goal.comments && goal.comments.length > 0) {
        goal.comments.forEach(c => {
            const commentDate = new Date(c.createdAt).toLocaleDateString();
            commentsListDiv.innerHTML += `<div class="comment-item"><strong>${c.displayName || 'Anonyme'}</strong> <span>${commentDate}</span><p>${c.text}</p></div>`;
        });
    } else {
        commentsListDiv.innerHTML = '<p class="empty-state-message">Soyez le premier à commenter !</p>';
    }

    openModal(commentsModal);
};

window.handleDeleteGoal = (id, visibility) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet objectif ?')) return;

    if (visibility === 'public') {
        deletePublicGoalFromDb(id);
    } else {
        let privateGoals = getPrivateGoals();
        privateGoals = privateGoals.filter(g => g.id !== id);
        savePrivateGoals(privateGoals);
        refreshGoalsView();
    }
};


// Soumission du formulaire (Ajout/Modification)
goalForm.onsubmit = (e) => {
    e.preventDefault();
    
    const formData = new FormData(goalForm);
    const id = formData.get('goal-id');
    const visibility = formData.get('visibility');
    
    const goalData = {
        title: formData.get('title'),
        description: formData.get('description'),
        type: formData.get('type'),
        progress: parseInt(formData.get('progress')),
        displayName: formData.get('display-name') || 'Anonyme',
        allowComments: document.getElementById('allow-comments').checked,
    };
    
    if (id) {
        if (visibility === 'public') {
            updatePublicGoalInDb(id, goalData);
        } else {
            let privateGoals = getPrivateGoals();
            const index = privateGoals.findIndex(g => g.id === id);
            if (index !== -1) {
                privateGoals[index] = { ...privateGoals[index], ...goalData };
                savePrivateGoals(privateGoals);
            }
        }
    } else {
        if (visibility === 'public') {
            addPublicGoal(goalData);
        } else {
            const newGoal = {
                id: Date.now().toString(),
                ...goalData,
                visibility: 'private',
                authorId: getCurrentUser(),
                likes: [],
                comments: []
            };
            const privateGoals = getPrivateGoals();
            privateGoals.push(newGoal);
            savePrivateGoals(privateGoals);
        }
    }

    closeModal(goalModal);
    refreshGoalsView();
};


// =================================================================
// 8. ÉVÉNEMENTS GLOBALS & INITIALISATION
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialiser le thème (Appelle getUserPreference)
    initializeTheme();
    
    // 2. Écouteurs de la vue (Public/Privé)
    document.getElementById('view-public').addEventListener('click', () => {
        currentView = 'public';
        refreshGoalsView();
    });
    document.getElementById('view-private').addEventListener('click', () => {
        currentView = 'private';
        refreshGoalsView();
    });
    
    // 3. Boutons d'ouverture/fermeture des modales
    document.getElementById('add-goal-button').addEventListener('click', () => openGoalModal());
    document.getElementById('open-settings').addEventListener('click', () => openModal(settingsModal));
    
    document.querySelectorAll('.close-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = e.currentTarget.closest('.modal').id;
            closeModal(document.getElementById(modalId));
        });
    });

    // 4. Écouteurs de la modale d'objectif
    document.getElementById('public-radio').addEventListener('change', () => publicOptions.style.display = 'block');
    document.getElementById('private-radio').addEventListener('change', () => publicOptions.style.display = 'none');
    progressRange.addEventListener('input', (e) => progressValueSpan.textContent = `${e.target.value}%`);
    
    // 5. Écouteurs de la modale de paramètres
    document.getElementById('set-light-theme').addEventListener('click', () => setTheme('light'));
    document.getElementById('set-dark-theme').addEventListener('click', () => setTheme('dark'));
    document.getElementById('color-picker').addEventListener('input', (e) => setColor(e.target.value));

    // 6. Écouteur de la modale de commentaires
    document.getElementById('submit-comment').addEventListener('click', () => {
        const text = document.getElementById('new-comment-text').value.trim();
        if (text && currentGoalIdToComment && currentGoalVisibilityToComment) {
            addComment(currentGoalIdToComment, currentGoalVisibilityToComment, text);
            closeModal(commentsModal);
        }
    });
    document.getElementById('new-comment-text').addEventListener('input', (e) => {
        document.getElementById('submit-comment').disabled = e.target.value.trim() === '';
    });
    
    // 7. Premier affichage
    refreshGoalsView();
});
});
