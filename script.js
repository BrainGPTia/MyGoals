// ==========================================================
// 🚀 1. FIREBASE CONFIGURATION & INITIALISATION
// ==========================================================
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Vos configurations Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC1Fs9gu6E1ROpoX8A-codMgaAfxzW0x7o",
    authDomain: "mygoals-e3cbb.firebaseapp.com",
    projectId: "mygoals-e3cbb",
    storageBucket: "mygoals-e3cbb.firebasestorage.app",
    messagingSenderId: "314414000182",
    appId: "1:314414000182:web:d89491086bb56fdc771097",
    measurementId: "G-FLTJQ3Z259"
};

// Initialisation des services
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Exportation des services pour une utilisation future si nécessaire (non utilisé directement dans ce fichier)
// export { app, analytics, auth, db };

// ==========================================================
// 🎯 2. ÉTATS DE L'APPLICATION
// Les variables d'état locales sont maintenues, mais le currentUser sera mis à jour par Auth.
// ==========================================================
let goals = [];
let myLikes = [];
let myComments = [];
let currentGoalId = null;
let currentUser = null; // Maintenant un objet utilisateur Firebase (ou null)
let currentUserName = 'Anonyme'; // Nom affiché de l'utilisateur
let provider = new GoogleAuthProvider(); // Exemple de fournisseur d'authentification

// ==========================================================
// 🛠️ 3. FONCTIONS D'AUTHENTIFICATION
// ==========================================================

function handleSignIn() {
    signInWithPopup(auth, provider)
        .then((result) => {
            // L'utilisateur est connecté. onAuthStateChanged s'en charge.
            console.log("Utilisateur connecté via Google:", result.user);
        }).catch((error) => {
            console.error("Erreur de connexion:", error.message);
        });
}

function handleSignOut() {
    signOut(auth).then(() => {
        // Déconnexion réussie. onAuthStateChanged s'en charge.
        console.log("Utilisateur déconnecté.");
        alert("Vous êtes déconnecté.");
    }).catch((error) => {
        console.error("Erreur de déconnexion:", error.message);
    });
}

// ==========================================================
// 🔄 4. GESTION DE L'ÉTAT D'AUTHENTIFICATION
// ==========================================================

onAuthStateChanged(auth, (user) => {
    if (user) {
        // L'utilisateur est connecté
        currentUser = user;
        currentUserName = user.displayName || user.email || 'Utilisateur Authentifié';
        document.getElementById('signInBtn').style.display = 'none';
        document.getElementById('signOutBtn').style.display = 'block';
        console.log(`Bienvenue, ${currentUserName} (${currentUser.uid})`);
        
        // TODO: FIRESTORE - Charger les objectifs de l'utilisateur connecté
        loadData(); 
    } else {
        // L'utilisateur est déconnecté
        currentUser = null;
        currentUserName = 'Anonyme';
        document.getElementById('signInBtn').style.display = 'block';
        document.getElementById('signOutBtn').style.display = 'none';
        
        // TODO: FIRESTORE - Afficher uniquement les objectifs publics ou vider l'état
        goals = [];
        myLikes = [];
        myComments = [];
        loadData(); // Charge les paramètres locaux (thème) et vide les données locales
    }
    renderGoals();
});


// ==========================================================
// 🚀 5. ADAPTATION DU CODE EXISTANT
// ==========================================================

