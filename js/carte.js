/**
 * CARTE INTERACTIVE (Chargement JSON + Mode Admiration)
 */

const MAP_URL = "assets/img/carte.jpg"; 
let RIDDLES = []; // On initialise vide, ce sera rempli par le JSON

let currentRiddleIndex = 0;
let isGameFinished = false;

// Variables Vue
let scale = 2.5; 
let pointX = 0;
let pointY = 0;
let isDragging = false;
let startX = 0, startY = 0;

// FONCTION ASYNCHRONE POUR CHARGER LE JSON
async function loadCarte() {
    const app = document.getElementById('app');

    // 1. CHARGEMENT DES DONNÉES (JSON)
    try {
        const response = await fetch('data/lieux.json');
        RIDDLES = await response.json();
    } catch (e) {
        console.error("Impossible de charger les énigmes :", e);
        app.innerHTML = "<div style='color:white; text-align:center; padding-top:50px;'>Erreur de chargement des données de la carte.</div>";
        return;
    }
    
    // 2. LOGIQUE DE JEU
    const savedIndex = localStorage.getItem('massalia_map_progress');
    currentRiddleIndex = savedIndex ? parseInt(savedIndex) : 0;

    // Vérification : est-ce que le jeu est fini ?
    isGameFinished = (currentRiddleIndex >= RIDDLES.length);

    let riddleBoxContent = "";

    if (isGameFinished) {
        // Mode "Admiration"
        riddleBoxContent = `
            <div class="riddle-text" style="color:#27ae60;">👑 CARTE COMPLÉTÉE</div>
            <div class="riddle-hint">Vous connaissez tous les secrets. Profitez de la vue !</div>
            <button onclick="resetCarteProgress()" style="margin-top:10px; font-size:0.7rem; padding:5px 10px; background:#eee; border:none; border-radius:4px;">Recommencer l'aventure</button>
        `;
    } else {
        // Mode "Jeu"
        const riddle = RIDDLES[currentRiddleIndex];
        riddleBoxContent = `
            <div class="riddle-text">"${riddle.question}"</div>
            <div class="riddle-hint">💡 Indice : ${riddle.hint}</div>
        `;
    }

    // Reset du zoom pour l'affichage initial
    scale = 2.5; 
    
    // 3. AFFICHAGE HTML
    app.innerHTML = `
        <div class="map-viewport" id="map-viewport">
            <button class="btn-retour-map" onclick="loadSection('epreuves')">⬅ Retour</button>
            
            <div class="zoom-controls">
                <div class="btn-zoom" onclick="zoomMap(0.5)">+</div>
                <div class="btn-zoom" onclick="zoomMap(-0.5)">-</div>
            </div>

            <div class="map-layer" id="map-layer">
                <img src="${MAP_URL}" class="map-image" id="map-img-element">
            </div>

            <div class="riddle-box">
                ${riddleBoxContent}
            </div>

            <div id="map-feedback" class="feedback-overlay"></div>
        </div>
    `;

    initMapInteractions();
    
    // Chargement image et centrage
    const img = document.getElementById('map-img-element');
    if (img.complete) initMapPosition();
    else img.onload = initMapPosition;
}

// --- CENTRAGE (Inchangé) ---
function initMapPosition() {
    const viewport = document.getElementById('map-viewport');
    const img = document.getElementById('map-img-element');
    if(!viewport || !img) return;

    pointX = (viewport.offsetWidth - (img.offsetWidth * scale)) / 2;
    pointY = (viewport.offsetHeight - (img.offsetHeight * scale)) / 2;
    
    checkBoundaries();
    updateTransform();
}

// --- INTERACTIONS (Inchangé) ---
function initMapInteractions() {
    const viewport = document.getElementById('map-viewport');
    viewport.addEventListener('mousedown', startDrag);
    viewport.addEventListener('touchstart', startDrag, {passive: false});
    viewport.addEventListener('mousemove', onDrag);
    viewport.addEventListener('touchmove', onDrag, {passive: false});
    viewport.addEventListener('mouseup', endDrag);
    viewport.addEventListener('touchend', endDrag);
}

function startDrag(e) {
    if (e.target.closest('.btn-zoom') || e.target.closest('.btn-retour-map')) return;
    if (e.target.tagName === 'BUTTON') return; // Pour le bouton reset

    e.preventDefault(); 
    isDragging = false;
    this.isDown = true;
    
    if(e.type === 'touchstart') {
        startX = e.touches[0].clientX - pointX;
        startY = e.touches[0].clientY - pointY;
    } else {
        startX = e.clientX - pointX;
        startY = e.clientY - pointY;
    }
}

