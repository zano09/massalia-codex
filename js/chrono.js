/**
 * GESTION DE LA CHRONOLOGIE (Version Swipe & Navigation Fluide)
 */

async function renderChrono() {
    const mainContainer = document.getElementById('app');
    
    // Reset scroll si on revient sur la liste
    window.scrollTo(0,0);

    mainContainer.innerHTML = "<div class='loader'>Déchiffrement des archives...</div>";

    try {
        // Chargement des données si pas encore en mémoire
        if (!window.timelineData) {
            const response = await fetch('data/anecdotes.json'); // Vérifie bien que le chemin est /data/ ou data/
            let data = await response.json();
            // Tri chronologique
            data.sort((a, b) => (a.annee === b.annee ? a.id - b.id : a.annee - b.annee));
            window.timelineData = data;
        }

        const data = window.timelineData;
        const lus = JSON.parse(localStorage.getItem("massalia_lus")) || [];
        const categories = [...new Set(data.map(item => item.categorie))];

        mainContainer.innerHTML = `
            <div class="fade-in">
                <h2 class="titre-page" style="margin-top:20px;">CHRONOLOGIE</h2>
                
                <div class="codex-card" style="background:var(--creme-leger);">
                    <input type="text" id="searchInput" placeholder="🔍 Rechercher (ex: Peste, César...)" 
                           onkeyup="filterTimeline()" 
                           class="input-standard">
                    
                    <select id="filterSelect" onchange="filterTimeline()" class="select-standard">
                        <option value="tous">Tout montrer</option>
                        <option value="non-lu">📖 À découvrir (Non lus)</option>
                        <option value="lu">✅ Déjà lus</option>
                        <optgroup label="Époques / Thèmes">
                            ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                        </optgroup>
                    </select>
                    
                    <div class="text-muted" style="text-align:right;">
                        ${lus.length} / ${data.length} fragments découverts
                    </div>
                </div>

                <div id="timelineContainer" class="timeline-wrapper"></div>
            </div>`;
        
        filterTimeline(); 

    } catch (error) {
        console.error(error);
        mainContainer.innerHTML = "<p style='text-align:center; color:red; padding:20px;'>Erreur de chargement des archives.</p>";
    }
}

