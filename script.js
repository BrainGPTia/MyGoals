// =========================
// FIREBASE INIT
// =========================
const firebaseConfig = {
  apiKey: "AIzaSyC1Fs9gu6E1ROpoX8A-codMgaAfxzW0x7o",
  authDomain: "mygoals-e3cbb.firebaseapp.com",
  projectId: "mygoals-e3cbb",
  storageBucket: "mygoals-e3cbb.appspot.com",
  messagingSenderId: "314414000182",
  appId: "1:314414000182:web:d89491086bb56fdc771097",
  measurementId: "G-FLTJQ3Z259"
};

firebase.initializeApp(firebaseConfig);
const analytics = firebase.analytics();
const db = firebase.firestore();

// =========================
// APP STATE
// =========================
let goals = []; // Objectives local + remote
let publicGoals = [];

// =========================
// DOM READY
// =========================
window.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();

  // Firestore real-time
  db.collection("publicGoals")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {
      publicGoals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      renderPublicGoals();
    });

  loadLocalGoals();
  renderPrivateGoals();
});

// =========================
// EVENTS
// =========================
function setupEventListeners() {
  // Navigation
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      showSection(btn.dataset.section);
    });
  });

  document.getElementById("addGoalBtn").addEventListener("click", openModal);
  document.querySelectorAll(".close").forEach(btn => btn.addEventListener("click", closeModals));
  document.getElementById("cancelBtn").addEventListener("click", closeModals);

  document.getElementById("goalForm").addEventListener("submit", saveGoal);

  document.getElementById("goalProgress").addEventListener("input", e => {
    document.getElementById("progressValue").textContent = e.target.value;
  });

  document.querySelectorAll('input[name="visibility"]').forEach(radio => {
    radio.addEventListener("change", e => {
      document.getElementById("publicOptions").style.display =
        e.target.value === "public" ? "block" : "none";
    });
  });
}

// =========================
// MODAL
// =========================
function openModal(goalId = null) {
  document.getElementById("modal").classList.add("active");
}

function closeModals() {
  document.querySelectorAll(".modal").forEach(m => m.classList.remove("active"));
}

// =========================
// SAVE GOAL
// =========================
function saveGoal(e) {
  e.preventDefault();

  const title = document.getElementById("goalTitle").value.trim();
  const description = document.getElementById("goalDescription").value.trim();
  const progress = +document.getElementById("goalProgress").value;
  const visibility = document.querySelector('input[name="visibility"]:checked').value;

  if (!title) return;

  const goal = {
    title,
    description,
    progress,
    visibility,
    createdAt: Date.now()
  };

  if (visibility === "public") {
    db.collection("publicGoals").add(goal);
    analytics.logEvent("add_goal_public");
  } else {
    goal.id = Date.now().toString();
    goals.push(goal);
    saveLocalGoals();
    renderPrivateGoals();
  }

  closeModals();
}

// =========================
// RENDER
// =========================
function renderPublicGoals() {
  const container = document.getElementById("publicGoals");
  if (!publicGoals.length) {
    container.innerHTML = "<p>Aucun objectif public</p>";
    return;
  }
  container.innerHTML = publicGoals
    .map(g => `
      <div class="goal-card">
          <h3>${escapeHtml(g.title)}</h3>
          <p>${escapeHtml(g.description)}</p>
          <p>${g.progress}%</p>
      </div>
    `)
    .join("");
}

function renderPrivateGoals() {
  const container = document.getElementById("privateGoals");
  if (!goals.length) {
    container.innerHTML = "<p>Aucun objectif privé</p>";
    return;
  }
  container.innerHTML = goals
    .map(g => `
      <div class="goal-card">
          <h3>${escapeHtml(g.title)}</h3>
          <p>${escapeHtml(g.description)}</p>
          <p>${g.progress}%</p>
      </div>
    `)
    .join("");
}

function showSection(section) {
  document.querySelectorAll(".goals-section").forEach(s => s.classList.remove("active"));
  document.getElementById(section + "Section").classList.add("active");
}

// =========================
// LOCAL STORAGE
// =========================
function saveLocalGoals() {
  localStorage.setItem("myGoalsPrivate", JSON.stringify(goals));
}

function loadLocalGoals() {
  const saved = localStorage.getItem("myGoalsPrivate");
  if (saved) goals = JSON.parse(saved);
}

// =========================
// UTIL
// =========================
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
