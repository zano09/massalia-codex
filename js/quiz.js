/**
 * MASSALIA QUIZ (Version Gamification & Design Compact)
 */

let allQuestions = [];
let currentQuestions = [];
let score = 0;
let currentTheme = "";
let currentDiff = "";

// Système de points
const pointsMap = {
    "facile": { correct: 10, faux: 0 },
    "moyen": { correct: 20, faux: 0 },
    "difficile": { correct: 30, faux: -10 }
};

// NOUVEAUX GRADES & TROPHÉES
const RANKS = [
    { min: 0, title: "Passager du Lacydon", icon: "⛵", next: 100 }, 
    { min: 101, title: "Gendre de Nann", icon: "🍷", next: 300 }, 
    { min: 301, title: "Maître de la Mer Grise", icon: "🌊", next: 600 }, 
    { min: 601, title: "Tailleur de Pierre de Cassis", icon: "🏗️", next: 1000 }, 
    { min: 1001, title: "Moine de Saint-Victor", icon: "🕯️", next: 1500 }, 
    { min: 1501, title: "Corsaire du Roi", icon: "⚔️", next: 2200 }, 
    { min: 2201, title: "Portefaix de la Joliette", icon: "📦", next: 3000 }, 
    { min: 3001, title: "Minot du Panier", icon: "🏘️", next: 4000 }, 
    { min: 4001, title: "Bouscarle du Vieux-Port", icon: "🗣️", next: 5500 }, 
    { min: 5501, title: "Phocéen Éternel", icon: "🌟", next: null } 
];

// 1. CHARGEMENT
async function loadQuiz() {
    const mainContainer = document.getElementById('app');
    mainContainer.innerHTML = "<div class='loader'>Préparation de l'arène...</div>";
    try {
        const response = await fetch('data/quiz.json');
        allQuestions = await response.json();
        displayQuizMenu();
    } catch (e) {
        mainContainer.innerHTML = "<div class='codex-card'>Erreur de chargement des questions.</div>";
    }
}

// 2. CALCUL PROGRESSION
function getProgression() {
    let globalScore = 0;
    // On scanne le localStorage pour trouver tous les scores de quiz
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("quiz_")) globalScore += parseInt(localStorage.getItem(key)) || 0;
    }
    
    // On trouve le rang actuel
    // On inverse le tableau pour trouver le plus grand rang qui correspond au score
    const currentRank = [...RANKS].reverse().find(r => globalScore >= r.min) || RANKS[0];
    
    let percent = 100;
    if (currentRank.next) {
        const range = currentRank.next - currentRank.min;
        const progress = globalScore - currentRank.min;
        percent = Math.min(Math.floor((progress / range) * 100), 100);
    }
    return { globalScore, currentRank, percent };
}

// 3. MENU PRINCIPAL
function displayQuizMenu() {
    const mainContainer = document.getElementById('app');
    const prog = getProgression();
    const themes = [...new Set(allQuestions.map(q => q.theme))];

    mainContainer.innerHTML = `
        <div class="fade-in">
            <div class="codex-card" style="text-align:center; background:linear-gradient(135deg, #fff 0%, #fcfaf5 100%);">
                <div style="font-size: 3rem; margin-bottom:5px;">${prog.currentRank.icon}</div>
                <h2 class="titre-page" style="margin:0; border:none;">${prog.currentRank.title.toUpperCase()}</h2>
                
                <div class="date-badge" style="margin-top:10px; font-size:0.9rem;">
                    FORTUNE : ${prog.globalScore} 🪙 OBOLES
                </div>
                
                <div class="progress-container">
                    <div id="progress-bar" style="width:${prog.percent}%"></div>
                </div>
                <div style="font-size:0.7rem; color:#666;">
                    Prochain grade : ${prog.currentRank.next ? prog.currentRank.next + " 🪙" : "MAXIMUS"}
                </div>
            </div>

            <div style="margin-bottom: 15px;">
                <select id="quizFilterSelect" onchange="renderQuizList()" class="select-standard" style="margin-bottom:0;">
                    <option value="tous">🌍 Tout afficher</option>
                    <option value="encours">🔥 À faire</option>
                    <option value="100">✅ Terminés</option>
                    <optgroup label="Par Thème">
                        ${themes.map(t => `<option value="${t}">${t.charAt(0).toUpperCase() + t.slice(1)}</option>`).join('')}
                    </optgroup>
                </select>
            </div>

            <div id="quiz-list-container"></div>
            
            <button class="btn-secondary" onclick="loadSection('epreuves')" style="margin-top:10px;">RETOUR</button>
        </div>
    `;

    renderQuizList();
}

