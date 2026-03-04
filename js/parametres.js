/**
 * GESTION DES PARAMÈTRES (Version Corrigée & Nettoyée)
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
    const content = document.getElementById('parametres-content');
    if(!content) return;

    const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent);
    
    let installHelp = isIos ? `
        <h3 class="info-title">📲 INSTALLER (IPHONE)</h3>
        <ul class="info-list" style="padding-left: 20px;">
            <li>Bouton <strong>Partager</strong> <span style="font-size:1.2rem;">⎋</span></li>
            <li>Choisir <strong>"Sur l'écran d'accueil"</strong></li>
            <li>Cliquer sur <strong>Ajouter</strong></li>
        </ul>` : `
        <h3 class="info-title">📲 INSTALLER L'APP</h3>
        <p class="texte-courant">Ouvrez le menu (⋮) puis cliquez sur <strong>"Installer l'application"</strong> pour profiter du mode plein écran.</p>`;

    // NOTE : On utilise la classe 'modal-body' pour avoir exactement le même padding que le profil
    content.innerHTML = `
        <div style="padding: 20px 25px; text-align: center;">
            <h2 class="titre-page">PARAMÈTRES</h2>
            
            <div class="info-box" style="text-align:left;">
                <h3 class="info-title">📲 INSTALLATION</h3>
                <p class="texte-courant">Pour une meilleure expérience, installez l'application via le menu de votre navigateur.</p>
            </div>
            
            <div class="settings-section">
                <h3 class="info-title">👤 MON PROFIL</h3>
                <button class="btn-secondary" onclick="toggleParametresModal(); toggleProfilModal();">
                    MODIFIER PSEUDO / AVATAR
                </button>
            </div>

            <div class="settings-section" style="text-align: left;">
                <h3 class="info-title">📬 CONTACTER L'ARCHIVISTE</h3>
                <p class="texte-courant" style="font-size: 0.9rem; margin-bottom: 10px;">Un bug ? Une idée ?</p>
                
                <div style="width: 100%;">
                    <input type="email" id="contact-email" placeholder="Ton email">
                    <div style="height: 10px;"></div> <textarea id="contact-message" placeholder="Ton message..." style="height:100px; resize:none;"></textarea>
                    <div style="height: 10px;"></div> <button class="btn-primary" onclick="sendFeedback()">ENVOYER</button>
                </div>
            </div>

            <div class="settings-section no-border">
                <button class="btn-danger" onclick="resetCodex()">RÉINITIALISER TOUT</button>
            </div>
        </div>
    `;
}

function sendFeedback() {
    const emailInput = document.getElementById('contact-email');
    const messageInput = document.getElementById('contact-message');
    const email = emailInput.value;
    const msg = messageInput.value;

    if(!msg || msg.length < 10) {
        showToast("⚠️ Ton message est trop court pour l'Archiviste !");
        return;
    }

    // Identifiants EmailJS
    const SERVICE_ID = "service_i3fq0e3";
    const TEMPLATE_ID = "template_fjurr59";

    const templateParams = {
        contact_email: email || "Anonyme",
        message: msg
    };

    emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams)
        .then(function(response) {
           showToast("✅ Message envoyé à l'Archiviste !");
           emailInput.value = "";
           messageInput.value = "";
        }, function(error) {
           console.error("Erreur EmailJS:", error);
           showToast("❌ Échec de l'envoi.");
        });
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