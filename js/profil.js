/**
 * GESTION DU PROFIL (Version Gamification Complète)
 */

// --- 1. CONFIGURATION (Rangs & Trophées) ---

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

// --- 2. INITIALISATION & HEADER ---

function initProfilHeader() {
    const pseudo = localStorage.getItem('massalia_user_pseudo') || "Citoyen";
    const avatar = localStorage.getItem('massalia_user_avatar') || "https://openclipart.org/image/800px/277081";
    
    // Mise à jour sécurisée du Header (si les éléments existent)
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

// --- 3. VUE PRINCIPALE (PROFIL COMPACT) ---

async function renderProfilModalContent() {
    const content = document.getElementById('modal-content');
    if (!content) return;

    // A. Récupération des Données
    const pseudo = localStorage.getItem('massalia_user_pseudo') || "Citoyen";
    const avatar = localStorage.getItem('massalia_user_avatar') || "https://openclipart.org/image/800px/277081";
    
    const lusIds = JSON.parse(localStorage.getItem("massalia_lus")) || [];
    const savedRecettesIds = JSON.parse(localStorage.getItem('massalia_saved_recettes')) || [];

    // B. Calcul du Score Global (Somme des quiz)
    let globalScore = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("quiz_")) {
            globalScore += parseInt(localStorage.getItem(key)) || 0;
        }
    }

    // C. Détermination du Rang
    // On inverse le tableau pour trouver le rang le plus élevé atteint
    const currentRank = [...PROFIL_RANKS].reverse().find(r => globalScore >= r.min) || PROFIL_RANKS[0];

    // D. Calcul des Trophées débloqués
    const userData = { lus: lusIds.length, recettes: savedRecettesIds.length, score: globalScore };
    let unlockedCount = 0;
    TROPHIES.forEach(t => { 
        if(t.condition(userData)) unlockedCount++; 
    });

    // E. Rendu HTML
    content.innerHTML = `
        <button onclick="toggleProfilModal()" class="btn-close-modal">×</button>

        <div class="modal-body" style="text-align:center;">
            <div class="profile-avatar-container">
                <img src="${avatar}" class="profile-avatar-img">
            </div>
            
            <h2 class="titre-page" style="margin-bottom:5px; border:none;">${pseudo.toUpperCase()}</h2>
            
            <div style="background:var(--abysse); color:var(--or); padding:10px 20px; border-radius:8px; display:inline-block; margin-bottom:20px; font-family:'Cinzel'; box-shadow:0 4px 6px rgba(0,0,0,0.2); border:1px solid var(--or);">
                <div style="font-size:1.4rem; margin-bottom:5px;">${currentRank.icon} ${currentRank.title.toUpperCase()}</div>
                <div style="font-size:0.8rem; color:white; letter-spacing:1px;">💰 ${globalScore} OBOLES</div>
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

// --- 4. VUE TROPHÉES ---

function renderTrophiesView() {
    const content = document.getElementById('modal-content');
    
    // Recalcul des stats pour vérification en temps réel
    const lusIds = JSON.parse(localStorage.getItem("massalia_lus")) || [];
    const savedRecettesIds = JSON.parse(localStorage.getItem('massalia_saved_recettes')) || [];
    let globalScore = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("quiz_")) globalScore += parseInt(localStorage.getItem(key)) || 0;
    }
    const userData = { lus: lusIds.length, recettes: savedRecettesIds.length, score: globalScore };

    // Génération de la grille
    let trophiesHtml = "";
    TROPHIES.forEach(t => {
        const isUnlocked = t.condition(userData);
        // On applique une classe CSS si débloqué
        const statusClass = isUnlocked ? 'unlocked' : '';
        const statusIcon = isUnlocked ? '✅' : '🔒';
        const statusColor = isUnlocked ? 'var(--or)' : '#ccc';
        
        trophiesHtml += `
            <div class="trophy-item ${statusClass}" style="
                background:white; 
                border:1px solid ${statusColor}; 
                border-radius:8px; 
                padding:15px 5px; 
                text-align:center; 
                opacity: ${isUnlocked ? 1 : 0.6};
                filter: ${isUnlocked ? 'none' : 'grayscale(100%)'};
                transition: transform 0.2s;
            ">
                <span class="trophy-icon" style="font-size:2rem; display:block; margin-bottom:5px;">${t.icon}</span>
                <span class="trophy-name" style="font-size:0.7rem; font-weight:bold; font-family:'Cinzel'; display:block; color:var(--abysse);">${t.title.toUpperCase()}</span>
                <div style="font-size:0.6rem; color:#666; margin-top:4px; font-style:italic;">${t.desc}</div>
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

            <div class="trophy-grid" style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px;">
                ${trophiesHtml}
            </div>

            <button class="btn-secondary" onclick="renderProfilModalContent()" style="margin-top:20px;">
                ⬅️ RETOUR PROFIL
            </button>
        </div>
    `;
}

// --- 5. SAUVEGARDE ---

function saveUserInfo() {
    const pseudoInput = document.getElementById('edit-pseudo');
    const pseudo = pseudoInput ? pseudoInput.value.trim() : "Citoyen";
    
    if(pseudo.length > 0) {
        localStorage.setItem('massalia_user_pseudo', pseudo);
        initProfilHeader(); // Met à jour le header si visible
        if(typeof showToast === "function") showToast("Profil mis à jour !");
        renderProfilModalContent(); // Rafraîchit la modale pour voir le changement
    }
}

// Lancement à l'ouverture de la page
document.addEventListener('DOMContentLoaded', initProfilHeader);