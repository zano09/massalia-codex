/**
 * GESTION DE LA CHRONOLOGIE
 * Version Finale Corrigée : Swipe, Pagination, Design Livre & Fix Favoris
 */

let timelineData = null; 
let itemsToShow = 20;    

// ============================================================
// 1. VUE LISTE (CHRONOLOGIE)
// ============================================================
async function renderChrono() {
    const mainContainer = document.getElementById('app');
    
    // Réaffichage des interfaces globales (Header + Nav)
    const header = document.getElementById('main-header');
    if(header) header.style.display = 'flex'; 
    
    const bottomNav = document.querySelector('nav'); 
    if(bottomNav) bottomNav.style.display = 'flex';
    
    itemsToShow = 20; 
    window.scrollTo(0,0);

    mainContainer.innerHTML = "<div class='loader'>Déchiffrement des archives...</div>";

    try {
        if (!timelineData) {
            const response = await fetch('data/anecdotes.json');
            let data = await response.json();
            data.sort((a, b) => (a.annee === b.annee ? a.id - b.id : a.annee - b.annee));
            timelineData = data;
        }

        const lus = JSON.parse(localStorage.getItem("massalia_lus")) || [];
        const categories = [...new Set(timelineData.map(item => item.categorie))];

        mainContainer.innerHTML = `
            <div class="fade-in">
                <h2 class="titre-page" style="margin-top:20px;">CHRONOLOGIE</h2>
                
                <div class="codex-card" style="background:var(--creme-leger); padding:15px; position:sticky; top:10px; z-index:90; margin-bottom:20px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    <div style="display:flex; gap:10px; flex-wrap:wrap;">
                        <input type="text" id="searchInput" placeholder="🔍 Rechercher..." onkeyup="resetAndFilter()" class="input-standard" style="flex:1; min-width:150px;">
                        <select id="filterSelect" onchange="resetAndFilter()" class="select-standard" style="flex:1; min-width:120px;">
                            <option value="tous">Tout montrer</option>
                            <option value="non-lu">📖 À découvrir</option>
                            <option value="lu">✅ Déjà lus</option>
                            <optgroup label="Thèmes">
                                ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                            </optgroup>
                        </select>
                    </div>
                    <div class="text-muted" style="text-align:right; font-size:0.75rem; margin-top:8px;">
                        ${lus.length} / ${timelineData.length} fragments découverts
                    </div>
                </div>

                <div id="timelineContainer" class="timeline-wrapper"></div>
                <div id="loadMoreBtn" style="text-align:center; margin: 30px 0; display:none;">
                    <button class="btn-secondary" onclick="loadMoreItems()" style="width:100%;">📜 Dérouler le parchemin...</button>
                </div>
            </div>`;
        
        filterTimeline(); 

    } catch (error) {
        console.error(error);
        mainContainer.innerHTML = "<div class='codex-card' style='text-align:center; color:var(--rouge);'>Erreur de chargement.</div>";
    }
}

function resetAndFilter() { itemsToShow = 20; filterTimeline(); }
window.loadMoreItems = function() { itemsToShow += 20; filterTimeline(); };