// Charger les données au démarrage
window.addEventListener('DOMContentLoaded', () => {
    // Initialiser Firebase Analytics si disponible
    // L'initialisation est désormais gérée en haut du fichier avec les imports.
    // L'objet analytics est déjà disponible.
    
    // Le chargement des données et le rendu se fait après l'écoute de onAuthStateChanged
    // pour s'assurer que l'état de l'utilisateur est connu.
    setupEventListeners();
    // Le premier loadData est maintenant appelé dans onAuthStateChanged
});

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // ... (votre code setupEventListeners existant)

    // BOUTONS D'AUTHENTIFICATION AJOUTÉS (assurez-vous d'avoir ces IDs dans votre HTML)
    const signInBtn = document.getElementById('signInBtn');
    if (signInBtn) signInBtn.addEventListener('click', handleSignIn);
    
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) signOutBtn.addEventListener('click', handleSignOut);
    
    // ... (votre code setupEventListeners existant pour la navigation, modale, etc.)
    
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
    document.getElementById('addGoalBtn').addEventListener('click', () => {
        if (!currentUser) {
            alert("Veuillez vous connecter pour créer un objectif.");
            return;
        }
        openModal();
    });

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
        
        // Pré-remplir le champ "Nom réel" avec le nom authentifié
        if (e.target.value === 'real' && currentUser) {
            document.getElementById('realNameInput').value = currentUser.displayName || currentUser.email;
        } else if (e.target.value === 'real') {
            document.getElementById('realNameInput').value = '';
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

function openModal(goalId = null) {
    if (!currentUser && !goalId) {
         alert("Veuillez vous connecter pour créer un objectif.");
         return;
    }
    // ... (Le reste de la fonction openModal est inchangé)
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
    
    // L'utilisateur doit être connecté pour sauvegarder (sauf si modification d'objectif public)
    if (!currentUser && !currentGoalId) {
        alert("Action impossible. Veuillez vous connecter.");
        return;
    }

    const title = document.getElementById('goalTitle').value;
    const description = document.getElementById('goalDescription').value;
    const type = document.getElementById('goalType').value;
    const progress = parseInt(document.getElementById('goalProgress').value);
    const visibility = document.querySelector('input[name="visibility"]:checked').value;
    const displayName = document.getElementById('displayName').value;
    const allowComments = document.getElementById('allowComments').checked;
    
    let authorName = 'Anonyme';
    let authorId = currentUser ? currentUser.uid : 'anonymous'; // ID de l'auteur
    
    if (visibility === 'public') {
        if (displayName === 'pseudo') {
            authorName = document.getElementById('pseudoInput').value || 'Anonyme';
        } else if (displayName === 'real') {
            // Utiliser le nom authentifié si disponible
            authorName = document.getElementById('realNameInput').value || currentUserName;
        }
    } else {
        // Pour les objectifs privés, l'auteur est toujours le nom authentifié
        authorName = currentUserName;
    }
    
    const goal = {
        id: currentGoalId || Date.now().toString(),
        userId: authorId, // L'ID utilisateur est maintenant stocké avec l'objectif
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
    
    // TODO: FIRESTORE - Au lieu de stocker localement, utiliser Firestore:
    // 1. Ajouter ou mettre à jour le document dans la collection 'goals' (avec l'userId comme champ).
    
    saveData();
    renderGoals();
    closeModals();
}

function deleteGoal(id) {
    if (!currentUser) {
        alert("Veuillez vous connecter pour gérer vos objectifs.");
        return;
    }
    
    // TODO: FIRESTORE - Vérifiez la propriété userId avant de supprimer
    if (confirm('Êtes-vous sûr de vouloir supprimer cet objectif ?')) {
        goals = goals.filter(g => g.id !== id);
        myLikes = myLikes.filter(l => l !== id);
        myComments = myComments.filter(c => c.goalId !== id);
        
        // TODO: FIRESTORE - Supprimer le document de Firestore.
        
        saveData();
        renderGoals();
    }
}

function toggleLike(id) {
    if (!currentUser) {
        alert("Veuillez vous connecter pour aimer un objectif.");
        return;
    }
    
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
    
    // TODO: FIRESTORE - Mettre à jour le champ 'likes' du document Firestore.
    // TODO: FIRESTORE - Enregistrer l'ID de l'objectif dans une sous-collection 'userLikes' de l'utilisateur.
    
    saveData();
    renderGoals();
}

function addComment(goalId, text) {
    if (!currentUser) {
        alert("Veuillez vous connecter pour commenter un objectif.");
        return;
    }
    
    const goal = goals.find(g => g.id === goalId);
    if (!goal || !goal.allowComments) return;
    
    const comment = {
        id: Date.now().toString(),
        goalId,
        author: currentUserName, // Utilise le nom d'utilisateur connecté
        authorId: currentUser.uid, // ID de l'auteur du commentaire
        text,
        createdAt: Date.now()
    };
    
    goal.comments.push(comment);
    myComments.push(comment);
    // Analytics: suivi commentaire
    if (analytics) {
        analytics.logEvent('comment_goal', { goalId });
    }
    
    // TODO: FIRESTORE - Ajouter le commentaire dans une sous-collection 'comments' du document goal.
    
    saveData();
    renderGoals();
}

// ... (Le reste des fonctions d'affichage et utilitaires reste inchangé) ...

function saveData() {
    // TODO: FIRESTORE - Cette fonction devrait idéalement être remplacée par l'écriture dans Firestore.
    // On conserve le stockage des paramètres de thème en local.
    const data = {
        // goals, myLikes, myComments NE DOIVENT PLUS ÊTRE ICI si on utilise Firestore
        theme: document.body.className,
        primaryColor: getComputedStyle(document.documentElement).getPropertyValue('--primary')
    };
    // On garde une version locale pour les données utilisateur tant que Firestore n'est pas implémenté
    if (currentUser) {
        data.goals = goals;
        data.myLikes = myLikes;
        data.myComments = myComments;
    }
    localStorage.setItem('goalsTrackerData', JSON.stringify(data));
}

function loadData() {
    const saved = localStorage.getItem('goalsTrackerData');
    if (saved) {
        const data = JSON.parse(saved);
        
        // TODO: FIRESTORE - Charger les objectifs (goals) de Firestore au lieu de localStorage
        if (currentUser && data.goals) goals = data.goals; 
        else goals = [];
        
        // TODO: FIRESTORE - Charger les likes et commentaires de Firestore
        if (currentUser && data.myLikes) myLikes = data.myLikes;
        else myLikes = [];
        if (currentUser && data.myComments) myComments = data.myComments;
        else myComments = [];
        
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

// ... (FIN DU CODE)
