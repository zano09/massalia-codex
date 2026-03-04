/**
 * GESTION HUB ÉPREUVES (Timer & Partage intégrés)
 */

function renderEpreuves() {
    const mainContainer = document.getElementById('app');
    
    // --- LOGIQUE MOTUS ---
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const motusState = JSON.parse(localStorage.getItem('massalia_motus_state_' + todayStr));
    
    let motusContent = "";
    let opacity = "1";
    let border = "var(--abysse)";

    if (motusState && motusState.gameOver) {
        opacity = "1"; // On laisse visible pour voir le timer
        // On calcule le timer direct
        motusContent = `
            <div style="margin-top:10px;">
                <div class="${motusState.win ? 'badge-success' : 'badge-info'}" style="${!motusState.win ? 'background:#c0392b; color:white; border:none;' : ''}">
                    ${motusState.win ? '✅ VICTOIRE' : '❌ TERMINÉ'}
                </div>
                
                <div style="margin:15px 0; background:#f4f4f4; padding:10px; border-radius:8px;">
                    <div style="font-size:0.7rem; color:#666; margin-bottom:5px;">PROCHAIN MOT DANS</div>
                    <div id="hub-timer" style="font-family:'Cinzel'; font-size:1.2rem; font-weight:bold;">Calcul...</div>
                </div>

                <button class="btn-secondary" onclick="shareHubMotus(${motusState.currentAttempt}, ${motusState.win})">
                    PARTAGER 📤
                </button>
            </div>
        `;
        // On lance le timer
        setTimeout(startHubTimer, 100);
    } else {
        // Pas encore joué
        motusContent = `
            <p class="texte-courant" style="text-align:center;">Devine le mot secret en 6 essais.</p>
            <span class="badge-info">⏳ À JOUER</span>
            <button class="btn-secondary" style="margin-top:15px;">DÉCHIFFRER</button>
        `;
    }

    // --- SCORE QUIZ ---
    let prog = { globalScore: 0 };
    try { if (typeof getProgression === "function") prog = getProgression(); } catch(e) {}

    mainContainer.innerHTML = `
        <div class="fade-in">
            <h2 class="titre-page" style="margin-top:20px;">SALLE DES DÉFIS</h2>
            <p class="text-muted" style="text-align:center; margin-bottom:30px;">"La gloire se mérite par l'esprit."</p>

            <div class="codex-card clickable" onclick="loadSection('quiz')" style="text-align:center;">
                <div style="font-size:2.5rem; margin-bottom:10px;">🏺</div>
                <h3 class="titre-card">LE GRAND QUIZ</h3>
                <div class="date-badge">Mon Trésor : ${prog.globalScore} 🟡</div>
                <button class="btn-primary" style="margin-top:10px;">ENTRER DANS L'ARÈNE</button>
            </div>

            <div class="codex-card ${!motusState?.gameOver ? 'clickable' : ''}" 
                 onclick="${!motusState?.gameOver ? "loadSection('motus')" : ''}"
                 style="text-align:center; opacity:${opacity}; border-left: 5px solid ${border};">
                
                <div style="font-size:2.5rem; margin-bottom:10px;">🔠</div>
                <h3 class="titre-card" style="color:var(--abysse);">LE MOTUS DU JOUR</h3>
                ${motusContent}
            </div>
        </div>
    `;
}

// Timer spécifique pour le Hub
function startHubTimer() {
    function update() {
        const timerElem = document.getElementById('hub-timer');
        if(!timerElem) return;
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0); 
        const diff = midnight - now;
        if (diff <= 0) { renderEpreuves(); return; } // Recharge si minuit passé
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        timerElem.innerText = `${h}h ${m}m`;
    }
    update();
    setInterval(update, 60000); // Mise à jour par minute suffisant ici
}

// Fonction de partage rapide depuis le Hub
function shareHubMotus(attempts, win) {
    const nb = win ? attempts + 1 : "X";
    const text = `MOT DU JOUR ${nb}/6\n\nJ'ai relevé le défi sur Massalia Codex !\n\nmassalia-codex.fr`;
    
    if (navigator.share) {
        navigator.share({ title: 'Massalia Motus', text: text }).catch(console.error);
    } else {
        navigator.clipboard.writeText(text).then(() => {
            if(typeof showToast === 'function') showToast("Résultat copié !");
            else alert("Copié !");
        });
    }
}