function onDrag(e) {
    if (!this.isDown) return;
    e.preventDefault();

    let x, y;
    if(e.type === 'touchmove') {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
    } else {
        x = e.clientX;
        y = e.clientY;
    }

    const newX = x - startX;
    const newY = y - startY;

    if (Math.abs(newX - pointX) > 5 || Math.abs(newY - pointY) > 5) isDragging = true;

    pointX = newX;
    pointY = newY;

    checkBoundaries();
    updateTransform();
}

function endDrag(e) {
    this.isDown = false;
    if (!isDragging) handleMapClick(e);
}

function zoomMap(delta) {
    const oldScale = scale;
    const newScale = scale + delta;
    
    if (newScale >= 1 && newScale <= 5) { 
        const viewport = document.getElementById('map-viewport');
        const cx = viewport.offsetWidth / 2;
        const cy = viewport.offsetHeight / 2;

        pointX = cx - (cx - pointX) * (newScale / oldScale);
        pointY = cy - (cy - pointY) * (newScale / oldScale);

        scale = newScale;
        checkBoundaries();
        updateTransform();
    }
}

function checkBoundaries() {
    const viewport = document.getElementById('map-viewport');
    const img = document.getElementById('map-img-element');
    if(!viewport || !img) return;

    const vW = viewport.offsetWidth;
    const vH = viewport.offsetHeight;
    const iW = img.offsetWidth * scale;
    const iH = img.offsetHeight * scale;

    const minX = vW - iW;
    const maxX = 0;
    const minY = vH - iH;
    const maxY = 0;

    if (iW > vW) {
        if (pointX > maxX) pointX = maxX;
        if (pointX < minX) pointX = minX;
    } else {
        pointX = (vW - iW) / 2;
    }

    if (iH > vH) {
        if (pointY > maxY) pointY = maxY;
        if (pointY < minY) pointY = minY;
    } else {
        pointY = (vH - iH) / 2;
    }
}

function updateTransform() {
    const layer = document.getElementById('map-layer');
    if(layer) layer.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
}

// --- VALIDATION ---
function handleMapClick(e) {
    // Si le jeu est fini, on ne fait rien (Admiration)
    if (isGameFinished) return;

    if (e.target.closest('button') || e.target.closest('.btn-zoom') || e.target.closest('.riddle-box')) return;

    const img = document.getElementById('map-img-element');
    // Sécurité au cas où l'image n'est pas encore là
    if (!img) return;

    const rect = img.getBoundingClientRect(); 
    
    let clientX, clientY;
    if(e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    const xPixelInImage = (clientX - rect.left);
    const yPixelInImage = (clientY - rect.top);
    
    const xPercent = (xPixelInImage / rect.width) * 100;
    const yPercent = (yPixelInImage / rect.height) * 100;

    console.log(`📍 X: ${Math.round(xPercent)}%, Y: ${Math.round(yPercent)}%`);

    const marker = document.createElement('div');
    marker.classList.add('click-marker');
    marker.style.left = clientX + 'px';
    marker.style.top = clientY + 'px';
    document.body.appendChild(marker);
    setTimeout(() => marker.remove(), 600);

    // On s'assure que RIDDLES est chargé
    if (!RIDDLES || RIDDLES.length === 0) return;

    const target = RIDDLES[currentRiddleIndex];
    const tolerance = target.radius + (3 / scale); 
    const dist = Math.sqrt(Math.pow(xPercent - target.x, 2) + Math.pow(yPercent - target.y, 2));

    if (dist <= tolerance) showFeedback(true, target);
    else showFeedback(false);
}

function showFeedback(success, data) {
    const overlay = document.getElementById('map-feedback');
    if (success) {
        overlay.innerHTML = `<div style="text-align:center; padding:20px;"><div style="color:#2ecc71; font-size:4rem;">✅</div><div style="font-size:1.2rem; font-weight:bold; color:white;">TROUVÉ !</div><div style="font-size:0.9rem; margin:15px 0; color:#ddd;">${data.anecdote}</div><div class="date-badge">+${data.reward} OBOLES</div></div>`;
        overlay.style.background = "rgba(0,0,0,0.9)";
        overlay.classList.add('visible');
        
        let total = parseInt(localStorage.getItem('massalia_global_score')) || 0;
        localStorage.setItem('massalia_global_score', total + data.reward);
        
        setTimeout(() => {
            currentRiddleIndex++;
            localStorage.setItem('massalia_map_progress', currentRiddleIndex);
            loadCarte();
        }, 3000);
    } else {
        const marker = document.querySelector('.click-marker');
        if(marker) marker.style.borderColor = "#e74c3c";
    }
}

function resetCarteProgress() {
    if(confirm("Voulez-vous vraiment effacer votre progression sur la carte ?")) {
        localStorage.removeItem('massalia_map_progress');
        loadCarte();
    }
}