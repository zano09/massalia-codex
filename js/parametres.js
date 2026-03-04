/**
 * GESTION DES PARAMÈTRES (Version Modale)
 */

function toggleParametresModal() {
    const modal = document.getElementById('parametres-modal');
    if (!modal) return;
    
    if (modal.style.display === 'none' || modal.style.display === '') {
        renderParametresContent();
        modal.style.display = 'flex';
    } else {
        modal.style.display = 'none';
    }
}

function renderParametresContent() {
    const content = document.getElementById('parametres-content'); // Attention ID différent du profil
    if(!content) return;

    const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent);
    
    let installHelp = isIos ? `
        <h3 class="info-title">📲 INSTALLER (IPHONE)</h3>
        <ol class="info-list">
            <li>Bouton <strong>Partager</strong> <span style="font-size:1.2rem;">⎋</span></li>
            <li><strong>"Sur l'écran d'accueil"</strong></li>
            <li><strong>Ajouter</strong></li>
        </ol>` : `
        <h3 class="info-title">📲 INSTALLER L'APP</h3>
        <p class="texte-courant">Menu (⋮) > <strong>"Installer l'application"</strong>.</p>`;

    content.innerHTML = `
        <div style="text-align:center; padding-top:20px;">
            <h2 class="titre-page">PARAMÈTRES</h2>
            
            <div class="info-box" style="text-align:left;">${installHelp}</div>
            
            <div class="settings-section">
                <h3 class="titre-card">👤 Mon Profil</h3>
                <button class="btn-secondary" onclick="toggleParametresModal(); toggleProfilModal();">
                    MODIFIER PSEUDO / AVATAR
                </button>
            </div>

            <div class="settings-section no-border">
                <button class="btn-danger" onclick="resetCodex()">RÉINITIALISER TOUT</button>
            </div>
        </div>
    `;
}

function resetCodex() {
    openConfirmModal(
        "Tout effacer ? Ta progression sera perdue à jamais.", 
        function() {
            localStorage.clear();
            location.reload();
        }
    );
}