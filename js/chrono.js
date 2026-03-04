/**
 * GESTION DE LA CHRONOLOGIE (Version Robuste & Corrigée)
 */

async function renderChrono() {
    const mainContainer = document.getElementById('app');
    mainContainer.innerHTML = "<div class='loader'>Déchiffrement des archives...</div>";

    try {
        // Chargement des données si pas encore en mémoire
        if (!window.timelineData) {
            const response = await fetch('data/anecdotes.json');
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

// FILTRAGE
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

// AFFICHER UN FRAGMENT (Avec gestion du bouton Retour dynamique)
window.showSpecificFragment = async function(id, source = 'chrono') {
    // 1. Gestion du Header & Nav
    const header = document.getElementById('main-header');
    if(header) header.style.display = 'none';
    
    // Si on vient de la frise, on allume l'icône Chrono, sinon on laisse tel quel
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

    // 3. DÉFINITION DU BOUTON RETOUR (La solution à ton problème)
    let backBtnText = "REVENIR À LA FRISE";
    let backBtnAction = "renderChrono()";

    if (source === 'enregistrement') {
        backBtnText = "RETOUR AU COFFRE";
        backBtnAction = "loadSection('enregistrement')";
    } else if (source === 'accueil') {
        backBtnText = "RETOUR ACCUEIL";
        backBtnAction = "loadSection('accueil')";
    }

    // 4. RENDU
    const app = document.getElementById('app');
    const imageHtml = item.image ? `<div class="card-image-container"><img src="${item.image}" class="card-image"></div>` : '';
    
    // Vérif favori
    const saved = JSON.parse(localStorage.getItem('massalia_saved_fragments')) || [];
    const heartIcon = saved.includes(item.id) ? "❤️" : "🤍";
    const heartOpacity = saved.includes(item.id) ? "1" : "0.6";

    app.innerHTML = `
        <div class="codex-card fade-in" style="margin-top:20px;">
            
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                <div class="date-badge" style="margin:0;">${item.date}</div>
                
                <button id="fav-btn-${item.id}" onclick="toggleSaveFragment(${item.id})" 
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
                ${prevItem ? 
                    `<div onclick="showSpecificFragment(${prevItem.id}, '${source}')" class="nav-link text-left">
                        <span>⬅️ Précédent</span><br>
                        <strong>${prevItem.titre}</strong>
                     </div>` 
                    : '<div></div>'}

                ${nextItem ? 
                    `<div onclick="showSpecificFragment(${nextItem.id}, '${source}')" class="nav-link text-right">
                        <span>Suivant ➡️</span><br>
                        <strong>${nextItem.titre}</strong>
                     </div>` 
                    : '<div></div>'}
            </div>

            <button class="btn-primary" onclick="${backBtnAction}" style="margin-top:25px;">
                ${backBtnText}
            </button>
        </div>
    `;
    window.scrollTo(0,0);
}