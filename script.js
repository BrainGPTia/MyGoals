// =================================================================
// 0. INITIALISATION FIREBASE & CONFIGURATION
// =================================================================

// ⚠️ REMPLACEZ CES CLÉS PAR VOS PROPRES CLÉS DE CONFIGURATION FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyC1Fs9gu6E1ROpoX8A-codMgaAfxzW0x7o",
  authDomain: "mygoals-e3cbb.firebaseapp.com",
  projectId: "mygoals-e3cbb",
  storageBucket: "mygoals-e3cbb.firebasestorage.app",
  messagingSenderId: "314414000182",
  appId: "1:314414000182:web:d89491086bb56fdc771097",
  measurementId: "G-FLTJQ3Z259"
};

// Initialisation de Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// État de l'application
let goals = []; // Les objectifs chargés pour l'affichage
let myLikes = []; // Les IDs des objectifs aimés par l'utilisateur actuel
let myComments = []; // Les commentaires faits par l'utilisateur actuel
let currentGoalId = null;
let currentUser = null; // UID de l'utilisateur Firebase
let currentUserName = 'Anonyme'; // Nom ou pseudo (utilisé pour les commentaires/likes)

// Références DOM
const publicGoalsContainer = document.getElementById('publicGoals');
const privateGoalsContainer = document.getElementById('privateGoals');
const commentsSectionContainer = document.getElementById('myComments');
const likesSectionContainer = document.getElementById('myLikes');


// =================================================================
// 1. GESTION DE L'AUTHENTIFICATION ET DU DÉMARRAGE
// =================================================================

// Listener d'état d'authentification Firebase
auth.onAuthStateChanged(user => {
    if (user) {
        // Utilisateur connecté
        currentUser = user.uid;
        currentUserName = user.displayName || 'Utilisateur ' + user.uid.substring(0, 4);
        console.log(`Utilisateur connecté: ${currentUserName} (${currentUser})`);
    } else {
        // Utilisateur déconnecté - Simuler une connexion anonyme ou créer un compte.
        // Pour ce tracker, nous allons simuler un utilisateur anonyme si aucun n'est logué.
        // NOTE: Une implémentation réelle nécessiterait un écran de login.
        console.log("Aucun utilisateur détecté. Tentative de connexion anonyme...");
        auth.signInAnonymously().catch(error => {
            console.error("Erreur de connexion anonyme:", error);
        });
    }
    
    // Une fois que nous avons un UID, nous pouvons charger les données
    loadData();
    setupEventListeners();
    renderGoals();
});

// Charger les données au démarrage (déjà dans onAuthStateChanged)
// window.addEventListener('DOMContentLoaded', () => { loadData(); setupEventListeners(); renderGoals(); });


// =================================================================
// 2. ÉCOUTEURS D'ÉVÉNEMENTS & UX
// =================================================================

