/**
 * GESTION DU PROFIL (Version Compacte & Gamification)
 */

// Rangs & Trophées
const PROFIL_RANKS = [
    { min: 0, title: "Naufragé", icon: "🪵" },
    { min: 101, title: "Pêcheur", icon: "🐟" },
    { min: 301, title: "Négociant", icon: "⚖️" },
    { min: 601, title: "Bâtisseur", icon: "🔨" },
    { min: 1001, title: "Légionnaire", icon: "⚔️" },
    { min: 1501, title: "Capitaine", icon: "⚓" },
    { min: 2201, title: "Armateur", icon: "🚢" },
    { min: 3001, title: "Sénateur", icon: "🏛️" },
    { min: 4001, title: "Fondateur", icon: "🔱" },
    { min: 5501, title: "Légende", icon: "👑" }
];

const TROPHIES = [
    { id: "t1", icon: "📜", title: "Curieux", condition: (data) => data.lus >= 5, desc: "Lire 5 histoires" },
    { id: "t2", icon: "📚", title: "Erudit", condition: (data) => data.lus >= 20, desc: "Lire 20 histoires" },
    { id: "t3", icon: "🍳", title: "Gourmet", condition: (data) => data.recettes >= 3, desc: "Sauvegarder 3 recettes" },
    { id: "t4", icon: "👨‍🍳", title: "Chef", condition: (data) => data.recettes >= 10, desc: "Sauvegarder 10 recettes" },
    { id: "t5", icon: "💰", title: "Économe", condition: (data) => data.score >= 500, desc: "Gagner 500 Oboles" },
    { id: "t6", icon: "💎", title: "Fortuné", condition: (data) => data.score >= 2000, desc: "Gagner 2000 Oboles" },
    { id: "t7", icon: "🧠", title: "Génie", condition: (data) => data.score >= 5000, desc: "Gagner 5000 Oboles" },
    { id: "t8", icon: "🔥", title: "Fanatique", condition: (data) => data.lus >= 50, desc: "Lire 50 histoires" }
];

function initProfilHeader() {
    const pseudo = localStorage.getItem('massalia_user_pseudo') || "Citoyen";
    const avatar = localStorage.getItem('massalia_user_avatar') || "https://openclipart.org/image/800px/277081";
    const avatarImg = document.getElementById('user-avatar-img');
    const pseudoTop = document.getElementById('display-pseudo-top');
    if(avatarImg) avatarImg.src = avatar;
    if(pseudoTop) pseudoTop.innerText = pseudo.toUpperCase();
}

function toggleProfilModal() {
    const modal = document.getElementById('profil-modal');
    if (!modal) return;
    if (modal.style.display === 'none' || modal.style.display === '') {
        renderProfilModalContent();
        modal.style.display = 'flex';
    } else {
        modal.style.display = 'none';
    }
}

