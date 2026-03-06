/**
 * MASSALIA QUIZ (Version Grille & Story Mode)
 */

// --- VARIABLES GLOBALES ---
let allQuestions = [];
let currentQuestions = [];
let score = 0;
let currentQuizId = "";
let currentDiff = "";

// --- CONFIGURATION ---
const pointsMap = {
    "facile": { correct: 10, faux: 0 },
    "moyen": { correct: 20, faux: 0 },
    "difficile": { correct: 30, faux: -10 }
};

const RANKS = [
    { min: 0, title: "Passager du Lacydon", icon: "⛵", next: 100 }, 
    { min: 101, title: "Gendre de Nann", icon: "🍷", next: 300 }, 
    { min: 301, title: "Maître de la Mer Grise", icon: "🌊", next: 600 }, 
    { min: 601, title: "Tailleur de Pierre", icon: "🏗️", next: 1000 }, 
    { min: 1001, title: "Moine de Saint-Victor", icon: "🕯️", next: 1500 }, 
    { min: 1501, title: "Corsaire du Roi", icon: "⚔️", next: 2200 }, 
    { min: 2201, title: "Portefaix de la Joliette", icon: "📦", next: 3000 }, 
    { min: 3001, title: "Minot du Panier", icon: "🏘️", next: 4000 }, 
    { min: 4001, title: "Bouscarle du Port", icon: "🗣️", next: 5500 }, 
    { min: 5501, title: "Phocéen Éternel", icon: "🌟", next: null } 
];

// --- 1. CHARGEMENT ---
async function loadQuiz() {
    const mainContainer = document.getElementById('app');
    mainContainer.innerHTML = "<div class='loader'>Préparation de l'arène...</div>";
    try {
        const response = await fetch('data/quiz.json'); 
        if (!response.ok) throw new Error("Fichier JSON introuvable");
        allQuestions = await response.json();
        displayQuizMenu();
    } catch (e) {
        console.error(e);
        mainContainer.innerHTML = `
            <div class='codex-card' style='text-align:center; color:red;'>
                <h3>Erreur de chargement</h3>
                <p>Impossible de lire les questions.</p>
                <p style="font-size:0.7rem; color:#666;">${e.message}</p>
            </div>`;
    }
}

// --- 2. CALCUL PROGRESSION ---
function getProgression() {
    let globalScore = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("quiz_score_")) {
            globalScore += parseInt(localStorage.getItem(key)) || 0;
        }
    }
    
    const currentRank = [...RANKS].reverse().find(r => globalScore >= r.min) || RANKS[0];
    let percent = 100;
    if (currentRank.next) {
        const range = currentRank.next - currentRank.min;
        const progress = globalScore - currentRank.min;
        percent = Math.max(0, Math.min(Math.floor((progress / range) * 100), 100));
    }
    return { globalScore, currentRank, percent };
}

