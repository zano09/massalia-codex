/**
 * MASSALIA CODEX - MAIN ROUTER (Chef de Gare)
 */

window.onload = async () => {
    // 1. Splash Screen
    if(typeof handleSplashScreen === "function") await handleSplashScreen();
    
    // 2. Profil
    if(typeof initProfilHeader === "function") initProfilHeader();

    // 3. Lancement
    loadSection('accueil');
};

/* --- SYSTÈME DE NAVIGATION (ROUTER) --- */
window.loadSection = function(sectionId) {
    const app = document.getElementById('app');
    const header = document.getElementById('main-header'); // On cible le bandeau Massalia
    
    // 1. GESTION DU HEADER (Bandeau Massalia)
    // On l'affiche UNIQUEMENT sur l'accueil
    if (header) {
        if (sectionId === 'accueil') {
            header.style.display = 'block';
        } else {
            header.style.display = 'none';
        }
    }

    // 2. CAS SPÉCIAL : PARAMÈTRES (C'est une modale maintenant)
    if (sectionId === 'parametres') {
        if(typeof toggleParametresModal === 'function') {
            toggleParametresModal();
        } else {
            console.error("toggleParametresModal introuvable. Vérifie parametres.js");
        }
        return; // On arrête ici, on ne change pas la page de fond
    }

    // 3. MISE À JOUR NAVIGATION BASSE
    updateActiveNav(sectionId);
    window.scrollTo(0, 0);

    // 4. CHARGEMENT DE LA PAGE
    switch(sectionId) {
        case 'accueil':
            if(typeof renderAccueil === 'function') renderAccueil();
            break;

        case 'chrono':
            if(typeof renderChrono === 'function') renderChrono();
            break;

        case 'epreuves':
            if(typeof renderEpreuves === 'function') renderEpreuves();
            break;

        case 'quiz':
            if(typeof loadQuiz === 'function') loadQuiz();
            break;

        case 'motus':
            if(typeof loadMotus === 'function') loadMotus(); 
            break;
            
        default:
            console.error("Section inconnue : " + sectionId);
            loadSection('accueil');
    }
}

/* --- BARRE DE NAVIGATION --- */
function updateActiveNav(activeId) {
    // Si on ouvre les paramètres, on ne change pas l'icône active du bas
    if(activeId === 'parametres') return;

    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
    
    // Astuce : Si on est dans 'quiz' ou 'motus', on allume l'icône 'epreuves'
    let targetId = activeId;
    if(activeId === 'quiz' || activeId === 'motus') targetId = 'epreuves';

    const activeBtn = document.getElementById(`nav-btn-${targetId}`);
    if(activeBtn) activeBtn.classList.add('active');
}

/* --- OUTILS GLOBAUX --- */

window.showToast = function(message) {
    const toast = document.getElementById("toast-notification");
    if(toast) {
        toast.innerText = message;
        toast.className = "show";
        setTimeout(() => toast.className = toast.className.replace("show", ""), 3000);
    }
}

