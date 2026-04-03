// Configuration API - Remplacer par l'URL de votre backend Render  // Commentaire descriptif.
const API_BASE = 'https://ai-agent-13vc.onrender.com'; // À remplacer par votre URL Render  // Déclare la constante de l'URL racine de l'API.

// Fonction utilitaire pour afficher le chargement  // Commentaire descriptif.
function showLoading(element, message = 'Chargement...') {  // Définit une fonction pour modifier l'état visuel d'un élément pendant l'attente.
    element.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;  // Injecte une icône FontAwesome animée et le texte du message dans l'élément.
    element.style.color = '#4299e1';  // Applique une couleur bleue via le style CSS inline.
}  // Fermeture de la fonction showLoading.

function hideLoading(element) {  // Définit une fonction pour réinitialiser l'état visuel de l'élément.
    element.style.color = '';  // Supprime la couleur spécifique appliquée précédemment.
}  // Fermeture de la fonction hideLoading.

// Chat simple  // Commentaire descriptif du bloc.
document.getElementById('chat-btn').addEventListener('click', async () => {  // Attache un écouteur d'événement 'clic' asynchrone sur le bouton de chat.
    const message = document.getElementById('chat-input').value.trim();  // Récupère et nettoie (espaces) la valeur du champ de saisie texte.
    if (!message) return;  // Interrompt l'exécution si le champ est vide.

    const responseDiv = document.getElementById('chat-response');  // Récupère l'élément HTML destiné à afficher la réponse.
    showLoading(responseDiv, 'Envoi en cours...');  // Active l'indicateur de chargement dans la zone de réponse.

    try {  // Débute le bloc de gestion d'erreurs pour la requête réseau.
        const response = await fetch(`${API_BASE}/chat`, {  // Effectue une requête HTTP asynchrone vers l'endpoint /chat.
            method: 'POST',  // Spécifie la méthode HTTP POST.
            headers: {  // Définit les en-têtes de la requête.
                'Content-Type': 'application/json',  // Indique que le corps de la requête est au format JSON.
            },  // Fermeture des headers.
            body: JSON.stringify({ message }),  // Convertit l'objet contenant le message en chaîne JSON.
        });  // Fin de l'appel fetch.

        const data = await response.json();  // Extrait et parse le corps de la réponse au format JSON.
        hideLoading(responseDiv);  // Désactive l'indicateur de chargement.
        responseDiv.textContent = data.reply || JSON.stringify(data, null, 2);  // Affiche la réponse textuelle ou l'objet JSON complet si 'reply' manque.
    } catch (error) {  // Capture les erreurs réseau ou de parsing.
        hideLoading(responseDiv);  // Désactive l'indicateur de chargement en cas d'erreur.
        responseDiv.textContent = `Erreur: {error.message}`;  // Affiche le message d'erreur technique dans la zone de réponse.
        responseDiv.style.color = '#e53e3e';  // Applique une couleur rouge pour signaler l'erreur.
    }  // Fin du bloc catch.
});  // Fermeture de l'écouteur d'événement du bouton de chat.

