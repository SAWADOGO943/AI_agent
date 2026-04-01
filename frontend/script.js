// ── SÉLECTION DES ÉLÉMENTS DU DOM ──────────────────────────────
const chatMessages = document.getElementById('chatMessages');
const userInput    = document.getElementById('userInput');
const sendBtn      = document.getElementById('sendBtn');
const loader       = document.getElementById('loader');

// URL du backend — à modifier si tu changes de port ou déploies
const API_URL = "https://AI-agent-backend.onrender.com/chat";


// ── FONCTION : Afficher une bulle de message ────────────────────
function appendMessage(text, sender) {
    // sender = 'user' ou 'bot'

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);

    const bubble = document.createElement('div');
    bubble.classList.add('message-bubble');

    // textContent (pas innerHTML) → protège contre les injections XSS
    bubble.textContent = text;

    messageDiv.appendChild(bubble);
    chatMessages.appendChild(messageDiv);

    scrollToBottom();
}


// ── FONCTION : Scroll automatique vers le bas ───────────────────
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}


// ── FONCTION : Gérer l'état de chargement ──────────────────────
function setLoading(isLoading) {
    if (isLoading) {
        loader.style.display = 'flex';  // Affiche les 3 points
        sendBtn.disabled     = true;    // Désactive le bouton
        userInput.disabled   = true;    // Désactive le champ
    } else {
        loader.style.display = 'none';  // Cache le loader
        sendBtn.disabled     = false;   // Réactive le bouton
        userInput.disabled   = false;   // Réactive le champ
        userInput.focus();              // Remet le curseur
    }
}


// ── FONCTION PRINCIPALE : Envoyer le message ───────────────────
async function sendMessage() {

    const userText = userInput.value.trim();

    // Ne fait rien si le champ est vide
    if (!userText) return;

    // 1. Affiche le message utilisateur
    appendMessage(userText, 'user');

    // 2. Vide le champ
    userInput.value = '';
    userInput.style.height = 'auto';

    // 3. Active le loader
    setLoading(true);

    // 4. Appel au backend
    try {
        const response = await fetch(API_URL, {
            method: 'POST',                           // On envoie → POST
            headers: {
                'Content-Type': 'application/json',   // Données au format JSON
            },
            body: JSON.stringify({ message: userText }) // Objet JS → texte JSON
        });

        if (!response.ok) {
            // Le serveur a répondu avec une erreur (4xx ou 5xx)
            const errorData = await response.json();
            throw new Error(errorData.detail || `Erreur serveur: ${response.status}`);
        }

        // Parse la réponse JSON → objet JavaScript { reply: "..." }
        const data = await response.json();

        // 5. Affiche la réponse du bot
        appendMessage(data.reply, 'bot');

    } catch (error) {
        console.error('Erreur:', error);
        appendMessage(
            `❌ Erreur : ${error.message}. Vérifiez que le backend est démarré.`,
            'bot'
        );
    } finally {
        // S'exécute TOUJOURS (succès ou erreur) → désactive le loader
        setLoading(false);
    }
}


// ── ÉVÉNEMENTS ─────────────────────────────────────────────────

// Clic sur le bouton Envoyer
sendBtn.addEventListener('click', sendMessage);

// Touche Entrée (sans Shift) → envoie
// Shift + Entrée → nouvelle ligne
userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

// Auto-resize du textarea selon le contenu
userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = userInput.scrollHeight + 'px';
});