// OUVRIR LA MODALE RECETTE
window.openRecetteModal = function(recette) {
    const modal = document.getElementById('recette-modal');
    if(!modal) return;

    document.getElementById('modal-titre').innerText = recette.titre;
    document.getElementById('modal-astuce').innerText = recette.astuce;
    
    const img = document.getElementById('modal-img');
    if(recette.photo) {
        img.src = recette.photo;
        img.style.display = 'block';
    } else {
        img.style.display = 'none';
    }

    const ingList = recette.ingredients.map(i => `<li style="margin-bottom:5px;">• ${i}</li>`).join('');
    document.getElementById('modal-ingredients').innerHTML = ingList;

    const prepList = recette.preparation.map((step, i) => `<li style="margin-bottom:10px;"><strong>${i+1}.</strong> ${step}</li>`).join('');
    document.getElementById('modal-prep').innerHTML = prepList;

    updateSaveButton(recette.id);

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

window.closeRecetteModal = function() {
    const modal = document.getElementById('recette-modal');
    if(modal) modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function updateSaveButton(id) {
    const btn = document.getElementById('modal-save-btn');
    if(!btn) return;
    
    const saved = JSON.parse(localStorage.getItem('massalia_saved_recettes')) || [];
    const isSaved = saved.includes(id);

    if(isSaved) {
        btn.innerHTML = "<span>❤️</span> ENREGISTRÉE";
        btn.onclick = () => toggleSaveRecette(id, false);
    } else {
        btn.innerHTML = "<span>🤍</span> ENREGISTRER";
        btn.onclick = () => toggleSaveRecette(id, true);
    }
}

function toggleSaveRecette(id, actionAdd) {
    let saved = JSON.parse(localStorage.getItem('massalia_saved_recettes')) || [];
    
    if (actionAdd) {
        if(!saved.includes(id)) saved.push(id);
        showToast("Recette ajoutée à ton carnet ! 🥘");
    } else {
        saved = saved.filter(itemId => itemId !== id);
        showToast("Recette retirée.");
    }
    
    localStorage.setItem('massalia_saved_recettes', JSON.stringify(saved));
    updateSaveButton(id);
    
    // Rafraîchir le profil si ouvert
    const profilModal = document.getElementById('profil-modal');
    if(profilModal && profilModal.style.display === 'flex' && typeof renderProfilModalContent === "function") {
        renderProfilModalContent();
    }
}

// GESTION SPLASH SCREEN
async function handleSplashScreen() {
    const splashText = document.getElementById('splash-text');
    const splashAuthor = document.getElementById('splash-author');
    const screen = document.getElementById('splash-screen');

    try {
        const response = await fetch('data/citations.json');
        const citations = await response.json();
        const today = new Date();
        const dayIndex = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
        const magicIndex = (dayIndex * 37) % citations.length;
        const quote = citations[magicIndex];

        if(quote && splashText) {
            splashText.innerText = `"${quote.texte}"`;
            if(splashAuthor) splashAuthor.innerText = `— ${quote.auteur}`;
        }
    } catch (e) {
        console.log("Erreur citation:", e);
    }

    return new Promise(resolve => {
        setTimeout(() => {
            if(screen) screen.classList.add('hidden-splash');
            resolve();
        }, 5000); 
    });
}

// GESTION CONFIRMATION (OUI/NON)
let currentConfirmAction = null;

window.openConfirmModal = function(message, actionCallback) {
    const modal = document.getElementById('confirm-modal');
    const msgElem = document.getElementById('confirm-message');
    const yesBtn = document.getElementById('btn-confirm-yes');
    
    if(!modal) return;

    msgElem.innerText = message;
    currentConfirmAction = actionCallback;
    
    yesBtn.onclick = function() {
        if (currentConfirmAction) currentConfirmAction();
        closeConfirmModal();
    };

    modal.style.display = 'flex';
}

window.closeConfirmModal = function() {
    const modal = document.getElementById('confirm-modal');
    if(modal) modal.style.display = 'none';
    currentConfirmAction = null;
}



/* --- GESTION FAVORIS FRAGMENTS (Histoire) --- */

function toggleSaveFragment(id) {
    let saved = JSON.parse(localStorage.getItem('massalia_saved_fragments')) || [];
    const index = saved.indexOf(id);
    
    if (index === -1) {
        saved.push(id);
        showToast("Fragment ajouté aux favoris ! ❤️");
    } else {
        saved.splice(index, 1);
        showToast("Fragment retiré.");
    }
    
    localStorage.setItem('massalia_saved_fragments', JSON.stringify(saved));
    
    // Mise à jour visuelle immédiate du bouton cœur
    updateFragmentHeart(id);
    
    // Mise à jour du profil si ouvert
    if(document.getElementById('profil-modal').style.display === 'flex') {
        if(typeof renderProfilModalContent === 'function') renderProfilModalContent();
    }
}

function updateFragmentHeart(id) {
    const btn = document.getElementById('fav-btn-' + id);
    if (!btn) return;
    
    const saved = JSON.parse(localStorage.getItem('massalia_saved_fragments')) || [];
    if (saved.includes(id)) {
        btn.innerHTML = "❤️"; // Plein
        btn.style.opacity = "1";
    } else {
        btn.innerHTML = "🤍"; // Vide
        btn.style.opacity = "0.6";
    }
}