/**
 * GESTION HUB ÉPREUVES (Quiz, Motus & Carte)
 * Version : Design Épuré & Uniforme
 */

async function renderEpreuves() {
    const mainContainer = document.getElementById('app');
    
    // --- 0. CHARGEMENT DONNÉES CARTE ---
    let totalRiddles = 3; 
    try {
        const response = await fetch('data/lieux.json');
        if (response.ok) {
            const data = await response.json();
            totalRiddles = data.length;
        }
    } catch (error) {
        console.warn("Défaut lieux.json", error);
    }

    // --- 1. LOGIQUE MOTUS ---
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const motusState = JSON.parse(localStorage.getItem('massalia_motus_state_' + todayStr));
    
    let motusContent = "";
    let motusBtnAction = `onclick="loadSection('motus')"`;
    let motusBtnText = "DÉCHIFFRER";
    let motusBtnClass = "btn-secondary";
    let borderMotus = "var(--abysse)"; 
    let isMotusFinished = motusState && motusState.gameOver;

    if (isMotusFinished) {
        motusBtnAction = `onclick="shareHubMotus(${motusState.currentAttempt}, ${motusState.win})"`;
        motusBtnText = "PARTAGER 📤";
        
        motusContent = `
            <div style="flex-grow:1; display:flex; flex-direction:column; justify-content:center; gap:10px; width:100%;">
                <div class="${motusState.win ? 'badge-success' : 'badge-info'}" 
                     style="align-self:center; ${!motusState.win ? 'background:#c0392b; color:white; border:none;' : ''}">
                    ${motusState.win ? '✅ VICTOIRE' : '❌ TERMINÉ'}
                </div>
                <div style="background:#f4f4f4; padding:5px 10px; border-radius:6px;">
                    <div style="font-size:0.65rem; color:#666; text-transform:uppercase;">Prochain mot</div>
                    <div id="hub-timer" style="font-family:'Cinzel'; font-size:1rem; font-weight:bold;">Calcul...</div>
                </div>
            </div>
        `;
        setTimeout(startHubTimer, 100);
    } else {
        motusContent = `
            <div style="flex-grow:1; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:5px;">
                <span class="badge-info" style="font-size:0.7rem;">⏳ À JOUER</span>
                <p class="texte-courant" style="font-size:0.85rem; margin:0;">Trouve le mot du jour.</p>
            </div>
        `;
    }

    // --- 2. LOGIQUE CARTE ---
    const mapProgress = parseInt(localStorage.getItem('massalia_map_progress')) || 0;
    const isMapFinished = mapProgress >= totalRiddles;

    let mapContent = "";
    let mapBtnText = "EXPLORER 🗺️";
    let mapBorder = "var(--or)";
    let mapBtnClass = "btn-primary";

    if (isMapFinished) {
        mapBtnText = "ADMIRER LA CARTE";
        mapBorder = "#f1c40f"; 
        mapBtnClass = "btn-secondary";
        // Suppression du badge Maître "dégeulasse", simple texte
        mapContent = `
            <div style="flex-grow:1; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:5px;">
                <p class="texte-courant" style="font-size:0.9rem; margin:0; color:#27ae60; font-weight:bold;">Carte Complétée</p>
                <p class="texte-courant" style="font-size:0.8rem; margin:0;">Tous les lieux ont été trouvés.</p>
            </div>
        `;
    } else {
        mapContent = `
            <div style="flex-grow:1; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:5px;">
                <div class="date-badge">${mapProgress} / ${totalRiddles} DÉCOUVERTS</div>
                <p class="texte-courant" style="font-size:0.85rem; margin:0;">Localise les lieux secrets.</p>
            </div>
        `;
    }

    // --- 3. SCORE QUIZ ---
    let prog = { globalScore: 0 };
    try { 
        if (typeof getProgression === "function") prog = getProgression(); 
        else { const saved = localStorage.getItem('massalia_progression'); if(saved) prog = JSON.parse(saved); }
    } catch(e) {}

    // --- STYLES UNIFORMES ---
    // On garde juste le strict minimum pour la structure, le reste vient du CSS .codex-card
    const cardStructure = `
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        text-align: center; 
        min-height: 240px; 
        justify-content: space-between;
    `;
    
    const iconStyle = `font-size: 2rem; margin-bottom: 5px;`; // Icônes réduites
    const titleStyle = `margin: 5px 0 10px 0;`; // Marges réduites
    const btnStyle = `width: 100%; margin-top: 15px;`; 

    // --- RENDER HTML ---
    mainContainer.innerHTML = `
        <div class="fade-in">
            <h2 class="titre-page" style="margin-top:20px;">SALLE DES DÉFIS</h2>
            <p class="text-muted" style="text-align:center; margin-bottom:30px;">"La gloire se mérite par l'esprit."</p>

            <div class="codex-card" style="${cardStructure} border-left: 5px solid #c0392b;">
                <div style="${iconStyle}">🏺</div>
                <h3 class="titre-card" style="${titleStyle}">LE GRAND QUIZ</h3>
                
                <div style="flex-grow:1; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:5px;">
                    <div class="date-badge">Trésor : ${prog.globalScore} 🟡</div>
                    <p class="texte-courant" style="font-size:0.85rem; margin:0;">Prouve ta valeur.</p>
                </div>

                <button class="btn-primary" onclick="loadSection('quiz')" style="${btnStyle}">ENTRER DANS L'ARÈNE</button>
            </div>

            <div class="codex-card" style="${cardStructure} border-left: 5px solid ${borderMotus};">
                <div style="${iconStyle}">🔠</div>
                <h3 class="titre-card" style="${titleStyle}">LE MOTUS DU JOUR</h3>
                
                ${motusContent}

                <button class="${motusBtnClass}" ${motusBtnAction} style="${btnStyle}">${motusBtnText}</button>
            </div>

            <div class="codex-card" style="${cardStructure} border-left: 5px solid ${mapBorder};">
                <div style="${iconStyle}">📜</div>
                <h3 class="titre-card" style="${titleStyle}">L'ÉNIGME DU SCRIBE</h3>
                
                ${mapContent}

                <button class="${mapBtnClass}" onclick="loadSection('carte')" style="${btnStyle}">${mapBtnText}</button>
            </div>

        </div>
    `;
}

// Timer Hub
function startHubTimer() {
    function update() {
        const timerElem = document.getElementById('hub-timer');
        if(!timerElem) return;
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0); 
        const diff = midnight - now;
        if (diff <= 0) { renderEpreuves(); return; } 
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        timerElem.innerText = `${h}h ${m}m`;
    }
    update();
    setInterval(update, 60000); 
}

// Partage
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