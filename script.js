// ==========================================================
// 🚀 1. FIREBASE CONFIGURATION & INITIALISATION (COMPAT MODE)
// ==========================================================

// ⚠️ AUCUN import (sinon GitHub Pages casse tout)

const firebaseConfig = {
    apiKey: "AIzaSyC1Fs9gu6E1ROpoX8A-codMgaAfxzW0x7o",
    authDomain: "mygoals-e3cbb.firebaseapp.com",
    projectId: "mygoals-e3cbb",
    storageBucket: "mygoals-e3cbb.firebasestorage.app",
    messagingSenderId: "314414000182",
    appId: "1:314414000182:web:d89491086bb56fdc771097",
    measurementId: "G-FLTJQ3Z259"
};

firebase.initializeApp(firebaseConfig);
const analytics = firebase.analytics();
const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

// ==========================================================
// 🎯 2. ÉTAT
// ==========================================================
let goals = [];
let myLikes = [];
let myComments = [];
let currentGoalId = null;
let currentUser = null;
let currentUserName = 'Anonyme';

// ==========================================================
// 🔐 3. AUTH
// ==========================================================
function handleSignIn() {
    auth.signInWithPopup(provider).catch(console.error);
}

function handleSignOut() {
    auth.signOut();
}

// ==========================================================
// 🔄 4. AUTH STATE
// ==========================================================
auth.onAuthStateChanged(user => {
    currentUser = user;
    currentUserName = user ? (user.displayName || user.email) : 'Anonyme';

    const inBtn = document.getElementById('signInBtn');
    const outBtn = document.getElementById('signOutBtn');
    if (inBtn) inBtn.style.display = user ? 'none' : 'block';
    if (outBtn) outBtn.style.display = user ? 'block' : 'none';

    loadData();
    renderGoals();
});

// ==========================================================
// 🧠 5. DOM READY
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadData();
    renderGoals();
});

// ==========================================================
// 🛠️ 6. EVENTS (SAFE)
// ==========================================================
function setupEventListeners() {

    const safe = (id, fn) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', fn);
    };

    safe('signInBtn', handleSignIn);
    safe('signOutBtn', handleSignOut);

    document.querySelectorAll('.nav-btn').forEach(b =>
        b.addEventListener('click', () => showSection(b.dataset.section))
    );

    document.querySelectorAll('.secondary-btn').forEach(b =>
        b.addEventListener('click', () => showSection(b.dataset.section))
    );

    safe('addGoalBtn', () => {
        if (!currentUser) return alert("Connecte-toi");
        openModal();
    });

    document.querySelectorAll('.close').forEach(b =>
        b.addEventListener('click', closeModals)
    );

    safe('cancelBtn', closeModals);

    const form = document.getElementById('goalForm');
    if (form) form.addEventListener('submit', saveGoal);

    const slider = document.getElementById('goalProgress');
    if (slider) slider.addEventListener('input', e =>
        document.getElementById('progressValue').textContent = e.target.value
    );

    document.querySelectorAll('input[name="visibility"]').forEach(r =>
        r.addEventListener('change', e =>
            document.getElementById('publicOptions').style.display =
                e.target.value === 'public' ? 'block' : 'none'
        )
    );

    safe('settingsBtn', () =>
        document.getElementById('settingsModal').classList.add('active')
    );

    safe('closeSettings', closeModals);

    const theme = document.getElementById('themeSelect');
    if (theme) theme.addEventListener('change', e => {
        document.body.className = e.target.value;
        saveData();
    });

    document.querySelectorAll('.color-btn').forEach(btn =>
        btn.addEventListener('click', () => {
            document.documentElement.style.setProperty('--primary', btn.dataset.color);
            saveData();
        })
    );

    window.addEventListener('click', e => {
        if (e.target.classList.contains('modal')) closeModals();
    });
}

// ==========================================================
// 🪟 7. MODALS
// ==========================================================
function openModal() {
    document.getElementById('modal').classList.add('active');
}

function closeModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    currentGoalId = null;
}

// ==========================================================
// 💾 8. GOALS (LOCAL POUR L’INSTANT)
// ==========================================================
function saveGoal(e) {
    e.preventDefault();
    if (!currentUser) return;

    const goal = {
        id: Date.now().toString(),
        title: goalTitle.value,
        description: goalDescription.value,
        progress: +goalProgress.value,
        visibility: document.querySelector('input[name="visibility"]:checked').value,
        authorName: currentUserName,
        likes: 0,
        comments: []
    };

    goals.push(goal);
    analytics.logEvent('add_goal');
    saveData();
    renderGoals();
    closeModals();
}

function renderGoals() {
    const pub = document.getElementById('publicGoals');
    const priv = document.getElementById('privateGoals');
    if (!pub || !priv) return;

    pub.innerHTML = '';
    priv.innerHTML = '';

    goals.forEach(g => {
        const el = document.createElement('div');
        el.className = 'goal-card';
        el.innerHTML = `<h3>${g.title}</h3><p>${g.progress}%</p>`;
        (g.visibility === 'public' ? pub : priv).appendChild(el);
    });
}

// ==========================================================
// 💾 9. STORAGE
// ==========================================================
function saveData() {
    localStorage.setItem('mygoals', JSON.stringify({
        goals,
        theme: document.body.className,
        color: getComputedStyle(document.documentElement).getPropertyValue('--primary')
    }));
}

function loadData() {
    const data = JSON.parse(localStorage.getItem('mygoals'));
    if (!data) return;
    goals = data.goals || [];
    if (data.theme) document.body.className = data.theme;
    if (data.color) document.documentElement.style.setProperty('--primary', data.color);
}

// ==========================================================
// 🧭 UTIL
// ==========================================================
function showSection(name) {
    document.querySelectorAll('.goals-section').forEach(s => s.classList.remove('active'));
    const map = {
        public: 'publicSection',
        private: 'privateSection',
        comments: 'commentsSection',
        likes: 'likesSection'
    };
    const el = document.getElementById(map[name]);
    if (el) el.classList.add('active');
}
