/**
 * GESTION DES ENREGISTREMENTS (Corrections)
 */

async function openEnregistrementModal() {
    const modal = document.getElementById('enregistrement-modal');
    const content = document.getElementById('enregistrement-content');
    if(!modal || !content) return;

    content.innerHTML = "<div class='loader'>Ouverture du coffre...</div>";
    modal.style.display = 'flex';

    const savedRecettesIds = JSON.parse(localStorage.getItem('massalia_saved_recettes')) || [];
    const savedFragIds = JSON.parse(localStorage.getItem('massalia_saved_fragments')) || [];

    try {
        const [recettesResp, anecdotesResp] = await Promise.all([
            fetch('data/recettes.json'),
            fetch('data/anecdotes.json')
        ]);
        const allRecettes = await recettesResp.json();
        const allAnecdotes = await anecdotesResp.json();

        const myRecettes = allRecettes.filter(r => savedRecettesIds.includes(r.id));
        const myFragments = allAnecdotes.filter(f => savedFragIds.includes(f.id));

        // Emoji Chevron (›) à la place du doigt
        const arrowIcon = `<span style="font-size:1.5rem; color:#ccc; line-height:1;">›</span>`;

        let recettesHtml = myRecettes.length ? myRecettes.map(r => `
            <div class="codex-card clickable" onclick="closeEnregistrementModal(); openRecetteModalFromId(${r.id})" style="margin-bottom:10px; padding:15px; border-left:4px solid #e74c3c;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="font-size:1.2rem;">🥘</div>
                        <div style="font-weight:bold; color:#c0392b;">${r.titre}</div>
                    </div>
                    <div>${arrowIcon}</div>
                </div>
            </div>
        `).join('') : `<div class="text-muted" style="text-align:center;">Vide.</div>`;

        let fragmentsHtml = myFragments.length ? myFragments.map(f => `
            <div class="codex-card clickable" onclick="closeEnregistrementModal(); showSpecificFragment(${f.id}, 'enregistrement')" style="margin-bottom:10px; padding:15px; border-left:4px solid var(--or);">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-weight:bold; color:var(--abysse);">${f.titre}</div>
                    <div>${arrowIcon}</div>
                </div>
            </div>
        `).join('') : `<div class="text-muted" style="text-align:center;">Vide.</div>`;

        // AJOUT DE LA CLASSE modal-body et modification du bouton RETOUR
        content.innerHTML = `
            <div class="modal-body">
                <h2 class="titre-page" style="margin-top:10px;">MON COFFRE</h2>
                
                <h3 class="titre-card" style="color:#c0392b; margin-top:20px;">🥘 MES RECETTES</h3>
                ${recettesHtml}

                <h3 class="titre-card" style="color:var(--or); margin-top:30px;">📜 MES ARCHIVES</h3>
                ${fragmentsHtml}

                <button class="btn-secondary" onclick="closeEnregistrementModal(); toggleProfilModal();" style="margin-top:30px; margin-bottom:10px;">
                    ⬅️ RETOUR PROFIL
                </button>
            </div>
        `;
    } catch (e) {
        content.innerHTML = "<div class='modal-body'><p class='text-muted'>Erreur de chargement.</p></div>";
    }
}

function closeEnregistrementModal() {
    const modal = document.getElementById('enregistrement-modal');
    if(modal) modal.style.display = 'none';
}

function toggleEnregistrementModal() {
    const modal = document.getElementById('enregistrement-modal');
    if(modal.style.display === 'flex') closeEnregistrementModal();
    else openEnregistrementModal();
}

async function openRecetteModalFromId(id) {
    try {
        const resp = await fetch('data/recettes.json');
        const data = await resp.json();
        const r = data.find(item => item.id === id);
        if(r && typeof openRecetteModal === 'function') openRecetteModal(r);
    } catch(e) {}
}