// Analyse par agent  // Commentaire descriptif du bloc agent.
document.getElementById('agent-btn').addEventListener('click', async () => {  // Attache un écouteur d'événement 'clic' asynchrone sur le bouton d'analyse.
    const text = document.getElementById('agent-input').value.trim();  // Récupère et nettoie le texte principal à analyser.
    const task = document.getElementById('agent-task').value.trim() || 'Analyse complète de ce texte';  // Récupère la tâche ou définit une valeur par défaut.

    if (!text) return;  // Interrompt l'exécution si aucun texte n'est fourni.

    const responseDiv = document.getElementById('agent-response');  // Récupère l'élément HTML pour l'affichage des résultats de l'agent.
    showLoading(responseDiv, 'Analyse en cours...');  // Active l'indicateur de chargement spécifique à l'agent.

    try {  // Débute le bloc de gestion d'erreurs pour l'analyse.
        const response = await fetch(`${API_BASE}/agent/analyze`, {  // Effectue une requête POST vers l'endpoint d'analyse de l'agent.
            method: 'POST',  // Spécifie la méthode POST.
            headers: {  // Définit les en-têtes.
                'Content-Type': 'application/json',  // Déclare le format JSON.
            },  // Fin des headers.
            body: JSON.stringify({ text, task }),  // Envoie le texte et la tâche sous forme de JSON.
        });  // Fin de l'appel fetch.

        const data = await response.json();  // Parse la réponse structurée de l'agent (contenant plan, steps, etc.).
        hideLoading(responseDiv);  // Désactive l'indicateur de chargement.

        let output = `📋 Tâche: ${data.task}\n\n🗂️ Plan:\n`;  // Initialise la chaîne de sortie avec l'intitulé de la tâche.
        data.plan.forEach((step, index) => {  // Parcourt la liste des étapes du plan initial.
            output += `${index + 1}. ${step}\n`;  // Formate chaque étape du plan avec sa numérotation.
        });  // Fin de la boucle du plan.

        output += `\n⚙️ Étapes exécutées:\n`;  // Ajoute une section pour les étapes réellement traitées par l'agent.
        data.steps.forEach(step => {  // Parcourt chaque objet d'étape détaillée reçue du backend.
            output += `Étape ${step.step_number}: ${step.step_name}\n`;  // Affiche le numéro et le nom de l'étape.
            output += `🔧 Outil: ${step.tool_used}\n`;  // Affiche l'outil LLM utilisé pour cette action.
            output += `📄 Résultat: ${step.result}\n`;  // Affiche la réponse brute de l'outil.
            output += `👁️ Observation: ${step.observation}\n\n`;  // Affiche la synthèse intermédiaire de l'étape.
        });  // Fin de la boucle des étapes exécutées.

        output += `🎯 Réponse finale: ${data.final_answer}\n`;  // Ajoute la conclusion synthétisée par l'agent.
        output += `📊 Total étapes: ${data.total_steps}`;  // Affiche le décompte total des opérations effectuées.

        responseDiv.textContent = output;  // Injecte la chaîne formatée complète dans l'interface.
    } catch (error) {  // Capture les erreurs durant le processus d'analyse.
        hideLoading(responseDiv);  // Désactive l'indicateur de chargement.
        responseDiv.textContent = `Erreur: ${error.message}`;  // Affiche l'erreur technique.
        responseDiv.style.color = '#e53e3e';  // Applique le style rouge d'erreur.
    }  // Fin du bloc catch.
});  // Fermeture de l'écouteur d'événement du bouton d'analyse.

// Vérifier status  // Commentaire descriptif du bloc de maintenance.
document.getElementById('status-btn').addEventListener('click', async () => {  // Attache un écouteur sur le bouton de vérification de l'API.
    const responseDiv = document.getElementById('status-response');  // Récupère l'élément d'affichage du statut.
    showLoading(responseDiv, 'Vérification...');  // Active l'état de chargement.

    try {  // Débute le bloc de gestion d'erreurs.
        const response = await fetch(`${API_BASE}/`);  // Effectue une requête GET simple sur la racine de l'API.
        const data = await response.json();  // Parse la réponse (généralement un message de santé de l'API).
        hideLoading(responseDiv);  // Désactive l'indicateur de chargement.
        responseDiv.textContent = JSON.stringify(data, null, 2);  // Affiche le JSON formaté avec une indentation de 2 espaces.
    } catch (error) {  // Capture les erreurs (ex: serveur éteint).
        hideLoading(responseDiv);  // Désactive l'indicateur de chargement.
        responseDiv.textContent = `Erreur: ${error.message}`;  // Affiche l'erreur.
        responseDiv.style.color = '#e53e3e';  // Applique la couleur rouge.
    }  // Fin du bloc catch.
});  // Fermeture de l'écouteur d'événement du bouton de statut.