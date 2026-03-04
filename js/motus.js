/**
 * MASSALIA MOTUS (Version Design System)
 */

let targetWord = ""; 
let definition = "";
let maxAttempts = 6;
let currentAttempt = 0;
let currentGuess = ""; 
let foundLetters = []; 
let gameOver = false;
let isAnimating = false; 
let letterStates = {}; 
let dictionary = new Set(); 
let motsMarseillais = {}; 
let todayStr = ""; 

async function loadMotus() {
    const mainContainer = document.getElementById('app');
    const now = new Date();
    todayStr = now.toISOString().split('T')[0];

    if (dictionary.size === 0) mainContainer.innerHTML = "<div class='loader'>Chargement du Mot du Jour...</div>";

    try {
        if (dictionary.size === 0) {
            const dictRes = await fetch('data/dictionnaire.json');
            if (dictRes.ok) dictionary = new Set(await dictRes.json());
        }
        if (Object.keys(motsMarseillais).length === 0) {
            const marsRes = await fetch('data/marseillais.json');
            if (marsRes.ok) motsMarseillais = await marsRes.json();
            else throw new Error("Fichier introuvable");
        }
    } catch (e) {
        motsMarseillais = { "GABIAN": "Un goéland." };
    }

    const marseillaisKeys = Object.keys(motsMarseillais);
    marseillaisKeys.forEach(mot => dictionary.add(mot));

    const dayIndex = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
    const wordIndex = (dayIndex * 42) % marseillaisKeys.length; 
    targetWord = marseillaisKeys[wordIndex];
    definition = motsMarseillais[targetWord];

    const savedState = JSON.parse(localStorage.getItem('massalia_motus_state_' + todayStr));

    if (savedState) {
        currentAttempt = savedState.currentAttempt;
        foundLetters = savedState.foundLetters;
        letterStates = savedState.letterStates;
        gameOver = savedState.gameOver;
        
        if (gameOver) {
            renderBlockedUI(mainContainer, savedState.win);
            return;
        }
        renderBaseUI(mainContainer);
        buildGrid();
        savedState.guesses.forEach((guess, index) => fillGridRow(index, guess, targetWord));
        currentGuess = savedState.currentGuess;
        buildKeyboard();
        updateGridVisual();
    } else {
        resetGameState();
        renderBaseUI(mainContainer);
        buildGrid();
        buildKeyboard();
        updateGridVisual();
    }
    setupEventListener();
}

function resetGameState() {
    currentAttempt = 0;
    currentGuess = targetWord[0]; 
    foundLetters = new Array(targetWord.length).fill(".");
    foundLetters[0] = targetWord[0]; 
    gameOver = false;
    isAnimating = false;
    letterStates = {};
}

function renderBaseUI(container) {
    container.innerHTML = `
        <div class="codex-card fade-in" style="text-align:center; padding: 15px 5px;">
            <div class="date-badge">DÉFI QUOTIDIEN</div>
            <h2 class="titre-page" style="border:none;">LE MOT DU JOUR</h2>
            
            <div id="motus-grid" style="display: flex; flex-direction: column; gap: 5px; align-items: center; margin-bottom: 10px;"></div>
            
            <div id="motus-toast" style="height: 20px; margin-bottom: 10px; color: #e74c3c; font-weight: bold; font-size: 0.85rem; opacity: 0; transition: opacity 0.3s;">
                Mot inconnu
            </div>
            
            <div id="motus-keyboard" style="width: 100%; max-width: 600px; margin: 0 auto;"></div>
            <div id="motus-result"></div>

            <button class="btn-secondary" onclick="loadSection('epreuves')" style="margin-top:15px;">
                RETOUR
            </button>
        </div>
    `;
}