// --- FILTRAGE ---
function filterTimeline() {
    const queryInput = document.getElementById('searchInput');
    if (!queryInput) return; 

    const query = queryInput.value.toLowerCase();
    const filterValue = document.getElementById('filterSelect').value;
    const container = document.getElementById('timelineContainer');
    const lus = JSON.parse(localStorage.getItem("massalia_lus")) || [];
    
    if(!window.timelineData) return;

    const filtered = window.timelineData.filter(item => {
        const estLu = lus.includes(item.id);
        const matchesSearch = item.titre.toLowerCase().includes(query) || item.texte.toLowerCase().includes(query);
        
        let matchesFilter = false;
        if (filterValue === 'tous') matchesFilter = true;
        else if (filterValue === 'lu') matchesFilter = estLu;
        else if (filterValue === 'non-lu') matchesFilter = !estLu;
        else if (filterValue === item.categorie) matchesFilter = true;

        return matchesSearch && matchesFilter;
    });

    if (filtered.length === 0) {
        container.innerHTML = "<div class='text-muted' style='text-align:center; padding:20px;'>Aucun résultat.</div>";
    } else {
        container.innerHTML = filtered.map(item => {
            const isLu = lus.includes(item.id);
            const statusClass = isLu ? "fragment-lu" : "fragment-new";
            const icon = isLu ? "✅" : "📜";
            
            return `
                <div class="timeline-event" onclick="showSpecificFragment(${item.id})">
                    <div class="timeline-dot"></div>
                    <div class="timeline-card ${statusClass}">
                        <div class="timeline-date">${item.date}</div>
                        <h3 class="timeline-title">${item.titre}</h3>
                        <div class="timeline-status">${icon}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// --- AFFICHER UN FRAGMENT (AVEC SWIPE) ---
// Note: j'ai ajouté le paramètre 'direction' pour l'animation
window.showSpecificFragment = async function(id, source = 'chrono', direction = 'none') {
    // 1. Gestion du Header & Nav
    const header = document.getElementById('main-header');
    if(header) header.style.display = 'none';
    
    // Si on vient de la frise, on allume l'icône Chrono
    if(source === 'chrono' && typeof updateActiveNav === 'function') {
        updateActiveNav('chrono');
    }

    // 2. Chargement des données si nécessaire
    if (!window.timelineData) {
        try {
            const response = await fetch('data/anecdotes.json');
            let data = await response.json();
            data.sort((a, b) => (a.annee === b.annee ? a.id - b.id : a.annee - b.annee));
            window.timelineData = data;
        } catch(e) { console.error(e); return; }
    }

    const index = window.timelineData.findIndex(f => f.id === id);
    const item = window.timelineData[index];
    if(!item) { renderChrono(); return; }

    const prevItem = window.timelineData[index - 1];
    const nextItem = window.timelineData[index + 1];

    // Marquer comme lu
    let lus = JSON.parse(localStorage.getItem("massalia_lus")) || [];
    if (!lus.includes(item.id)) {
        lus.push(item.id);
        localStorage.setItem("massalia_lus", JSON.stringify(lus));
    }

    // 3. Configuration du Bouton Retour
    let backBtnText = "REVENIR À LA FRISE";
    let backBtnAction = "renderChrono()";

    if (source === 'enregistrement') {
        backBtnText = "RETOUR AU COFFRE";
        backBtnAction = "loadSection('enregistrement')";
    } else if (source === 'accueil') {
        backBtnText = "RETOUR ACCUEIL";
        backBtnAction = "loadSection('accueil')";
    }

    // 4. RENDU HTML
    const app = document.getElementById('app');
    const imageHtml = item.image ? `<div class="card-image-container"><img src="${item.image}" class="card-image"></div>` : '';
    
    // Favori
    const saved = JSON.parse(localStorage.getItem('massalia_saved_fragments')) || [];
    const heartIcon = saved.includes(item.id) ? "❤️" : "🤍";
    const heartOpacity = saved.includes(item.id) ? "1" : "0.6";

    // Choix de l'animation selon le Swipe
    let animClass = "fade-in";
    if (direction === 'next') animClass = "slide-in-right";
    if (direction === 'prev') animClass = "slide-in-left";

    app.innerHTML = `
        <div id="fragment-container" class="codex-card ${animClass}" style="margin-top:20px; min-height:80vh;">
            
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                <div class="date-badge" style="margin:0;">${item.date}</div>
                
                <button id="fav-btn-${item.id}" onclick="toggleSaveFragment(${item.id}, this)" 
                        style="background:none; border:none; font-size:1.5rem; cursor:pointer; transition:transform 0.2s; opacity:${heartOpacity};"
                        onmousedown="this.style.transform='scale(1.2)'" 
                        onmouseup="this.style.transform='scale(1)'">
                    ${heartIcon}
                </button>
            </div>

            ${imageHtml}
            
            <h2 class="titre-page" style="text-align:left; border:none; margin-bottom:10px;">${item.titre}</h2>
            
            <div class="texte-courant" style="margin-bottom:20px;">
                ${item.texte}
            </div>
            
            <div class="info-box" style="border-left:4px solid var(--or); border-right:none; border-top:none; border-bottom:none;">
                <h3 class="info-title" style="margin-bottom:5px;">💡 Le Saviez-vous ?</h3>
                <span style="font-style:italic; color:#555; font-size:0.9rem;">${item.leSaviezVous || "..."}</span>
            </div>

            ${item.source ? `<div class="text-muted" style="text-align:right; margin-top:10px;">Source : ${item.source}</div>` : ''}
            
            <div class="nav-between-fragments">
                <div style="flex:1; text-align:left;">
                ${prevItem ? 
                    `<div onclick="showSpecificFragment(${prevItem.id}, '${source}', 'prev')" class="nav-link text-left">
                        <span>⬅️ Précédent</span>
                     </div>` 
                    : ''}
                </div>

                <div style="flex:1; text-align:right;">
                ${nextItem ? 
                    `<div onclick="showSpecificFragment(${nextItem.id}, '${source}', 'next')" class="nav-link text-right">
                        <span>Suivant ➡️</span>
                     </div>` 
                    : ''}
                </div>
            </div>

            <button class="btn-primary" onclick="${backBtnAction}" style="margin-top:25px; width:100%;">
                ${backBtnText}
            </button>
        </div>
    `;
    
    // Remonter en haut de la page
    window.scrollTo(0,0);

    // 5. ACTIVER LE SWIPE
    // C'est ici que la magie opère !
    const container = document.getElementById('fragment-container');
    if(container) {
        initSwipeDetection(container, prevItem, nextItem, source);
    }
}

// --- LOGIQUE DE SWIPE (Détection Tactile) ---
function initSwipeDetection(element, prevItem, nextItem, source) {
    let touchstartX = 0;
    let touchstartY = 0;
    let touchendX = 0;
    let touchendY = 0;

    element.addEventListener('touchstart', function(event) {
        touchstartX = event.changedTouches[0].screenX;
        touchstartY = event.changedTouches[0].screenY;
    }, {passive: false});

    element.addEventListener('touchend', function(event) {
        touchendX = event.changedTouches[0].screenX;
        touchendY = event.changedTouches[0].screenY;
        handleGesture();
    }, {passive: false});

    function handleGesture() {
        const xDiff = touchendX - touchstartX;
        const yDiff = touchendY - touchstartY;

        // Seuil de 50px pour valider le swipe
        if (Math.abs(xDiff) > 50) {
            
            // Si le mouvement est surtout vertical, on annule (c'est un scroll)
            if (Math.abs(yDiff) > Math.abs(xDiff)) return;

            // Swipe vers la Gauche (Suivant)
            if (xDiff < 0) {
                if (nextItem) showSpecificFragment(nextItem.id, source, 'next');
            }
            
            // Swipe vers la Droite (Précédent)
            if (xDiff > 0) {
                if (prevItem) showSpecificFragment(prevItem.id, source, 'prev');
            }
        }
    }
}

// --- GESTION FAVORIS (Helper) ---
window.toggleSaveFragment = function(id, btnElement) {
    let saved = JSON.parse(localStorage.getItem('massalia_saved_fragments')) || [];
    
    if (saved.includes(id)) {
        saved = saved.filter(itemId => itemId !== id);
        if(btnElement) {
            btnElement.innerHTML = "🤍";
            btnElement.style.opacity = "0.6";
        }
        if(typeof showToast === 'function') showToast("Retiré des favoris");
    } else {
        saved.push(id);
        if(btnElement) {
            btnElement.innerHTML = "❤️";
            btnElement.style.opacity = "1";
            btnElement.animate([
                { transform: 'scale(1)' },
                { transform: 'scale(1.4)' },
                { transform: 'scale(1)' }
            ], { duration: 300 });
        }
        if(typeof showToast === 'function') showToast("Ajouté aux favoris !");
    }
    localStorage.setItem('massalia_saved_fragments', JSON.stringify(saved));
};