function setupEventListeners() {
    // ... (Votre code pour la navigation, les modales, les sliders, les couleurs...)
    
    // Navigation principale (public/privé)
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.secondary-btn').forEach(b => b.classList.remove('active')); // Désactiver la nav secondaire
            btn.classList.add('active');
            showSection(btn.dataset.section);
        });
    });

    // Navigation secondaire (commentaires/likes)
    document.querySelectorAll('.secondary-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.secondary-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
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
            // La visibilité est maintenant contrôlée par le CSS via une classe si vous utilisez le style précédent
            publicOptions.style.display = e.target.value === 'public' ? 'block' : 'none'; 
        });
    });

    // Nom affiché
    document.getElementById('displayName').addEventListener('change', (e) => {
        const pseudoInput = document.getElementById('pseudoInput');
        const realNameInput = document.getElementById('realNameInput');
        pseudoInput.style.display = 'none';
        realNameInput.style.display = 'none';
        if (e.target.value === 'pseudo') {
            pseudoInput.style.display = 'block';
        } else if (e.target.value === 'real') {
            realNameInput.style.display = 'block';
            realNameInput.value = currentUserName === 'Anonyme' ? '' : currentUserName;
        }
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


// =================================================================
// 3. LOGIQUE FIREBASE (CRUD)
// =================================================================

/**
 * Charge les objectifs (publics et privés de l'utilisateur), les likes et les commentaires.
 */
async function loadData() {
    if (!currentUser) return;

    try {
        // 1. Récupérer les objectifs (publics et privés de l'utilisateur)
        const snapshot = await db.collection('goals')
            .where('authorId', 'in', ['public', currentUser]) // Simplement un filtre pour l'instant
            .get();

        goals = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
        }));
        
        // 2. Récupérer les likes de l'utilisateur (stockés dans un sous-collection ou collection séparée)
        // Ici, nous allons simuler en stockant une liste des IDs des objectifs aimés par cet utilisateur
        const likesSnapshot = await db.collection('users').doc(currentUser).collection('likes').get();
        myLikes = likesSnapshot.docs.map(doc => doc.id); // doc.id est l'ID de l'objectif aimé

        // 3. Récupérer les commentaires de l'utilisateur (pour l'affichage secondaire)
        const commentsSnapshot = await db.collection('comments').where('authorId', '==', currentUser).get();
        myComments = commentsSnapshot.docs.map(doc => ({ 
            id: doc.id,
            ...doc.data()
        }));

        // Charger les préférences locales (thème/couleur)
        const localSettings = localStorage.getItem('goalsTrackerSettings');
        if (localSettings) {
            const settings = JSON.parse(localSettings);
            if (settings.theme) {
                document.body.className = settings.theme;
                document.getElementById('themeSelect').value = settings.theme;
            }
            if (settings.primaryColor) {
                document.documentElement.style.setProperty('--primary', settings.primaryColor);
            }
        }

    } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
    }
}

/**
 * Enregistre un nouvel objectif ou modifie un objectif existant.
 */
async function saveGoal(e) {
    e.preventDefault();
    if (!currentUser) return;

    const title = document.getElementById('goalTitle').value;
    const description = document.getElementById('goalDescription').value;
    const type = document.getElementById('goalType').value;
    const progress = parseInt(document.getElementById('goalProgress').value);
    const visibility = document.querySelector('input[name="visibility"]:checked').value;
    const displayNameType = document.getElementById('displayName').value;
    const allowComments = document.getElementById('allowComments').checked;

    let authorName = 'Anonyme';
    if (visibility === 'public') {
        if (displayNameType === 'pseudo') {
            authorName = document.getElementById('pseudoInput').value || 'Anonyme';
        } else if (displayNameType === 'real') {
            authorName = document.getElementById('realNameInput').value || currentUserName;
        } else if (displayNameType === 'anonymous') {
            authorName = 'Anonyme';
        }
    }
    
    const goalData = {
        title,
        description,
        type,
        progress,
        visibility,
        displayNameType,
        authorName,
        allowComments,
        authorId: currentUser, // Clé de l'utilisateur
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (currentGoalId) {
            // Mise à jour (Update)
            await db.collection('goals').doc(currentGoalId).update(goalData);
        } else {
            // Création (Create)
            goalData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            goalData.likesCount = 0; // Initialisation du compteur
            await db.collection('goals').add(goalData);
        }
    } catch (error) {
        console.error("Erreur lors de l'enregistrement de l'objectif:", error);
    }
    
    closeModals();
    await loadData(); // Recharger toutes les données après la modification
    renderGoals();
}

/**
 * Supprime un objectif.
 */
async function deleteGoal(id) {
    if (!currentUser) return;

    if (confirm('Êtes-vous sûr de vouloir supprimer cet objectif ?')) {
        try {
            await db.collection('goals').doc(id).delete();
            // Retirer le like si l'objectif était aimé
            if (myLikes.includes(id)) {
                await db.collection('users').doc(currentUser).collection('likes').doc(id).delete();
            }
        } catch (error) {
            console.error("Erreur lors de la suppression de l'objectif:", error);
        }

        await loadData();
        renderGoals();
    }
}