function renderBlockedUI(container, win) {
    container.innerHTML = `
        <div class="codex-card fade-in" style="text-align:center; padding: 40px 20px;">
            <div style="font-size:3rem; margin-bottom:10px;">${win ? "🏆" : "⏳"}</div>
            <h2 class="titre-page" style="border:none;">${win ? "VICTOIRE !" : "DÉFI TERMINÉ"}</h2>
            
            <p class="texte-courant" style="text-align:center;">
                ${win ? "Vous avez trouvé le mot du jour." : "Le mot était : <strong>" + targetWord + "</strong>"}
                <br>Revenez demain.
            </p>

            <div class="info-box" style="display:inline-block; min-width:200px; text-align:center; background:var(--abysse); color:white; border:none;">
                <div style="font-size:0.7rem; margin-bottom:5px;">PROCHAIN MOT DANS</div>
                <div id="countdown-timer" style="font-family:var(--font-titre); font-size:1.5rem;">Calcul...</div>
            </div>

            <br>
            <button class="btn-primary" onclick="loadSection('epreuves')" style="margin-top:20px;">RETOUR</button>
        </div>
    `;
    startCountdown();
}

function startCountdown() {
    function update() {
        const timerElem = document.getElementById('countdown-timer');
        if(!timerElem) return;
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0); 
        const diff = midnight - now;
        
        if (diff <= 0) { loadMotus(); return; }
        
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        timerElem.innerText = `${h}h ${m < 10 ? '0'+m : m}m ${s < 10 ? '0'+s : s}s`;
    }
    update();
    setInterval(update, 1000);
}

function buildGrid() {
    const grid = document.getElementById('motus-grid');
    if(!grid) return;
    grid.innerHTML = ""; 
    for (let i = 0; i < maxAttempts; i++) {
        let row = document.createElement('div');
        row.className = "motus-row"; // Utilise le CSS ajouté
        for (let j = 0; j < targetWord.length; j++) {
            let cell = document.createElement('div');
            cell.id = `cell-${i}-${j}`;
            cell.className = "motus-cell"; // Utilise le CSS ajouté
            row.appendChild(cell);
        }
        grid.appendChild(row);
    }
}

function buildKeyboard() {
    const kb = document.getElementById('motus-keyboard');
    if(!kb) return;
    const rows = ["AZERTYUIOP".split(''), "QSDFGHJKLM".split(''), ["ENTRÉE", ..."WXCVBN".split(''), "⌫"]];
    
    kb.innerHTML = rows.map(row => `
        <div style="display:flex; justify-content:center; gap:3px; margin-bottom:5px; width:100%;">
            ${row.map(key => {
                let style = "background:#eee; color:#1a2a3a;";
                if (letterStates[key] === 'correct') style = "background:#e74c3c; color:white;"; 
                else if (letterStates[key] === 'present') style = "background:#f1c40f; color:white;"; 
                else if (letterStates[key] === 'absent') style = "background:#7f8c8d; color:white; opacity:0.6;"; 

                let flexVal = "1";
                let fontSize = "0.9rem";
                if (key === "ENTRÉE") { flexVal = "1.5"; fontSize = "0.7rem"; key = "VALIDER"; }
                else if (key === "⌫") { flexVal = "1.5"; }
                
                return `<button type="button" tabindex="-1" onclick="handleKey('${key === "VALIDER" ? "ENTRÉE" : key}')" 
                              style="flex:${flexVal}; height:48px; border-radius:4px; border:none; font-weight:bold; cursor:pointer; font-family:'Lora'; font-size:${fontSize}; padding:0; touch-action:manipulation; ${style}">
                              ${key}
                          </button>`;
            }).join('')}
        </div>
    `).join('');
}

function handleKey(key) {
    if (gameOver || isAnimating) return; 
    if (key === "ENTRÉE") submitWord();
    else if (key === "⌫") {
        if (currentGuess.length > 1) { currentGuess = currentGuess.slice(0, -1); updateGridVisual(); }
    } else if (currentGuess.length < targetWord.length && /^[A-Z]$/.test(key)) {
        currentGuess += key; updateGridVisual();
    }
}