function renderQuizList() {
    const container = document.getElementById('quiz-list-container');
    const filterValue = document.getElementById('quizFilterSelect').value;
    const themes = [...new Set(allQuestions.map(q => q.theme))];
    let html = "";

    themes.forEach(theme => {
        if (filterValue !== 'tous' && filterValue !== '100' && filterValue !== 'encours' && filterValue !== theme) return;

        let buttonsHtml = "";
        let visible = false;

        // Boucle sur les 3 niveaux pour créer les boutons
        ['facile', 'moyen', 'difficile'].forEach(d => {
            const nb = allQuestions.filter(q => q.theme === theme && q.difficulte === d).length;
            
            // S'il n'y a pas de questions pour ce niveau, on affiche un bouton désactivé ou vide
            if (nb === 0) {
                buttonsHtml += `<div class="btn-quiz-level" style="opacity:0.3; cursor:default;">-</div>`;
                return;
            }

            const saved = parseInt(localStorage.getItem(`quiz_${theme}_${d}`)) || 0;
            const max = pointsMap[d].correct * nb;
            const isPerfect = (saved >= max && max > 0);
            
            if (filterValue === '100' && !isPerfect) return; // Filtre terminé
            if (filterValue === 'encours' && isPerfect) return; // Filtre à faire

            visible = true; // Si au moins un niveau match le filtre, on affiche le thème
            
            let statusClass = isPerfect ? "completed" : "";
            let icon = isPerfect ? "🏆" : "";
            let label = d === "facile" ? "FACILE" : (d === "moyen" ? "MOYEN" : "DIFFICILE");

            // BOUTON CÔTE À CÔTE
            buttonsHtml += `
                <button class="btn-quiz-level level-${d} ${statusClass}" onclick="startQuiz('${theme}', '${d}')">
                    <strong>${label}</strong>
                    <span>${saved}/${max} ${icon}</span>
                </button>
            `;
        });

        if (visible) {
            html += `
                <div class="quiz-theme-block">
                    <h3 class="quiz-theme-title">${theme.toUpperCase()}</h3>
                    <div class="quiz-levels-row">
                        ${buttonsHtml}
                    </div>
                </div>
            `;
        }
    });

    if (html === "") html = "<div class='text-muted' style='text-align:center; padding:20px;'>Aucun défi ne correspond à ta recherche.</div>";
    container.innerHTML = html;
}

// 4. JEU (GAMEPLAY)
function startQuiz(theme, difficulte) {
    currentTheme = theme; currentDiff = difficulte; score = 0;
    let q = allQuestions.filter(q => q.theme === theme && q.difficulte === difficulte);
    q = q.sort(() => 0.5 - Math.random()); // Mélange

    if (q.length === 0) { alert("Erreur: pas de questions."); return; }
    currentQuestions = q;
    displayQuestion(0);
}

function displayQuestion(index) {
    const mainContainer = document.getElementById('app');
    const q = currentQuestions[index];
    
    if (!q) { showResult(); return; }
    
    const p = (index / currentQuestions.length) * 100;
    
    mainContainer.innerHTML = `
        <div class="fade-in">
            <div class="progress-container" style="margin-bottom:15px;"><div id="progress-bar" style="width: ${p}%"></div></div>
            
            <div class="codex-card">
                <div style="text-align:center;"><span class="date-badge">${currentTheme}</span></div>
                <h2 class="titre-card" style="margin-top:10px; border:none; text-align:left;">${q.question}</h2>
                
                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${q.reponses.map((r, i) => `<button class="btn-quiz-option" id="opt-${i}" onclick="checkAnswer(${index}, ${i})">${r}</button>`).join('')}
                </div>
                
                <div id="quiz-feedback" style="display:none; margin-top:20px; border-top:1px solid #eee; padding-top:15px; animation: fadeIn 0.3s;">
                    <div id="feedback-text" class="texte-courant" style="margin-bottom:15px;"></div>
                    <button class="btn-primary" onclick="displayQuestion(${index + 1})">CONTINUER ➔</button>
                </div>
            </div>
        </div>
    `;
}

function checkAnswer(qIndex, rIndex) {
    const q = currentQuestions[qIndex];
    const opts = document.querySelectorAll('.btn-quiz-option'); 
    const txt = document.getElementById('feedback-text');
    const pts = pointsMap[q.difficulte];

    opts.forEach(btn => btn.disabled = true); // Bloque les boutons
    
    if (rIndex === q.correct) {
        document.getElementById(`opt-${rIndex}`).classList.add('correct');
        score += pts.correct;
        txt.innerHTML = `<strong style="color:green">Bonne réponse ! (+${pts.correct} 🪙)</strong><br>${q.explication}`;
    } else {
        document.getElementById(`opt-${rIndex}`).classList.add('wrong');
        document.getElementById(`opt-${q.correct}`).classList.add('correct'); // Montre la bonne réponse
        score += pts.faux;
        txt.innerHTML = `<strong style="color:#c0392b">Raté... (${pts.faux} 🪙)</strong><br>${q.explication}`;
    }
    document.getElementById('quiz-feedback').style.display = "block";
}

function showResult() {
    const mainContainer = document.getElementById('app');
    const saveKey = `quiz_${currentTheme}_${currentDiff}`;
    const oldScore = parseInt(localStorage.getItem(saveKey)) || 0;
    
    // Sauvegarde si meilleur score
    if (score > oldScore) localStorage.setItem(saveKey, score);
    
    const prog = getProgression();

    mainContainer.innerHTML = `
        <div class="codex-card fade-in" style="text-align:center;">
            <h2 class="titre-page">RÉSULTAT</h2>
            
            <div style="font-size: 3rem; margin: 20px 0; color:var(--or); font-family:'Cinzel';">${score} <span style="font-size:1.5rem;">🪙</span></div>
            <div class="date-badge">OBOLES GAGNÉES</div>
            
            <p class="texte-courant" style="text-align:center; margin-top:20px;">
                Fortune Totale : <strong>${prog.globalScore} 🪙</strong><br>
                Rang : <strong>${prog.currentRank.title}</strong>
            </p>
            
            <button class="btn-primary" onclick="displayQuizMenu()">RETOUR AU MENU</button>
        </div>
    `;
}