function filterTimeline() {
    const queryInput = document.getElementById('searchInput');
    if (!queryInput) return; 
    const query = queryInput.value.toLowerCase();
    const filterValue = document.getElementById('filterSelect').value;
    const container = document.getElementById('timelineContainer');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const lus = JSON.parse(localStorage.getItem("massalia_lus")) || [];
    if(!timelineData) return;

    const filtered = timelineData.filter(item => {
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
        container.innerHTML = "<div class='text-muted' style='text-align:center; padding:30px;'>Aucun résultat.</div>";
        loadMoreBtn.style.display = 'none';
        return;
    }

    const hasMore = filtered.length > itemsToShow;
    const visibleItems = filtered.slice(0, itemsToShow);
    loadMoreBtn.style.display = hasMore ? 'block' : 'none';

    let lastCentury = null;
    let htmlContent = "";

    visibleItems.forEach(item => {
        let century = "";
        if (item.annee < -476) century = "ANTIQUITÉ";
        else if (item.annee < 500) century = "ANTIQUITÉ TARDIVE";
        else if (item.annee < 1492) century = "MOYEN ÂGE";
        else if (item.annee < 1789) century = "TEMPS MODERNES";
        else century = Math.ceil(item.annee / 100) + "ème SIÈCLE";

        if (century !== lastCentury) {
            htmlContent += `<div class="era-separator fade-in"><span>${century}</span></div>`;
            lastCentury = century;
        }

        const isLu = lus.includes(item.id);
        const statusClass = isLu ? "fragment-lu" : "fragment-new";
        const icon = isLu ? "✅" : "📜";

        htmlContent += `
            <div class="timeline-event fade-in" onclick="showSpecificFragment(${item.id})">
                <div class="timeline-dot"></div>
                <div class="timeline-card ${statusClass}">
                    <div class="timeline-date">${item.date}</div>
                    <h3 class="timeline-title">${item.titre}</h3>
                    <div class="timeline-status">${icon}</div>
                </div>
            </div>
        `;
    });
    container.innerHTML = htmlContent;
}


// ============================================================
// 2. VUE FRAGMENT (DÉTAIL IMMERSIF)
// ============================================================
window.showSpecificFragment = async function(id, source = 'chrono', direction = 'none') {
    
    // Immersion : On cache Header et Menu
    const header = document.getElementById('main-header');
    if(header) header.style.display = 'none';
    const bottomNav = document.querySelector('nav');
    if(bottomNav) bottomNav.style.display = 'none';

    if(source === 'chrono' && typeof updateActiveNav === 'function') updateActiveNav('chrono');

    if (!timelineData) {
        try {
            const response = await fetch('data/anecdotes.json');
            let data = await response.json();
            data.sort((a, b) => (a.annee === b.annee ? a.id - b.id : a.annee - b.annee));
            timelineData = data;
        } catch(e) { console.error(e); return; }
    }

    const index = timelineData.findIndex(f => String(f.id) === String(id));
    const item = timelineData[index];
    if(!item) { renderChrono(); return; }

    const prevItem = timelineData[index - 1];
    const nextItem = timelineData[index + 1];

    let lus = JSON.parse(localStorage.getItem("massalia_lus")) || [];
    if (!lus.includes(item.id)) { lus.push(item.id); localStorage.setItem("massalia_lus", JSON.stringify(lus)); }

    let backBtnText = "REVENIR À LA FRISE";
    let backBtnAction = "renderChrono()"; 
    if (source === 'enregistrement') { backBtnText = "RETOUR AU COFFRE"; backBtnAction = "loadSection('enregistrement')"; }
    else if (source === 'accueil') { backBtnText = "RETOUR ACCUEIL"; backBtnAction = "loadSection('accueil')"; }

    const bookSideClass = (index % 2 === 0) ? "page-left" : "page-right";

    let animClass = "fade-in";
    if (direction === 'next') animClass = "slide-in-right";
    if (direction === 'prev') animClass = "slide-in-left";

    const imageHtml = item.image ? `<div class="card-image-container"><img src="${item.image}" class="card-image"></div>` : '<div style="height:20px;"></div>';
    
    // GESTION INITIALE FAVORIS
    const saved = JSON.parse(localStorage.getItem('massalia_saved_fragments')) || [];
    const isFav = saved.map(String).includes(String(item.id));
    const heartIcon = isFav ? "❤️" : "🤍";
    const heartColor = isFav ? "#e74c3c" : "#666";
    const heartOpacity = isFav ? "1" : "0.5";

    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div id="fragment-container" class="fragment-page ${animClass} ${bookSideClass}">
            
            <button onclick="${backBtnAction}" style="background:none; border:none; color:#666; font-size:0.8rem; margin-bottom:10px; cursor:pointer; display:flex; align-items:center; gap:5px;">
                ⬅ Retour
            </button>

            ${imageHtml}
            
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <div class="date-badge" style="margin:0; background:var(--abysse); color:white;">${item.date}</div>
                
                <button id="btn-fav-main" 
                        onclick="toggleSaveFragment('${item.id}')" 
                        style="background:none; border:none; font-size:2.2rem; cursor:pointer; color:${heartColor}; opacity:${heartOpacity}; transition: transform 0.2s;">
                    ${heartIcon}
                </button>
            </div>

            <h2 class="titre-page" style="text-align:left; border:none; margin:10px 0 20px 0; font-size:1.8rem; line-height:1.2;">
                ${item.titre}
            </h2>
            
            <div class="texte-courant" style="margin-bottom:30px; font-size:1.1rem; line-height:1.8; color:#2c3e50;">
                ${item.texte}
            </div>
            
            <div class="info-box" style="border-left:4px solid var(--or); background: rgba(241, 196, 15, 0.1); padding:15px; border-radius:0 10px 10px 0;">
                <h3 class="info-title" style="margin-bottom:8px; font-size:1rem; color:var(--abysse);">💡 Le Saviez-vous ?</h3>
                <span style="font-style:italic; color:#444; font-size:0.95rem;">${item.leSaviezVous || "..."}</span>
            </div>

            ${item.source ? `<div class="text-muted" style="text-align:right; margin-top:15px; font-size:0.8rem;">Source : ${item.source}</div>` : ''}
            
            <div class="nav-between-fragments" style="margin-top:40px; border-top:1px solid #ddd; padding-top:20px; display:flex; justify-content:space-between;">
                <div style="flex:1; text-align:left;">
                ${prevItem ? 
                    `<div onclick="showSpecificFragment(${prevItem.id}, '${source}', 'prev')" class="nav-link" style="cursor:pointer; padding:10px 0;">
                        <span style="font-size:1.5rem;">⬅️</span><br>
                        <span style="font-size:0.7rem; color:#888; font-weight:bold; letter-spacing:1px;">PRÉCÉDENT</span>
                     </div>` : ''}
                </div>
                <div style="flex:1; text-align:right;">
                ${nextItem ? 
                    `<div onclick="showSpecificFragment(${nextItem.id}, '${source}', 'next')" class="nav-link" style="cursor:pointer; padding:10px 0;">
                        <span style="font-size:1.5rem;">➡️</span><br>
                        <span style="font-size:0.7rem; color:#888; font-weight:bold; letter-spacing:1px;">SUIVANT</span>
                     </div>` : ''}
                </div>
            </div>

            <button class="btn-primary" onclick="${backBtnAction}" style="margin-top:30px; width:100%; background:var(--abysse); border:none;">
                ${backBtnText}
            </button>
        </div>
    `;

    window.scrollTo(0,0);
    const container = document.getElementById('fragment-container');
    if(container) initSwipeDetection(container, prevItem, nextItem, source);
}

// ============================================================
// 3. FONCTIONS UTILITAIRES
// ============================================================

function initSwipeDetection(element, prevItem, nextItem, source) {
    let touchstartX = 0; let touchstartY = 0; let touchendX = 0; let touchendY = 0;
    element.addEventListener('touchstart', e => { touchstartX = e.changedTouches[0].screenX; touchstartY = e.changedTouches[0].screenY; }, {passive: false});
    element.addEventListener('touchend', e => { touchendX = e.changedTouches[0].screenX; touchendY = e.changedTouches[0].screenY; handleGesture(); }, {passive: false});
    function handleGesture() {
        const xDiff = touchendX - touchstartX; const yDiff = touchendY - touchstartY;
        if (Math.abs(xDiff) > 50) {
            if (Math.abs(yDiff) > Math.abs(xDiff)) return;
            if (xDiff < 0 && nextItem) showSpecificFragment(nextItem.id, source, 'next');
            if (xDiff > 0 && prevItem) showSpecificFragment(prevItem.id, source, 'prev');
        }
    }
}

// --- GESTION DES FAVORIS (VERSION SAUVETAGE) ---
// On attache la fonction à window pour être sûr qu'elle soit globale
window.toggleSaveFragment = function(id, btn) {
    console.log("Clic favori sur l'ID:", id); // Pour vérifier dans la console F12

    // 1. Force l'ID en texte pour une comparaison parfaite
    const stringId = String(id);
    
    // 2. Récupération propre du tableau
    let saved = [];
    try {
        const localData = localStorage.getItem('massalia_saved_fragments');
        saved = localData ? JSON.parse(localData).map(String) : [];
    } catch (e) {
        console.error("Erreur lecture localStorage", e);
        saved = [];
    }

    const isFav = saved.includes(stringId);

    if (isFav) {
        // --- ACTION : RETIRER ---
        saved = saved.filter(itemId => itemId !== stringId);
        
        // Mise à jour visuelle immédiate
        if (btn) {
            btn.innerHTML = "🤍";
            btn.style.color = "#666";
            btn.style.opacity = "0.5";
        }
    } else {
        // --- ACTION : AJOUTER ---
        saved.push(stringId);
        
        // Mise à jour visuelle immédiate
        if (btn) {
            btn.innerHTML = "❤️";
            btn.style.color = "#e74c3c"; // Force le ROUGE
            btn.style.opacity = "1";
            
            // Animation Pop
            btn.animate([
                { transform: 'scale(1)' },
                { transform: 'scale(1.4)' },
                { transform: 'scale(1)' }
            ], { duration: 250 });
        }
    }

    // 3. Sauvegarde
    localStorage.setItem('massalia_saved_fragments', JSON.stringify(saved));
    
    // Notification si ta fonction existe
    if(typeof showToast === 'function') {
        showToast(isFav ? "Retiré des favoris" : "Ajouté aux favoris !");
    }
};