function submitWord() {
    if (currentGuess.length !== targetWord.length) return;
    if (!dictionary.has(currentGuess)) {
        const row = document.getElementById(`cell-${currentAttempt}-0`).parentElement;
        row.classList.add('shake');
        setTimeout(() => row.classList.remove('shake'), 400);
        const toast = document.getElementById('motus-toast');
        toast.style.opacity = "1";
        setTimeout(() => toast.style.opacity = "0", 2000);
        return; 
    }
    processComparison(); 
}

async function processComparison() {
    isAnimating = true; 
    let guessArr = currentGuess.split('');
    let targetArr = targetWord.split('');
    let results = new Array(targetWord.length).fill('absent');

    for (let i = 0; i < targetWord.length; i++) {
        if (guessArr[i] === targetArr[i]) {
            results[i] = 'correct';
            letterStates[guessArr[i]] = 'correct';
            foundLetters[i] = guessArr[i];
            targetArr[i] = null;
            guessArr[i] = null;
        }
    }
    for (let i = 0; i < targetWord.length; i++) {
        if (guessArr[i]) {
            let idx = targetArr.indexOf(guessArr[i]);
            if (idx !== -1) {
                results[i] = 'present';
                if (letterStates[guessArr[i]] !== 'correct') letterStates[guessArr[i]] = 'present';
                targetArr[idx] = null;
            } else if (!letterStates[guessArr[i]]) letterStates[guessArr[i]] = 'absent';
        }
    }

    for (let i = 0; i < targetWord.length; i++) {
        const cell = document.getElementById(`cell-${currentAttempt}-${i}`);
        await new Promise(r => setTimeout(r, 250));
        if (results[i] === 'correct') { cell.style.background = "#e74c3c"; cell.style.borderColor = "#e74c3c"; }
        else if (results[i] === 'present') { cell.style.background = "#f1c40f"; cell.style.borderColor = "#f1c40f"; cell.style.borderRadius = "50%"; }
        else { cell.style.background = "#2c3e50"; cell.style.borderColor = "#2c3e50"; }
    }
    await new Promise(r => setTimeout(r, 300));

    let currentState = JSON.parse(localStorage.getItem('massalia_motus_state_' + todayStr)) || { guesses: [] };
    currentState.guesses.push(currentGuess);
    currentState.foundLetters = foundLetters;
    currentState.letterStates = letterStates;

    if (currentGuess === targetWord) {
        gameOver = true;
        currentState.gameOver = true;
        currentState.win = true;
        currentState.currentAttempt = currentAttempt;
        currentState.currentGuess = currentGuess;
        localStorage.setItem('massalia_motus_state_' + todayStr, JSON.stringify(currentState));
        finishGame(true);
    } else {
        currentAttempt++;
        currentState.currentAttempt = currentAttempt;
        if (currentAttempt >= maxAttempts) {
            gameOver = true;
            currentState.gameOver = true;
            currentState.win = false;
            currentState.currentGuess = currentGuess;
            localStorage.setItem('massalia_motus_state_' + todayStr, JSON.stringify(currentState));
            finishGame(false);
        } else {
            currentGuess = "";
            for(let i = 0; i < targetWord.length; i++) {
                if(foundLetters[i] !== ".") currentGuess += foundLetters[i]; else break;
            }
            currentGuess = targetWord[0];
            currentState.currentGuess = currentGuess;
            currentState.gameOver = false;
            localStorage.setItem('massalia_motus_state_' + todayStr, JSON.stringify(currentState));
            updateGridVisual(); buildKeyboard();
        }
    }
    isAnimating = false; 
}

function updateGridVisual() {
    for (let j = 0; j < targetWord.length; j++) {
        const cell = document.getElementById(`cell-${currentAttempt}-${j}`);
        if(cell) cell.textContent = (j < currentGuess.length) ? currentGuess[j] : (foundLetters[j] !== "." ? foundLetters[j] : ".");
    }
}