// --- 3. MENU PRINCIPAL (MODE GRILLE) ---
function displayQuizMenu() {
    const mainContainer = document.getElementById('app');
    const prog = getProgression();
    const themes = [...new Set(allQuestions.map(q => q.theme))];

    mainContainer.innerHTML = `
        <div class="fade-in">
            <div class="codex-card" style="text-align:center; padding:15px; margin-bottom:15px; background:linear-gradient(135deg, #fff 0%, #fcfaf5 100%);">
                <div style="font-size: 2.5rem; margin-bottom:5px;">${prog.currentRank.icon}</div>
                <h2 class="titre-page" style="margin:0; font-size:1.2rem; border:none;">${prog.currentRank.title.toUpperCase()}</h2>
                
                <div class="date-badge" style="margin-top:5px; font-size:0.8rem;">
                    FORTUNE : ${prog.globalScore} 🪙
                </div>
                
                <div class="progress-container" style="margin-top:10px;">
                    <div id="progress-bar" style="width:${prog.percent}%"></div>
                </div>
                <div style="font-size:0.65rem; color:#666; margin-top:5px;">
                    Prochain grade : ${prog.currentRank.next ? prog.currentRank.next + " 🪙" : "MAXIMUS"}
                </div>
            </div>

            <div style="margin-bottom: 15px;">
                <select id="quizFilterSelect" onchange="renderQuizList()" class="select-standard" style="margin-bottom:0;">
                    <option value="tous">🌍 Tout afficher</option>
                    <optgroup label="Par Époque">
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

/* --- REMPLACE renderQuizList et AJOUTE toggleAccordion DANS JS/QUIZ.JS --- */

function renderQuizList() {
    const container = document.getElementById('quiz-list-container');
    const filterValue = document.getElementById('quizFilterSelect').value;
    
    // Regroupement (Toujours pareil)
    const groupedQuizzes = {};
    allQuestions.forEach(q => {
        const id = q.id_quiz || q.theme.toLowerCase(); 
        if (!groupedQuizzes[id]) {
            groupedQuizzes[id] = { title: q.titre_quiz || q.theme, theme: q.theme, questions: [] };
        }
        groupedQuizzes[id].questions.push(q);
    });

    let html = `<div class="quiz-list-accordion">`;
    let hasResults = false;

    Object.keys(groupedQuizzes).forEach((quizId, index) => {
        const quizData = groupedQuizzes[quizId];
        if (filterValue !== 'tous' && filterValue !== quizData.theme) return;
        hasResults = true;
        
        // Calcul des scores pour l'état global du chapitre
        const scores = {};
        const maxPoints = {};
        let totalScoreChapitre = 0;
        let totalMaxChapitre = 0;

        ['facile', 'moyen', 'difficile'].forEach(diff => {
            const qCount = quizData.questions.filter(q => q.difficulte === diff).length;
            maxPoints[diff] = qCount * pointsMap[diff].correct;
            const saveKey = `quiz_score_${quizId}_${diff}`;
            const stored = localStorage.getItem(saveKey);
            scores[diff] = stored ? parseInt(stored) : 0;
            
            if(maxPoints[diff] > 0) {
                totalScoreChapitre += scores[diff];
                totalMaxChapitre += maxPoints[diff];
            }
        });

        // État visuel du chapitre (Bandeau de couleur)
        let itemClass = "";
        if (totalScoreChapitre >= totalMaxChapitre && totalMaxChapitre > 0) itemClass = "finished";
        else if (totalScoreChapitre > 0) itemClass = "started";

        // Indicateur visuel (ex: "3/3 Terminé" ou "En cours")
        let statusLabel = "";
        if (itemClass === "finished") statusLabel = "✅ Maîtrisé";
        else if (totalScoreChapitre > 0) statusLabel = `Async ${Math.floor((totalScoreChapitre/totalMaxChapitre)*100)}%`;

        // Logique Verrouillage
        const isMoyenLocked = scores['facile'] <= 0 && maxPoints['facile'] > 0;
        const isDifficileLocked = scores['moyen'] <= 0 && maxPoints['moyen'] > 0;

        // Boutons internes
        let buttonsHtml = `
            ${createAccordionBtn(quizId, 'facile', scores['facile'], maxPoints['facile'], false)}
            ${createAccordionBtn(quizId, 'moyen', scores['moyen'], maxPoints['moyen'], isMoyenLocked)}
            ${createAccordionBtn(quizId, 'difficile', scores['difficile'], maxPoints['difficile'], isDifficileLocked)}
        `;

        // STRUCTURE HTML ACCORDÉON
        html += `
            <div class="quiz-accordion-item ${itemClass}" id="acc-item-${index}">
                <div class="quiz-accordion-header" onclick="toggleAccordion(${index})">
                    <div>
                        <div class="quiz-accordion-title">${quizData.title}</div>
                        <div class="quiz-accordion-subtitle">${quizData.theme} <span style="margin-left:10px; color:var(--or); font-weight:bold;">${statusLabel}</span></div>
                    </div>
                    <div class="accordion-chevron">▼</div>
                </div>

                <div class="quiz-accordion-body" id="acc-body-${index}">
                    <div class="quiz-levels-row">
                        ${buttonsHtml}
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div>`;

    if (!hasResults) container.innerHTML = "<div class='text-muted' style='text-align:center;'>Aucun défi trouvé.</div>";
    else container.innerHTML = html;
}

// Fonction pour l'animation d'ouverture
function toggleAccordion(index) {
    const item = document.getElementById(`acc-item-${index}`);
    const body = document.getElementById(`acc-body-${index}`);
    
    // Ferme les autres (optionnel, pour faire propre)
    document.querySelectorAll('.quiz-accordion-item.active').forEach(otherItem => {
        if (otherItem !== item) {
            otherItem.classList.remove('active');
            otherItem.querySelector('.quiz-accordion-body').style.maxHeight = null;
        }
    });

    // Bascule l'actuel
    item.classList.toggle('active');
    
    if (item.classList.contains('active')) {
        body.style.maxHeight = body.scrollHeight + "px"; // Ouvre à la bonne hauteur
    } else {
        body.style.maxHeight = null;
    }
}

// Helper pour les boutons à l'intérieur
function createAccordionBtn(quizId, diff, score, max, isLocked) {
    if (max === 0) return ""; // On n'affiche pas si vide

    let clickAction = `startQuiz('${quizId}', '${diff}')`;
    let label = diff.toUpperCase();
    let content = score === 0 ? "GO" : `${score}/${max}`;
    let classes = `btn-level-card lvl-${diff}`;
    
    if(score < 0) content = "⚠️";
    if(score >= max) { content = "✅"; classes += " completed"; }

    if (isLocked) {
        return `
            <div class="btn-level-card lvl-locked">
                <strong>${label}</strong>
                <span>🔒</span>
            </div>`;
    }

    return `
        <div class="${classes}" onclick="${clickAction}">
            <strong>${label}</strong>
            <span>${content}</span>
        </div>`;
}

function createMiniButton(quizId, diff, score, max, isLocked, labelRoman) {
    if (max === 0) return `<div class="btn-level-mini" style="opacity:0.1;">-</div>`;

    const isPerfect = (score >= max && max > 0);
    let classes = `btn-level-mini lvl-${diff}`;
    let iconContent = "";
    let clickAction = `startQuiz('${quizId}', '${diff}')`;

    if (isLocked) {
        return `
            <div class="btn-level-mini lvl-locked">
                <span class="lvl-num">${labelRoman}</span>
                <span class="lvl-score">🔒</span>
            </div>
        `;
    }

    if (isPerfect) {
        classes += " lvl-completed";
        iconContent = "✅";
    } else {
        if(score !== 0) iconContent = score < 0 ? "⚠️" : score;
        else iconContent = "GO";
    }

    return `
        <div class="${classes}" onclick="${clickAction}">
            <span class="lvl-num">${labelRoman}</span>
            <span class="lvl-score">${iconContent}</span>
        </div>
    `;
}

// --- 4. GAMEPLAY ---
function startQuiz(quizId, difficulte) {
    currentQuizId = quizId; 
    currentDiff = difficulte; 
    score = 0;
    
    let q = allQuestions.filter(q => (q.id_quiz === quizId || q.theme.toLowerCase() === quizId) && q.difficulte === difficulte);
    q = q.sort(() => 0.5 - Math.random()); 

    if (q.length === 0) { showToast("Niveau vide !"); return; }
    currentQuestions = q;
    displayQuestion(0);
}

function displayQuestion(index) {
    const mainContainer = document.getElementById('app');
    const q = currentQuestions[index];
    
    if (!q) { showResult(); return; }
    
    const p = (index / currentQuestions.length) * 100;
    const scoreColor = score < 0 ? '#c0392b' : 'var(--or)';

    mainContainer.innerHTML = `
        <div class="fade-in">
            <div class="progress-container" style="margin-bottom:15px;"><div id="progress-bar" style="width: ${p}%"></div></div>
            
            <div class="codex-card">
                <div style="text-align:center;">
                    <span class="date-badge">${q.titre_quiz || currentQuizId}</span>
                    <span style="font-size:0.7rem; color:#888; margin-left:10px;">${currentDiff.toUpperCase()}</span>
                </div>

                <h2 class="titre-card" style="margin-top:10px; border:none; text-align:left;">${q.question}</h2>
                
                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${q.reponses.map((r, i) => `<button class="btn-quiz-option" id="opt-${i}" onclick="checkAnswer(${index}, ${i})">${r}</button>`).join('')}
                </div>
                
                <div id="quiz-feedback" style="display:none; margin-top:20px; border-top:1px solid #eee; padding-top:15px; animation: fadeIn 0.3s;">
                    <div id="feedback-text" class="texte-courant" style="margin-bottom:15px;"></div>
                    <button class="btn-primary" onclick="displayQuestion(${index + 1})">CONTINUER ➔</button>
                </div>

                <div style="margin-top:15px; font-size:0.8rem; text-align:right; color:${scoreColor}; font-weight:bold;">
                    Score : <span id="live-score">${score}</span>
                </div>
            </div>
        </div>
    `;
}

function checkAnswer(qIndex, rIndex) {
    const q = currentQuestions[qIndex];
    const opts = document.querySelectorAll('.btn-quiz-option'); 
    const txt = document.getElementById('feedback-text');
    const liveScore = document.getElementById('live-score');
    const pts = pointsMap[q.difficulte];

    opts.forEach(btn => btn.disabled = true); 
    
    if (rIndex === q.correct) {
        document.getElementById(`opt-${rIndex}`).classList.add('correct');
        score += pts.correct;
        txt.innerHTML = `<strong style="color:green">Bonne réponse ! (+${pts.correct})</strong><br>${q.explication}`;
    } else {
        document.getElementById(`opt-${rIndex}`).classList.add('wrong');
        document.getElementById(`opt-${q.correct}`).classList.add('correct'); 
        
        if (pts.faux < 0) {
            score += pts.faux; 
            txt.innerHTML = `<strong style="color:#c0392b">Aïe ! (${pts.faux} pts)</strong><br>${q.explication}`;
        } else {
            txt.innerHTML = `<strong style="color:#c0392b">Raté...</strong><br>${q.explication}`;
        }
    }
    
    if (liveScore) {
        liveScore.innerText = score;
        liveScore.style.color = score < 0 ? '#c0392b' : 'var(--or)';
    }
    document.getElementById('quiz-feedback').style.display = "block";
}

function showResult() {
    const mainContainer = document.getElementById('app');
    const saveKey = `quiz_score_${currentQuizId}_${currentDiff}`;
    const storedScore = localStorage.getItem(saveKey);
    const oldScore = storedScore ? parseInt(storedScore) : -9999; 
    
    let message = "";
    if (storedScore === null || score > oldScore) {
        localStorage.setItem(saveKey, score);
        message = "Nouveau record enregistré !";
        if (score < 0) message = "Aïe... Dette enregistrée.";
    } else {
        message = `Record actuel : ${oldScore}`;
    }
    
    const maxPossible = currentQuestions.length * pointsMap[currentDiff].correct;
    const prog = getProgression();
    const scoreColor = score < 0 ? '#c0392b' : 'var(--or)';

    mainContainer.innerHTML = `
        <div class="codex-card fade-in" style="text-align:center;">
            <h2 class="titre-page">RÉSULTAT</h2>
            <div style="font-size: 0.9rem; color:#666; margin-bottom:10px;">${message}</div>
            <div style="font-size: 3rem; margin: 10px 0; color:${scoreColor}; font-family:'Cinzel';">
                ${score} <span style="font-size:1rem; color:#888;">/ ${maxPossible}</span>
            </div>
            <p class="texte-courant" style="text-align:center; margin-top:20px;">
                Fortune Totale : <strong>${prog.globalScore} 🪙</strong><br>
                Rang : <strong>${prog.currentRank.title}</strong>
            </p>
            <button class="btn-primary" onclick="displayQuizMenu()">RETOUR AU MENU</button>
        </div>
    `;
}