/**
 * Ajoute/retire un like à un objectif.
 */
async function toggleLike(id) {
    if (!currentUser) return;
    
    const goalRef = db.collection('goals').doc(id);
    const likeRef = db.collection('users').doc(currentUser).collection('likes').doc(id);
    
    try {
        if (myLikes.includes(id)) {
            // Retirer le like (transaction pour le compteur)
            await db.runTransaction(async (transaction) => {
                const goalDoc = await transaction.get(goalRef);
                if (goalDoc.exists) {
                    const newLikes = goalDoc.data().likesCount - 1;
                    transaction.update(goalRef, { likesCount: newLikes >= 0 ? newLikes : 0 });
                }
                transaction.delete(likeRef);
            });
        } else {
            // Ajouter le like (transaction pour le compteur)
            await db.runTransaction(async (transaction) => {
                const goalDoc = await transaction.get(goalRef);
                if (goalDoc.exists) {
                    const newLikes = (goalDoc.data().likesCount || 0) + 1;
                    transaction.update(goalRef, { likesCount: newLikes });
                }
                transaction.set(likeRef, { likedAt: firebase.firestore.FieldValue.serverTimestamp() }); // Ajouter l'ID de l'objectif comme doc
            });
        }
    } catch (error) {
        console.error("Erreur lors du toggle like:", error);
    }

    await loadData();
    renderGoals();
}

/**
 * Ajoute un commentaire à un objectif public.
 */
