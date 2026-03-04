/**
 * PAGE D'ACCUEIL (Version Clean & Design System)
 */

async function renderAccueil() {
    const mainContainer = document.getElementById('app');
    
    try {
        const [anecdotesResp, recettesResp] = await Promise.all([
            fetch('data/anecdotes.json'),
            fetch('data/recettes.json')
        ]);

        const anecdotesData = await anecdotesResp.json();
        const recettesData = await recettesResp.json();
        const lus = JSON.parse(localStorage.getItem("massalia_lus")) || [];
        
        // Calcul du jour
        const today = new Date();
        const dayIndex = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
        const anecdoteIndex = (dayIndex * 13) % anecdotesData.length;
        const recetteIndex = (dayIndex * 7) % recettesData.length;

        const dailyAnecdote = anecdotesData[anecdoteIndex];
        const dailyRecette = recettesData[recetteIndex];
        
        let prog = { currentRank: { title: "Négociant", icon: "🏺" } };
        try { if(typeof getProgression === "function") prog = getProgression(); } catch(e){}

        window.currentDailyRecette = dailyRecette;

        mainContainer.innerHTML = `
            <div class="codex-card clickable" onclick="showSpecificFragment(${dailyAnecdote.id}, 'accueil');">
                <div class="card-badge bg-or">L'HISTOIRE DU JOUR</div>
                <h3 class="titre-card">${dailyAnecdote.titre.toUpperCase()}</h3>
                
                <div class="texte-courant text-clamp">
                    "${dailyAnecdote.texte}"
                </div>
                
                <div style="text-align:right;">
                    <span class="read-more-btn">LIRE LA SUITE →</span>
                </div>
            </div>

            <div class="codex-card clickable card-cuisine" onclick="openRecetteModal(window.currentDailyRecette)">
                <div class="card-badge bg-red">LA TABLE</div>
                
                <div class="card-header-flex">
                    <div style="font-size:2rem;">🥘</div>
                    <div>
                        <h3 class="titre-card" style="margin:0; color:#c0392b; border:none;">${dailyRecette.titre.toUpperCase()}</h3>
                        <div class="subtext-italic">${dailyRecette.date}</div>
                    </div>
                </div>
                
                ${dailyRecette.photo ? `<img src="${dailyRecette.photo}" class="recette-img-fix" onerror="this.style.display='none'">` : ''}

                <p class="texte-courant" style="margin-bottom:15px;">${dailyRecette.description}</p>
                
                <div class="btn-cuisine">
                    👨‍🍳 VOIR LA RECETTE
                </div>
            </div>

            <div class="home-grid">
                <div class="codex-card clickable mini-card" onclick="toggleProfilModal()">
                    <div class="mini-icon">👤</div>
                    <div class="mini-title">PROFIL</div>
                    <div class="mini-subtitle">${lus.length} Récits</div>
                </div>

                <div class="codex-card clickable mini-card" onclick="loadSection('parametres')">
                    <div class="mini-icon">⚙️</div>
                    <div class="mini-title">OPTIONS</div>
                    <div class="mini-subtitle">Réglages</div>
                </div>
            </div>
        `;
    } catch (e) {
        console.error("Erreur accueil:", e);
    }
}