// 1. VUE PRINCIPALE (Compacte)
async function renderProfilModalContent() {
    const content = document.getElementById('modal-content');
    // ... (Récupération des données : pseudo, scores...) ...
    const pseudo = localStorage.getItem('massalia_user_pseudo') || "Anonyme";
    const avatar = localStorage.getItem('massalia_user_avatar') || "https://openclipart.org/image/800px/277081";
    // ... (Calculs scores et rangs identiques à avant) ...
    // Je remets juste le code de calcul pour que tu puisses copier-coller la fonction entière si besoin
    const lusIds = JSON.parse(localStorage.getItem("massalia_lus")) || [];
    const savedRecettesIds = JSON.parse(localStorage.getItem('massalia_saved_recettes')) || [];
    let globalScore = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("quiz_")) globalScore += parseInt(localStorage.getItem(key)) || 0;
    }
    const currentRank = [...PROFIL_RANKS].reverse().find(r => globalScore >= r.min) || PROFIL_RANKS[0];
    const userData = { lus: lusIds.length, recettes: savedRecettesIds.length, score: globalScore };
    let unlockedCount = 0;
    TROPHIES.forEach(t => { if(t.condition(userData)) unlockedCount++; });

    content.innerHTML = `
        <button onclick="toggleProfilModal()" class="btn-close-modal">×</button>

        <div class="modal-body" style="text-align:center;">
            <div class="profile-avatar-container">
                <img src="${avatar}" class="profile-avatar-img">
            </div>
            
            <h2 class="titre-page" style="margin-bottom:5px; border:none;">${pseudo.toUpperCase()}</h2>
            
            <div style="background:var(--abysse); color:var(--or); padding:10px; border-radius:8px; display:inline-block; margin-bottom:20px; font-family:'Cinzel';">
                <div style="font-size:1.2rem; margin-bottom:5px;">${currentRank.icon} ${currentRank.title.toUpperCase()}</div>
                <div style="font-size:0.8rem; color:white;">💰 ${globalScore} OBOLES</div>
            </div>

            <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px;">
                <button class="btn-secondary" onclick="renderTrophiesView()" style="justify-content:space-between; padding:15px;">
                    <span>🏆 SALLE DES TROPHÉES</span>
                    <span class="badge-count" style="background:var(--or); color:var(--abysse);">${unlockedCount}/${TROPHIES.length}</span>
                </button>

                <button class="btn-primary" onclick="toggleProfilModal(); openEnregistrementModal();" style="justify-content:space-between; padding:15px;">
                    <span>📂 MON COFFRE-FORT</span>
                    <span class="badge-count" style="background:rgba(255,255,255,0.3);">GO</span>
                </button>
            </div>
            
            <div class="form-box">
                <label class="form-label">Modifier Pseudo</label>
                <div style="display:flex; gap:10px;">
                    <input type="text" id="edit-pseudo" value="${pseudo}" class="input-standard" style="margin:0;">
                    <button class="btn-secondary" onclick="saveUserInfo()" style="width:auto; margin:0;">OK</button>
                </div>
            </div>
        </div>
    `;
}

// 2. VUE TROPHÉES (CORRIGÉE : Croix en haut + Style)
function renderTrophiesView() {
    const content = document.getElementById('modal-content');
    
    // ... (Récupération des stats identiques) ...
    const lusIds = JSON.parse(localStorage.getItem("massalia_lus")) || [];
    const savedRecettesIds = JSON.parse(localStorage.getItem('massalia_saved_recettes')) || [];
    let globalScore = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("quiz_")) globalScore += parseInt(localStorage.getItem(key)) || 0;
    }
    const userData = { lus: lusIds.length, recettes: savedRecettesIds.length, score: globalScore };

    let trophiesHtml = "";
    TROPHIES.forEach(t => {
        const isUnlocked = t.condition(userData);
        trophiesHtml += `
            <div class="trophy-item ${isUnlocked ? 'unlocked' : ''}" style="margin-bottom:10px;">
                <span class="trophy-icon" style="font-size:2.5rem;">${t.icon}</span>
                <span class="trophy-name" style="font-size:0.8rem; margin-top:5px;">${t.title.toUpperCase()}</span>
                <div style="font-size:0.65rem; color:#666; margin-top:2px; font-style:italic;">${t.desc}</div>
                ${isUnlocked ? '<div style="font-size:0.7rem; color:green; font-weight:bold; margin-top:5px;">DÉBLOQUÉ</div>' : '<div style="font-size:1.2rem; margin-top:5px;">🔒</div>'}
            </div>
        `;
    });

    content.innerHTML = `
        <button onclick="toggleProfilModal()" class="btn-close-modal">×</button>

        <div class="modal-body fade-in">
            <h2 class="titre-page" style="margin-top:10px;">SALLE DES TROPHÉES</h2>
            <p class="text-muted" style="text-align:center; margin-bottom:20px;">
                Accomplis des exploits pour ta gloire.
            </p>

            <div class="trophy-grid" style="grid-template-columns: 1fr 1fr;">
                ${trophiesHtml}
            </div>

            <button class="btn-secondary" onclick="renderProfilModalContent()" style="margin-top:20px;">
                ⬅️ RETOUR PROFIL
            </button>
        </div>
    `;
}

function saveUserInfo() {
    const pseudoInput = document.getElementById('edit-pseudo');
    const pseudo = pseudoInput ? pseudoInput.value : "Citoyen";
    localStorage.setItem('massalia_user_pseudo', pseudo);
    initProfilHeader();
    if(typeof showToast === "function") showToast("Profil mis à jour !");
    renderProfilModalContent(); 
}