async function addComment(goalId, text) {
    if (!currentUser || !text.trim()) return;

    const goal = goals.find(g => g.id === goalId);
    if (!goal || !goal.allowComments) return;
    
    const commentData = {
        goalId,
        authorId: currentUser,
        authorName: currentUserName,
        text: text.trim(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        await db.collection('comments').add(commentData);
    } catch (error) {
        console.error("Erreur lors de l'ajout du commentaire:", error);
    }

    await loadData();
    renderGoals();
}


// =================================================================
// 4. LOGIQUE D'AFFICHAGE (Mise à jour pour Firebase)
// =================================================================

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
        
        const publicOptions = document.getElementById('publicOptions');
        if (goal.visibility === 'public') {
            publicOptions.style.display = 'block';
            document.getElementById('displayName').value = goal.displayNameType;
            document.getElementById('allowComments').checked = goal.allowComments;
            
            const pseudoInput = document.getElementById('pseudoInput');
            const realNameInput = document.getElementById('realNameInput');
            pseudoInput.style.display = 'none';
            realNameInput.style.display = 'none';

            if (goal.displayNameType === 'pseudo' && goal.authorName) {
                pseudoInput.style.display = 'block';
                pseudoInput.value = goal.authorName;
            } else if (goal.displayNameType === 'real' && goal.authorName) {
                realNameInput.style.display = 'block';
                realNameInput.value = goal.authorName;
            }
        } else {
             publicOptions.style.display = 'none';
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

// ... (Les fonctions showSection et renderGoals restent les mêmes)

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
    const activeSection = document.querySelector('.goals-section.active').id;
    
    if (activeSection === 'publicSection') renderPublicGoals();
    else if (activeSection === 'privateSection') renderPrivateGoals();
    else if (activeSection === 'commentsSection') renderMyComments();
    else if (activeSection === 'likesSection') renderMyLikes();
}

function renderPublicGoals() {
    const container = document.getElementById('publicGoals');
    // Filtrer les objectifs publics *non* créés par l'utilisateur actuel pour un affichage "communauté"
    const publicGoals = goals.filter(g => g.visibility === 'public' && g.authorId !== currentUser);
    
    if (publicGoals.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>Aucun objectif public de la communauté pour le moment</p></div>';
        return;
    }
    
    container.innerHTML = publicGoals.map(goal => createGoalCard(goal, true)).join('');
    attachGoalEventListeners();
}

function renderPrivateGoals() {
    const container = document.getElementById('privateGoals');
    // Objectifs privés + Objectifs publics créés par l'utilisateur actuel
    const privateGoals = goals.filter(g => g.authorId === currentUser);
    
    if (privateGoals.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>Aucun objectif personnel pour le moment</p></div>';
        return;
    }
    
    // Afficher tous les objectifs de l'utilisateur (privés et publics qu'il peut éditer)
    container.innerHTML = privateGoals.map(goal => createGoalCard(goal, false)).join('');
    attachGoalEventListeners();
}

function renderMyComments() {
    const container = document.getElementById('myComments');
    // Trouver les IDs des objectifs commentés par l'utilisateur
    const commentedGoalIds = [...new Set(myComments.map(c => c.goalId))];
    const commentedGoals = goals.filter(g => commentedGoalIds.includes(g.id));
    
    if (commentedGoals.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💬</div><p>Vous n\'avez pas encore commenté</p></div>';
        return;
    }
    
    container.innerHTML = commentedGoals.map(goal => createGoalCard(goal, true)).join('');
    attachGoalEventListeners();
}

function renderMyLikes() {
    const container = document.getElementById('myLikes');
    // Les objectifs aimés sont ceux dont l'ID est dans la liste myLikes chargée depuis Firebase
    const likedGoals = goals.filter(g => myLikes.includes(g.id));
    
    if (likedGoals.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❤️</div><p>Vous n\'avez pas encore aimé d\'objectifs</p></div>';
        return;
    }
    
    container.innerHTML = likedGoals.map(goal => createGoalCard(goal, true)).join('');
    attachGoalEventListeners();
}

function createGoalCard(goal, isPublicView) {
    const typeLabels = { day: '📅 Jour', week: '📆 Semaine', month: '🗓️ Mois', year: '📊 Année' };
    const isLiked = myLikes.includes(goal.id);
    const isOwner = goal.authorId === currentUser;
    
    return `
        <div class="goal-card" data-goal-id="${goal.id}">
            <div class="goal-header">
                <div>
                    <div class="goal-title">${goal.title}</div>
                    ${isPublicView ? `<small style="color: var(--text-light);">Par ${goal.authorName || 'Anonyme'}</small>` : ''}
                </div>
                <span class="goal-type">${typeLabels[goal.type]}</span>
            </div>
            ${goal.description ? `<div class="goal-description">${goal.description}</div>` : ''}
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
                ${isOwner ? `
                    <button class="btn btn-primary" onclick="openModal('${goal.id}')">✏️ Modifier</button>
                    <button class="btn btn-danger" onclick="deleteGoal('${goal.id}')">🗑️ Supprimer</button>
                ` : ''}
                ${isPublicView ? `
                    <button class="btn btn-like ${isLiked ? 'liked' : ''}" onclick="toggleLike('${goal.id}')">
                        ${isLiked ? '❤️' : '🤍'} ${goal.likesCount || 0}
                    </button>
                ` : ''}
            </div>
            ${isPublicView && goal.allowComments ? `
                <div class="comments-section">
                    <h4>💬 Commentaires (${goal.commentsCount || 0})</h4>
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
    const input = document.querySelector(`.goal-card[data-goal-id="${goalId}"] .comment-input`);
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

function saveSettings() {
    const data = {
        theme: document.body.className,
        primaryColor: getComputedStyle(document.documentElement).getPropertyValue('--primary')
    };
    localStorage.setItem('goalsTrackerSettings', JSON.stringify(data));
}

// La fonction loadData gère maintenant à la fois Firebase et les paramètres locaux (saveData n'est plus utilisé pour goals)
// function saveData() { ... } // Supprimé car les objectifs sont gérés par Firebase

// function loadData() { ... } // Fusionné dans la section 3 (Logique Firebase)

// Les fonctions saveSettings et loadData sont conservées pour les préférences UI/UX (thème, couleur)
function saveSettings() {
    const data = {
        theme: document.body.className,
        primaryColor: getComputedStyle(document.documentElement).getPropertyValue('--primary')
    };
    localStorage.setItem('goalsTrackerSettings', JSON.stringify(data));
}