function fillGridRow(rowIndex, word, target) {
    let guessArr = word.split('');
    let targetArr = target.split('');
    let results = new Array(target.length).fill('absent');
    for (let i = 0; i < target.length; i++) {
        if (guessArr[i] === targetArr[i]) { results[i] = 'correct'; targetArr[i] = null; guessArr[i] = null; }
    }
    for (let i = 0; i < target.length; i++) {
        if (guessArr[i]) {
            let idx = targetArr.indexOf(guessArr[i]);
            if (idx !== -1) { results[i] = 'present'; targetArr[idx] = null; }
        }
    }
    for (let i = 0; i < target.length; i++) {
        const cell = document.getElementById(`cell-${rowIndex}-${i}`);
        if(cell) {
            cell.textContent = word[i];
            if (results[i] === 'correct') { cell.style.background = "#e74c3c"; cell.style.borderColor = "#e74c3c"; }
            else if (results[i] === 'present') { cell.style.background = "#f1c40f"; cell.style.borderColor = "#f1c40f"; cell.style.borderRadius = "50%"; }
            else { cell.style.background = "#2c3e50"; cell.style.borderColor = "#2c3e50"; }
        }
    }
}

function setupEventListener() {
    document.onkeydown = null; 
    document.onkeydown = (e) => {
        const k = e.key.toUpperCase();
        if (k === "ENTER") { e.preventDefault(); handleKey("ENTRÉE"); }
        else if (k === "BACKSPACE") { e.preventDefault(); handleKey("⌫"); }
        else if (/^[A-Z]$/.test(k)) handleKey(k);
    };
}

function finishGame(win) {
    const resultDiv = document.getElementById('motus-result');
    const emojiGrid = generateEmojiGrid();
    const nbEssais = win ? currentAttempt + 1 : "X";
    const shareText = `MOT DU JOUR ${nbEssais}/${maxAttempts}\n\n${emojiGrid}\n\nmassalia-codex.fr`;

    resultDiv.innerHTML = `
        <div class="codex-card fade-in" style="margin-top:20px;">
            <h3 class="titre-card" style="border:none;">
                ${win ? "🎉 VICTOIRE !" : "❌ DOMMAGE..."}
            </h3>
            
            <p class="texte-courant" style="text-align:center;">
                Le mot était : <strong style="color:var(--abysse); border-bottom:2px solid var(--or);">${targetWord}</strong>
            </p>
            
            <div class="info-box">
                <strong style="color:var(--or); font-size:0.75rem;">DÉFINITION :</strong><br>
                <span style="font-style:italic; color:#555;">"${definition}"</span>
            </div>

            <div style="display: flex; gap: 10px;">
                <button class="btn-secondary" onclick="shareScore(\`${shareText}\`)" style="flex:1;">
                    PARTAGER 📤
                </button>
                <button class="btn-primary" onclick="loadSection('epreuves')" style="flex:1;">
                    RETOUR 🏛️
                </button>
            </div>
            
            <div id="share-feedback" style="font-size:0.7rem; color:green; margin-top:5px; opacity:0; transition:opacity 0.5s;">Copié !</div>
        </div>
    `;
    const kb = document.getElementById('motus-keyboard');
    if(kb) kb.style.display = 'none';
}

function generateEmojiGrid() {
    let gridStr = "";
    for (let i = 0; i <= currentAttempt; i++) {
        if (i === currentAttempt && !gameOver) continue;
        for (let j = 0; j < targetWord.length; j++) {
            const cell = document.getElementById(`cell-${i}-${j}`);
            const color = cell.style.background;
            if (color === "rgb(231, 76, 60)" || color === "#e74c3c") gridStr += "🟥"; 
            else if (color === "rgb(241, 196, 15)" || color === "#f1c40f") gridStr += "🟡"; 
            else gridStr += "🟦"; 
        }
        gridStr += "\n";
    }
    return gridStr;
}

function shareScore(text) {
    if (navigator.share) {
        navigator.share({ title: 'Massalia Motus', text: text }).catch(console.error);
    } else {
        navigator.clipboard.writeText(text).then(() => {
            const feedback = document.getElementById('share-feedback');
            if(feedback) { feedback.style.opacity = "1"; setTimeout(() => feedback.style.opacity = "0", 2000); }
        });
    }
}